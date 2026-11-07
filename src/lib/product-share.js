import { formatNaira, previewImage, variantPath } from './shop.js';

export function shareDetails(product, variant, { home = '/', name = 'Maknoon Jamil', origin = location.origin } = {}) {
  const title = product.name + ' in ' + variant.name;
  const url = new URL(variantPath(product, variant, home), origin).href;
  const price = product.price === null ? '' : formatNaira(product.price) + '\n';
  const availability = product.available === false ? 'Currently unavailable.\n' : '';
  return {
    title,
    text: title + '\n' + name + '\n' + price + availability + product.description + '\n\n' + url,
    url,
    image: new URL(previewImage(variant), origin).href,
    filename: product.id + '-' + variant.id
  };
}

let dialog;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function showShare(details) {
  if (dialog?.open) return;
  let releasePhoto = () => {};
  const modal = element('dialog', '', 'product-share-dialog');
  dialog = modal;
  modal.setAttribute('aria-labelledby', 'share-product-title');
  const heading = element('h2', 'Share this style');
  heading.id = 'share-product-title';
  const close = element('button', 'Close', 'share-close');
  close.type = 'button';
  close.onclick = () => modal.close();
  const photo = element('img');
  photo.src = details.image;
  photo.alt = details.title;
  const caption = element('textarea');
  caption.value = details.text;
  caption.readOnly = true;
  caption.setAttribute('aria-label', 'Product caption and link');
  const actions = element('div', '', 'share-actions');
  const native = element('button', 'Preparing photo…', 'share-photo');
  native.type = 'button';
  native.disabled = true;
  const whatsapp = element('a', 'WhatsApp');
  whatsapp.href = 'https://wa.me/?text=' + encodeURIComponent(details.text);
  whatsapp.target = '_blank';
  whatsapp.rel = 'noopener noreferrer';
  const save = element('a', 'Open photo');
  save.href = details.image;
  save.target = '_blank';
  save.rel = 'noopener noreferrer';
  const copy = element('button', 'Copy caption & link');
  copy.type = 'button';
  const notice = element('p', '', 'share-notice');
  notice.setAttribute('role', 'status');
  copy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(details.text);
      notice.textContent = 'Caption and product link copied.';
    } catch {
      caption.focus();
      caption.select();
      notice.textContent = 'Select and copy the caption above.';
    }
  };
  const hint = element('p', 'Choose WhatsApp, then a contact or My Status if offered. You can also save the photo and copy the caption.');
  actions.append(native, whatsapp, save, copy);
  modal.append(heading, close, photo, caption, actions, hint, notice);
  const controller = new AbortController();
  modal.addEventListener('close', () => {
    controller.abort();
    releasePhoto();
    modal.remove();
  }, { once: true });
  document.body.append(modal);
  modal.showModal();
  if (!navigator.share || !navigator.canShare) {
    native.hidden = true;
    return;
  }
  fetch(details.image, { signal: controller.signal }).then(async (response) => {
    if (!response.ok) throw new Error('Photo unavailable');
    const blob = await response.blob();
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[blob.type];
    if (!extension || !blob.size || blob.size > 12 * 1024 * 1024) throw new Error('Unsupported photo');
    if (!modal.open) return;
    const file = new File([blob], details.filename + '.' + extension, { type: blob.type });
    const objectUrl = URL.createObjectURL(file);
    releasePhoto = () => URL.revokeObjectURL(objectUrl);
    save.href = objectUrl;
    save.download = file.name;
    save.textContent = 'Save photo';
    const data = { files: [file], title: details.title, text: details.text };
    if (!navigator.canShare({ files: [file] })) throw new Error('Photo sharing unavailable');
    native.textContent = 'Share photo & caption';
    native.disabled = false;
    native.onclick = async () => {
      native.disabled = true;
      notice.textContent = '';
      try {
        await navigator.share(data);
      } catch (error) {
        if (error.name !== 'AbortError') notice.textContent = 'Save the photo and copy the caption, or use the WhatsApp link.';
      } finally {
        native.disabled = false;
      }
    };
  }).catch(() => {
    if (!modal.open) return;
    native.hidden = true;
    notice.textContent = 'Use WhatsApp to share the product link with its preview, or open the photo and save it for Status.';
  });
}

export function bindProductShare(button, selection, options) {
  if (!button) return;
  button.hidden = false;
  button.onclick = () => {
    const { product, variant } = selection();
    showShare(shareDetails(product, variant, options));
  };
}

const detail = document.querySelector('#share-selection');
if (detail) {
  const { product, variant, options } = JSON.parse(detail.textContent);
  bindProductShare(document.querySelector('[data-share-product]'), () => ({ product, variant }), options);
}
