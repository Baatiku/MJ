import { previewImage } from '/lib/shop.js';

const panel = document.querySelector('.status-photos');
const grid = document.querySelector('#status-grid');
const search = document.querySelector('#status-search');
const share = document.querySelector('#status-share');
const clear = document.querySelector('#status-clear');
const result = document.querySelector('#status-result');
const downloads = document.querySelector('#status-downloads');
const downloadList = downloads.querySelector('ul');
const selected = new Map();
let photos = [];
let objectUrls = [];

async function prepare(photo) {
  const response = await fetch(photo.image);
  if (!response.ok) throw new Error('Photo unavailable.');
  const blob = await response.blob();
  const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const extension = extensions[blob.type];
  if (!extension || !blob.size) throw new Error('Unsupported photo format.');
  return new File([blob], photo.id + '.' + extension, { type: blob.type });
}

function refresh() {
  for (const url of objectUrls) URL.revokeObjectURL(url);
  objectUrls = [];
  const entries = [...selected.values()];
  const ready = entries.filter(({ file }) => file);
  const pending = entries.some(({ file, failed }) => !file && !failed);
  const files = ready.map(({ file }) => file);
  share.disabled = pending || !files.length || !navigator.canShare?.({ files });
  clear.disabled = !entries.length;
  result.textContent = !photos.length ? 'Add a visible product with a photo to start sharing.' : pending ? 'Preparing photos…' : entries.length ? `${entries.length} selected` : '';
  downloads.hidden = !entries.length;
  downloadList.replaceChildren(...entries.map(({ photo, file, failed }) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.textContent = photo.label;
    if (file) {
      link.href = URL.createObjectURL(file);
      objectUrls.push(link.href);
      link.download = file.name;
    } else if (failed) {
      link.href = photo.image;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent += ' · Open photo';
    } else {
      item.textContent = photo.label + ' · Preparing…';
      return item;
    }
    item.append(link);
    return item;
  }));
  if (!pending && entries.length && share.disabled) downloads.open = true;
  if (!pending && entries.some(({ failed }) => failed)) {
    result.textContent = `${files.length} ready to share · Save the others manually.`;
    downloads.open = true;
  }
}

function toggle(photo, checked) {
  if (!checked) {
    selected.delete(photo.id);
    refresh();
    return;
  }
  const entry = { photo };
  selected.set(photo.id, entry);
  refresh();
  prepare(photo).then((file) => { entry.file = file; }, () => { entry.failed = true; }).finally(() => {
    if (selected.get(photo.id) === entry) refresh();
  });
}

function render() {
  const query = search.value.trim().toLowerCase();
  grid.replaceChildren(...photos.filter(({ label }) => label.toLowerCase().includes(query)).map((photo) => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = selected.has(photo.id);
    checkbox.onchange = () => toggle(photo, checkbox.checked);
    const image = document.createElement('img');
    image.src = photo.image;
    image.alt = '';
    image.loading = 'lazy';
    const caption = document.createElement('span');
    caption.textContent = photo.label;
    label.append(checkbox, image, caption);
    return label;
  }));
}

search.oninput = render;
clear.onclick = () => { selected.clear(); render(); refresh(); };
share.onclick = async () => {
  const files = [...selected.values()].flatMap(({ file }) => file ? [file] : []);
  if (!files.length || !navigator.canShare?.({ files })) return;
  try {
    await navigator.share({ files });
  } catch (error) {
    if (error.name === 'AbortError') return;
    downloads.open = true;
    result.textContent = 'Could not open sharing. Save the photos below and post them from WhatsApp.';
  }
};

export const statusPhotos = {
  update(products) {
    photos = products.filter(({ hidden }) => !hidden).flatMap((product) => product.variants.map((variant) => ({
      id: product.id + '--' + variant.id,
      label: product.name + ' · ' + variant.name,
      image: previewImage(variant)
    })));
    panel.hidden = false;
    const current = new Map(photos.map((photo) => [photo.id, photo]));
    for (const [id, entry] of selected) {
      if (current.get(id)?.image !== entry.photo.image) selected.delete(id);
    }
    render();
    refresh();
  }
};
