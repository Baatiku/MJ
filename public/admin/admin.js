import { categories } from '/catalog/products.js';
import { displayWhatsAppNumber } from '/lib/shop.js';
import { statusPhotos } from './status-photos.js';

const find = (selector) => document.querySelector(selector);
const login = find('#login');
const dashboard = find('#dashboard');
const editor = find('#editor');
const variants = find('#variants');
const notice = find('#notice');
find('#shop-number').textContent = displayWhatsAppNumber();
let catalog = [];
let current;

for (const { id, name } of categories) editor.elements.category.add(new Option(name, id));

async function api(method = 'GET', body) {
  const response = await fetch('/api/admin', {
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
    button.onclick = () => openProduct(product);
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
    if (/^(https:\/\/|\/(?:images|previews)\/)/.test(value)) photo.src = value;
    else photo.removeAttribute('src');
  }
  updatePhoto();
  image.onchange = updatePhoto;
  row.querySelector('.remove').onclick = () => {
    if (variants.children.length > 1) row.remove();
    else notice.textContent = 'Keep at least one colour.';
  };
  variants.append(row);
}

function openProduct(product) {
  current = product;
  find('#product-title').textContent = product.name;
  for (const field of ['name', 'price', 'category', 'description']) editor.elements[field].value = product[field] ?? '';
  for (const field of ['hidden', 'available']) editor.elements[field].checked = product[field];
  variants.replaceChildren();
  product.variants.forEach(addColour);
  editor.hidden = false;
  renderList();
}

async function load() {
  try {
    ({ products: catalog } = await api());
    login.hidden = true;
    dashboard.hidden = false;
    statusPhotos.update(catalog);
    renderList();
  } catch (error) {
    login.hidden = error.status !== 401;
    dashboard.hidden = true;
    statusPhotos.update([]);
    if (error.status !== 401) notice.textContent = error.message;
    if (error.status === 404 || error.status === 503) {
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
  if (variants.children.length >= 16) {
    notice.textContent = 'A product can have up to 16 colours.';
    return;
  }
  addColour({ id: crypto.randomUUID(), name: '', swatch: '#555555', image: '' });
  variants.lastElementChild.querySelector('[name=colour]').focus();
};
editor.onsubmit = (event) => {
  event.preventDefault();
  submit(editor, async () => {
    const product = {
      ...current,
      name: editor.elements.name.value,
      price: editor.elements.price.value === '' ? null : editor.elements.price.valueAsNumber,
      category: editor.elements.category.value,
      description: editor.elements.description.value,
      available: editor.elements.available.checked,
      hidden: editor.elements.hidden.checked,
      variants: Array.from(variants.children, (row) => ({
        id: row.dataset.id,
        name: row.querySelector('[name=colour]').value,
        swatch: row.querySelector('[name=swatch]').value,
        image: row.querySelector('[name=image]').value.trim()
      }))
    };
    const { product: saved } = await api('PUT', product);
    catalog = catalog.map((item) => item.id === saved.id ? saved : item);
    if (current.id === saved.id) openProduct(saved);
    else renderList();
    statusPhotos.update(catalog);
    notice.textContent = 'Product saved.';
  });
};
load();
