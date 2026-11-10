import { photoData } from '/lib/photo-upload.js';
import { categories } from '/catalog/products.js';
import { displayWhatsAppNumber } from '/lib/shop.js';
import { assistantPanel } from './whatsapp-assistant.js';
import { statusPhotos } from './status-photos.js';

const shopSlug = /^\/manage\/([a-z0-9-]+)\/?$/.exec(location.pathname)?.[1];
const maknoonAdmin = !shopSlug || shopSlug === 'maknoon-jamil';
if (maknoonAdmin) {
  document.body.setAttribute('data-maknoon-admin', '');
  document.querySelector('.maknoon-priority-help').hidden = false;
}
const endpoint = shopSlug ? '/api/shop-catalog?shop=' + shopSlug : '/api/admin';
const find = (selector) => document.querySelector(selector);
const login = find('#login');
const dashboard = find('#dashboard');
const editor = find('#editor');
const variants = find('#variants');
const notice = find('#notice');
const shell = find('.admin');
const sectionNav = find('.admin-sections');
const settings = find('#shop-settings');
const numberForm = find('#order-number-form');
const appearance = find('#appearance');
const shopFields = ['name', 'description', 'whatsapp', 'headline', 'banner', 'logo', 'cover', 'accent'];
const slugify = (value) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
if (shopSlug) {
  numberForm.hidden = find('#legacy-category').hidden = true;
  appearance.hidden = find('#new-product').hidden = false;
  for (const field of document.querySelectorAll('.workspace-field')) field.hidden = false;
  editor.elements.customCategory.required = true;
  find('#manage-shops').href = '/manage/';
  find('#manage-shops').textContent = 'My shops ↗';
  find('#view-shop').href = '/shops/' + shopSlug + '/?preview=1';
}
const sectionLinks = [...sectionNav.querySelectorAll('a')];
const sections = sectionLinks.map((link) => link.hash.slice(1));

function selectSection() {
  const requested = location.hash.slice(1);
  const active = sections.includes(requested) ? requested : 'dashboard';
  for (const id of sections) find('#' + id).toggleAttribute('data-selected-panel', id === active);
  for (const link of sectionLinks) {
    if (link.hash === '#' + active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

window.addEventListener('hashchange', selectSection);
let catalog = [];
let current;

for (const { id, name } of categories) editor.elements.category.add(new Option(name, id));

async function api(method = 'GET', body) {
  const response = await fetch(endpoint, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {})
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || 'Catalog editing is unavailable.'), { status: response.status });
  return data;
}

function renderList() {
  const query = find('#search').value.trim().toLowerCase();
  const buttons = catalog.filter(({ name }) => name.toLowerCase().includes(query)).map((product) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = product.name;
    button.setAttribute('aria-current', String(product.id === current?.id));
    const status = document.createElement('small');
    status.textContent = product.hidden ? 'Hidden' : product.available ? 'Listed · Available' : 'Listed · Unavailable';
    button.append(status);
    button.onclick = () => {
      openProduct(product);
      if (window.matchMedia('(max-width: 700px)').matches) editor.scrollIntoView({ block: 'start' });
    };
    return button;
  });
  find('#list').replaceChildren(...buttons);
}

function addColour(variant) {
  const row = find('#variant').content.firstElementChild.cloneNode(true);
  row.dataset.id = variant.id;
  const image = row.querySelector('[name=image]');
  const photo = row.querySelector('img');
  row.querySelector('[name=colour]').value = variant.name;
  row.querySelector('[name=swatch]').value = variant.swatch;
  image.value = variant.image;
  function updatePhoto() {
    const value = image.value.trim();
    if (/^(https:\/\/|\/(?:images|previews|shop-media)\/)/.test(value)) photo.src = value;
    else photo.removeAttribute('src');
  }
  updatePhoto();
  image.onchange = updatePhoto;
  if (shopSlug) {
    const upload = row.querySelector('[data-upload]');
    upload.hidden = false;
    upload.querySelector('input').onchange = (event) => uploadPhoto(event.target, image, updatePhoto);
  }
  row.querySelector('.remove').onclick = () => {
    if (variants.children.length > 1) row.remove();
    else notice.textContent = 'Keep at least one colour.';
  };
  if (maknoonAdmin) {
    const priority = row.querySelector('[data-priority]');
    priority.hidden = false;
    priority.querySelector('[data-up]').onclick = () => {
      if (row.previousElementSibling) variants.insertBefore(row, row.previousElementSibling);
    };
    priority.querySelector('[data-down]').onclick = () => {
      if (row.nextElementSibling) variants.insertBefore(row.nextElementSibling, row);
    };
  }
  variants.append(row);
}

