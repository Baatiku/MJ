import { photoData } from '/lib/photo-upload.js';

const find = (id) => document.getElementById(id);
const business = find('business');
const look = find('look');
const productForm = find('product-form');
const colours = find('product-colours');
const notice = find('setup-notice');
const panels = [...document.querySelectorAll('[data-step]')];
let shop;
let appearance = {};
let products = [];
let editing;
let authenticated = false;
let busy = false;
let ready = false;
const slugify = (text) => text.toLowerCase().normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function request(path, method = 'GET', body) {
  const response = await fetch(path, {
    method,
    ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {})
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || 'Could not save. Please try again.'), { status: response.status });
  return data;
}

const account = (body) => request('/api/workspaces', 'POST', body);
const catalog = (body) => request('/api/shop-catalog?shop=' + encodeURIComponent(shop.slug), body ? 'PUT' : 'GET', body);

function step(index) {
  for (const panel of panels) panel.hidden = Number(panel.dataset.step) !== index;
  for (const label of document.querySelectorAll('[data-step-label]')) {
    if (Number(label.dataset.stepLabel) === index) label.setAttribute('aria-current', 'step');
    else label.removeAttribute('aria-current');
  }
  notice.textContent = '';
  panels[index].querySelector('input, button, a')?.focus({ preventScroll: true });
  panels[index].scrollIntoView({ block: 'start', behavior: 'smooth' });
}

async function save(action) {
  if (busy || !ready) return;
  busy = true;
  const buttons = [...document.querySelectorAll('button')];
  for (const button of buttons) button.disabled = true;
  notice.textContent = 'Saving…';
  try { await action(); }
  catch (error) { notice.textContent = error.message; }
  finally {
    busy = false;
    for (const button of buttons) button.disabled = false;
  }
}

function rememberShop() {
  history.replaceState(null, '', '/setup/?shop=' + encodeURIComponent(shop.slug));
  find('resume-setup').hidden = false;
  find('resume-link').href = '/manage/' + shop.slug + '/';
  business.elements.slug.value = shop.slug;
  business.elements.slug.readOnly = true;
}

function accountFields() {
  find('account-fields').hidden = authenticated;
  find('existing-account').hidden = !authenticated;
  for (const name of ['username', 'password']) {
    business.elements[name].required = !authenticated;
    business.elements[name].disabled = authenticated;
  }
}

business.elements.name.oninput = () => {
  if (shop || business.elements.slug.dataset.edited) return;
  business.elements.slug.value = slugify(business.elements.name.value).slice(0, 48).replace(/-$/, '');
};
business.elements.slug.oninput = () => { business.elements.slug.dataset.edited = 'true'; };

business.onsubmit = (event) => {
  event.preventDefault();
  save(async () => {
    const profile = Object.fromEntries(['name', 'description', 'whatsapp'].map((key) => [key, business.elements[key].value]));
    if (shop) {
      ({ shop } = await account({ action: 'update', id: shop.id, ...profile, published: shop.published }));
    } else {
      const action = authenticated ? 'create' : 'register';
      const body = { action, ...profile, slug: business.elements.slug.value };
      if (!authenticated) {
        body.username = business.elements.username.value;
        body.password = business.elements.password.value;
      }
      ({ shop } = await account(body));
      authenticated = true;
      business.elements.password.value = '';
      accountFields();
      rememberShop();
    }
    step(1);
  });
};

async function upload(file) {
  const data = await photoData(file);
  const { url } = await catalog({ action: 'upload-photo', data });
  return url;
}

async function saveAppearance(published) {
  const result = await catalog({ action: 'settings', ...shop, ...appearance, published });
  shop = result.shop;
  appearance = result.appearance;
}

look.onsubmit = (event) => {
  event.preventDefault();
  save(async () => {
    for (const name of ['logo', 'cover']) {
      const input = look.elements[name + 'File'];
      if (input.files[0]) {
        appearance[name] = await upload(input.files[0]);
        input.value = '';
        const preview = find(name + '-preview');
        preview.src = appearance[name];
        preview.hidden = false;
      }
    }
    appearance.headline = look.elements.headline.value;
    appearance.accent = look.elements.accent.value;
    await saveAppearance(shop.published);
    step(2);
  });
};

function addColour(variant = { id: crypto.randomUUID(), name: '', swatch: '#555555', image: '' }) {
  const row = find('setup-colour').content.firstElementChild.cloneNode(true);
  row.dataset.id = variant.id;
  row.dataset.image = variant.image;
  row.querySelector('[name=colour]').value = variant.name;
  row.querySelector('[name=swatch]').value = variant.swatch;
  const photo = row.querySelector('img');
  if (variant.image) { photo.src = variant.image; photo.hidden = false; }
  const input = row.querySelector('[name=photo]');
  let previewUrl;
  input.onchange = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (input.files[0]) {
      previewUrl = URL.createObjectURL(input.files[0]);
      photo.src = previewUrl;
      photo.hidden = false;
      row.dataset.image = '';
    } else {
      photo.src = row.dataset.image;
      photo.hidden = !row.dataset.image;
    }
  };
  row.cleanup = () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  row.querySelector('[data-remove-colour]').onclick = () => {
    if (colours.children.length === 1) { notice.textContent = 'Keep at least one colour and photo.'; return; }
    row.cleanup();
    row.remove();
  };
  colours.append(row);
}

function resetProduct(product) {
  editing = product;
  productForm.reset();
  for (const row of colours.children) row.cleanup();
  colours.replaceChildren();
  find('product-heading').textContent = product ? 'Edit ' + product.name : 'Add a product';
  find('cancel-product').hidden = !product;
  for (const name of ['name', 'description', 'category', 'price']) {
    productForm.elements[name].value = product?.[name] ?? '';
  }
  (product?.variants || [undefined]).forEach(addColour);
}

