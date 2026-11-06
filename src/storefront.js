import { orderLink, variantPath } from './lib/shop.js';

const catalogData = document.querySelector('#catalog-data');
const products = JSON.parse(catalogData.textContent);

for (const product of products) {
  const card = document.getElementById(product.id);
  const options = card.querySelector('fieldset');
  const photo = card.querySelector('.product-media');
  const image = photo.querySelector('img');
  const selected = card.querySelector('[data-selected]');
  const order = card.querySelector('.order');
  function updateSelection() {
    const variant = product.variants.find(({ id }) => id === options.querySelector(':checked').value);
    image.src = variant.image;
    image.alt = `${product.name} in ${variant.name}`;
    selected.textContent = variant.name;
    photo.href = variantPath(product, variant);
    if (order) order.href = orderLink(product, variant, location.origin, catalogData.dataset.orderNumber);
  }
  options.addEventListener('change', updateSelection);
  options.hidden = false;
  updateSelection();
  window.addEventListener('pageshow', updateSelection);
}

const filters = document.querySelector('.filters');
const filterButtons = [...filters.querySelectorAll('button')];
const cards = [...document.querySelectorAll('[data-category]')];
const result = document.querySelector('[data-result-count]');

function showCategory(category) {
  const active = filterButtons.some((button) => button.dataset.filter === category) ? category : 'all';
  for (const button of filterButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.filter === active));
  }
  let visible = 0;
  for (const card of cards) {
    card.hidden = active !== 'all' && card.dataset.category !== active;
    if (!card.hidden) visible += 1;
  }
  result.textContent = `${visible} styles shown`;
}

function categoryFromUrl() {
  return new URL(location.href).searchParams.get('category');
}

filters.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-filter]');
  if (!button) return;
  const url = new URL(location.href);
  const category = button.dataset.filter;
  if (category === 'all') url.searchParams.delete('category');
  else url.searchParams.set('category', category);
  if (url.href !== location.href) history.pushState(null, '', url);
  showCategory(category);
});

window.addEventListener('popstate', () => showCategory(categoryFromUrl()));
filters.hidden = false;
showCategory(categoryFromUrl());