function openProduct(product) {
  current = product;
  find('#product-title').textContent = product.name || 'New product';
  editor.elements.customCategory.value = product.category || '';
  editor.elements.position.value = product.position ?? 0;
  find('#delete-product').hidden = !shopSlug || !product.revision;
  for (const field of ['name', 'price', 'category', 'description']) editor.elements[field].value = product[field] ?? '';
  for (const field of ['hidden', 'available']) editor.elements[field].checked = product[field];
  variants.replaceChildren();
  product.variants.forEach(addColour);
  if (maknoonAdmin) variants.firstElementChild?.querySelector('[data-default]')?.setAttribute('checked', '');
  editor.hidden = false;
  renderList();
}

async function load() {
  try {
    const data = await api();
    if (data.migrated) { location.replace(data.migrated); return; }
    catalog = data.products;
    if (shopSlug) renderSettings(data);
    else numberForm.elements.orderNumber.value = displayWhatsAppNumber(data.orderNumber);
    sectionNav.hidden = settings.hidden = find('#logout').hidden = false;
    shell.setAttribute('data-signed-in', '');
    selectSection();
    login.hidden = true;
    dashboard.hidden = false;
    assistantPanel.show();
    statusPhotos.update(catalog);
    renderList();
  } catch (error) {
    login.hidden = shopSlug || error.status !== 401;
    if (shopSlug && error.status === 401) {
      location.replace('/manage/');
      return;
    }
    dashboard.hidden = true;
    sectionNav.hidden = settings.hidden = find('#logout').hidden = true;
    shell.removeAttribute('data-signed-in');
    assistantPanel.hide();
    statusPhotos.update([]);
    find('#status-photos').hidden = true;
    if (error.status !== 401) notice.textContent = error.message;
    if (!shopSlug && (error.status === 404 || error.status === 503)) {
      try {
        const response = await fetch('/');
        if (!response.ok) return;
        const shop = new DOMParser().parseFromString(await response.text(), 'text/html');
        const publicCatalog = JSON.parse(shop.querySelector('#catalog-data').textContent);
        statusPhotos.update(publicCatalog);
      } catch {
        // The editor's error stays visible if the public catalog is unavailable.
      }
    }
  }
}

async function submit(form, action) {
  const button = form.querySelector('button[type=submit]');
  button.disabled = true;
  notice.textContent = '';
  try { await action(); } catch (error) { notice.textContent = error.message; }
  finally { button.disabled = false; }
}

numberForm.onsubmit = (event) => {
  event.preventDefault();
  submit(numberForm, async () => {
    const { orderNumber } = await api('PUT', {
      action: 'set-order-number', orderNumber: numberForm.elements.orderNumber.value
    });
    numberForm.elements.orderNumber.value = displayWhatsAppNumber(orderNumber);
    notice.textContent = 'Order number saved. Your storefront now uses it.';
  });
};