function renderProducts() {
  find('product-list').replaceChildren(...products.map((product) => {
    const item = document.createElement('article');
    const photo = document.createElement('img');
    photo.src = product.variants[0].image;
    photo.alt = '';
    const details = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = product.name;
    const note = document.createElement('p');
    note.textContent = product.variants.length + ' colour options' + (product.hidden ? ' · Hidden' : '');
    details.append(name, note);
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.textContent = 'Edit';
    edit.onclick = () => { if (!busy) { resetProduct(product); productForm.scrollIntoView({ block: 'start' }); } };
    item.append(photo, details, edit);
    return item;
  }));
}

find('add-setup-colour').onclick = () => {
  if (colours.children.length >= 16) { notice.textContent = 'Each product can have up to 16 colours.'; return; }
  addColour();
};
find('cancel-product').onclick = () => resetProduct();

productForm.onsubmit = (event) => {
  event.preventDefault();
  save(async () => {
    const variants = [];
    for (const row of colours.children) {
      const file = row.querySelector('[name=photo]').files[0];
      if (file) {
        row.dataset.image = await upload(file);
        row.querySelector('[name=photo]').value = '';
      }
      if (!row.dataset.image) throw new Error('Upload a photo for every colour.');
      variants.push({
        id: row.dataset.id, name: row.querySelector('[name=colour]').value,
        swatch: row.querySelector('[name=swatch]').value, image: row.dataset.image
      });
    }
    const name = productForm.elements.name.value;
    const product = {
      ...editing,
      id: editing?.id || (slugify(name).slice(0, 46).replace(/-$/, '') || 'product') + '-' + crypto.randomUUID().slice(0, 8),
      name, description: productForm.elements.description.value, category: slugify(productForm.elements.category.value),
      price: productForm.elements.price.value === '' ? null : productForm.elements.price.valueAsNumber,
      revision: editing?.revision ?? 0, position: editing?.position ?? Math.min(100000, products.length * 10),
      hidden: editing?.hidden ?? false, available: editing?.available ?? true, variants
    };
    const { product: saved } = await catalog({ action: 'save-product', product });
    products = [...products.filter(({ id }) => id !== saved.id), saved].sort((a, b) => a.position - b.position);
    resetProduct();
    renderProducts();
    notice.textContent = 'Product saved. Add another or review your shop.';
  });
};

for (const button of document.querySelectorAll('[data-back]')) {
  button.onclick = () => { if (!busy) step(Number(button.dataset.back)); };
}

find('review-shop').onclick = () => {
  if (!products.some(({ hidden }) => !hidden)) { notice.textContent = 'Save at least one product before publishing.'; return; }
  if (productForm.elements.name.value || [...colours.children].some((row) => row.querySelector('[name=photo]').files.length)) {
    notice.textContent = 'Save your current product first, or cancel the edit.';
    return;
  }
  const summary = find('shop-summary');
  const title = document.createElement('h3');
  title.textContent = shop.name;
  const details = document.createElement('p');
  details.textContent = products.filter(({ hidden }) => !hidden).length + ' products · WhatsApp +' + shop.whatsapp;
  summary.replaceChildren(title, details);
  find('preview-shop').href = '/shops/' + shop.slug + '/?preview=1';
  step(3);
};

find('publish-shop').onclick = () => save(async () => {
  if (!shop.whatsapp || !products.some(({ hidden }) => !hidden)) throw new Error('Add your WhatsApp number and at least one product.');
  await saveAppearance(true);
  for (const panel of panels) panel.hidden = true;
  find('setup-complete').hidden = false;
  const url = new URL('/shops/' + shop.slug + '/', location.origin).href;
  find('shop-url').value = find('open-shop').href = url;
  find('owner-dashboard').href = '/manage/' + shop.slug + '/';
  notice.textContent = 'Your shop is live and ready to share.';
  find('setup-complete').scrollIntoView({ block: 'start' });
});

find('copy-shop').onclick = async () => {
  try {
    await navigator.clipboard.writeText(find('shop-url').value);
    notice.textContent = 'Shop link copied.';
  } catch {
    find('shop-url').select();
    notice.textContent = 'Select and copy your shop link.';
  }
};

async function load() {
  try {
    await request('/api/workspaces');
    authenticated = true;
    ready = true;
  } catch (error) {
    if (error.status === 401) ready = true;
    else notice.textContent = 'Shop creation is being prepared. Please try again shortly.';
  }
  accountFields();
  const slug = new URLSearchParams(location.search).get('shop');
  if (slug && authenticated) {
    try {
      ({ shop, products, appearance } = await request('/api/shop-catalog?shop=' + encodeURIComponent(slug)));
      for (const key of ['name', 'description', 'whatsapp']) business.elements[key].value = shop[key];
      look.elements.headline.value = appearance.headline || '';
      look.elements.accent.value = appearance.accent || '#875749';
      for (const key of ['logo', 'cover']) {
        if (appearance[key]) { find(key + '-preview').src = appearance[key]; find(key + '-preview').hidden = false; }
      }
      rememberShop();
      renderProducts();
      step(products.length ? 3 : 1);
      if (products.length) {
        const summary = document.createElement('p');
        summary.textContent = shop.name + ' · ' + products.length + ' products · WhatsApp +' + shop.whatsapp;
        find('shop-summary').replaceChildren(summary);
        find('preview-shop').href = '/shops/' + shop.slug + '/?preview=1';
      }
    } catch (error) { notice.textContent = error.message; ready = false; }
  } else if (slug) {
    ready = false;
    notice.textContent = 'Sign in through Owner sign-in to continue editing your saved shop.';
  }
  business.querySelector('[type=submit]').disabled = !ready;
}

resetProduct();
load();