login.onsubmit = (event) => {
  event.preventDefault();
  submit(login, async () => {
    await api('POST', { password: login.elements.password.value });
    login.reset();
    await load();
  });
};
find('#logout').onclick = async () => {
  try {
    if (shopSlug) {
      const response = await fetch('/api/workspaces', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' })
      });
      if (!response.ok) throw new Error('Sign-out failed. Try again.');
      location.assign('/manage/');
      return;
    }
    await api('DELETE');
    current = undefined;
    catalog = [];
    editor.hidden = true;
    variants.replaceChildren();
    await load();
  } catch (error) { notice.textContent = error.message; }
};
find('#search').oninput = renderList;
find('#add-colour').onclick = () => {
  if (variants.children.length >= 32) {
    notice.textContent = 'A product can have up to 32 colours.';
    return;
  }
  addColour({ id: crypto.randomUUID(), name: '', swatch: '#555555', image: '' });
  variants.lastElementChild.querySelector('[name=colour]').focus();
};
editor.onsubmit = (event) => {
  event.preventDefault();
  submit(editor, async () => {
    const edited = current;
    const ordered = Array.from(variants.children);
    if (maknoonAdmin) {
      const chosen = ordered.find((row) => row.querySelector('[data-default]').checked);
      if (chosen) ordered.unshift(...ordered.splice(ordered.indexOf(chosen), 1));
    }
    const product = {
      ...edited,
      name: editor.elements.name.value,
      price: editor.elements.price.value === '' ? null : editor.elements.price.valueAsNumber,
      category: shopSlug ? slugify(editor.elements.customCategory.value) : editor.elements.category.value,
      description: editor.elements.description.value,
      available: editor.elements.available.checked,
      hidden: editor.elements.hidden.checked,
      variants: ordered.map((row) => ({
        id: row.dataset.id,
        name: row.querySelector('[name=colour]').value,
        swatch: row.querySelector('[name=swatch]').value,
        image: row.querySelector('[name=image]').value.trim()
      }))
    };
    if (shopSlug) {
      product.id ||= (slugify(product.name).slice(0, 46).replace(/-$/, '') || 'product') + '-' + crypto.randomUUID().slice(0, 8);
      product.position = editor.elements.position.valueAsNumber;
    }
    const { product: saved } = await api('PUT', shopSlug ? { action: 'save-product', product } : product);
    catalog = catalog.some(({ id }) => id === saved.id)
      ? catalog.map((item) => item.id === saved.id ? saved : item)
      : [...catalog, saved];
    if (shopSlug) catalog.sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
    if (current === edited) openProduct(saved);
    else renderList();
    statusPhotos.update(catalog);
    notice.textContent = 'Product saved.';
  });
};
function renderSettings({ shop, appearance: values }) {
  const profile = { ...shop, ...values };
  find('#view-shop').href = shop.published
    ? (shopSlug === 'maknoon-jamil' ? '/' : '/shops/' + shopSlug + '/')
    : '/shops/' + shopSlug + '/?preview=1';
  find('.admin-header .kicker').textContent = shop.name;
  document.title = 'Shop admin | ' + shop.name;
  for (const key of shopFields) appearance.elements[key].value = profile[key] || (key === 'accent' ? '#875749' : '');
  appearance.elements.published.checked = shop.published;
  appearance.elements.categoryLabels.value = Object.entries(values.categoryLabels || {}).map(([key, label]) => key + ' = ' + label).join('\n');
}

async function uploadPhoto(input, destination, updated = () => {}) {
  const file = input.files[0];
  if (!file) return;
  const product = current;
  const form = input.closest('form');
  const save = form.querySelector('[type=submit]');
  input.setAttribute('data-uploading', '');
  input.disabled = save.disabled = true;
  notice.textContent = 'Uploading photo…';
  try {
    const data = await photoData(file);
    const { url } = await api('PUT', { action: 'upload-photo', data });
    if (form === editor && current !== product) return;
    destination.value = url;
    updated();
    notice.textContent = 'Photo uploaded. Save your changes to use it.';
  } catch (error) { notice.textContent = error.message; }
  finally {
    input.value = '';
    input.removeAttribute('data-uploading');
    input.disabled = false;
    save.disabled = Boolean(form.querySelector('[data-uploading]'));
  }
}

for (const input of appearance.querySelectorAll('[data-photo]')) {
  input.onchange = () => uploadPhoto(input, appearance.elements[input.dataset.photo]);
}
appearance.onsubmit = (event) => {
  event.preventDefault();
  submit(appearance, async () => {
    const categoryLabels = Object.fromEntries(appearance.elements.categoryLabels.value.split('\n').filter((line) => line.trim()).map((line) => {
      const index = line.indexOf('=');
      if (index < 1) throw new Error('Enter category labels as name = Display Name.');
      return [slugify(line.slice(0, index)), line.slice(index + 1).trim()];
    }));
    const profile = Object.fromEntries(shopFields.map((key) => [key, appearance.elements[key].value]));
    const result = await api('PUT', { action: 'settings', ...profile, categoryLabels, published: appearance.elements.published.checked });
    renderSettings(result);
    notice.textContent = result.shop.published ? 'Settings saved. Your storefront is published.' : 'Settings saved. Your storefront is private.';
  });
};

find('#new-product').onclick = () => {
  openProduct({ id: '', revision: 0, position: Math.min(100000, (catalog.at(-1)?.position ?? 0) + 10), available: true,
    variants: [{ id: crypto.randomUUID(), name: '', swatch: '#555555', image: '' }] });
  editor.scrollIntoView({ block: 'start' });
  editor.elements.name.focus();
};

find('#delete-product').onclick = async () => {
  const product = current;
  if (!window.confirm('Delete ' + product.name + ' from this shop?')) return;
  try {
    await api('PUT', { action: 'delete-product', id: product.id, revision: product.revision });
    catalog = catalog.filter(({ id }) => id !== product.id);
    if (current?.id === product.id) { current = undefined; editor.hidden = true; }
    renderList();
    statusPhotos.update(catalog);
    notice.textContent = 'Product deleted.';
  } catch (error) { notice.textContent = error.message; }
};

load();
