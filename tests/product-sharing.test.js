import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { products } from '../src/catalog/products.js';
import { productCard } from '../src/components/product-card.js';
import { variantPage } from '../src/components/variant-page.js';

test('sharing uses the colour selected at click time and sends a photo with its caption', async (t) => {
  const dialogs = [];
  class Node {
    constructor(tag) { this.tag = tag; this.children = []; this.open = false; this.hidden = false; }
    append(...children) { this.children.push(...children); }
    setAttribute() {}
    addEventListener(event, listener) { if (event === 'close') this['close-event'] = listener; }
    showModal() { this.open = true; dialogs.push(this); }
    close() { this.open = false; this['close-event']?.(); }
    remove() {}
  }
  t.mock.method(globalThis, 'fetch', async () => new Response('jpeg-data', { headers: { 'Content-Type': 'image/jpeg' } }));
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  t.after(() => {
    if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument);
    else delete globalThis.document;
    if (oldNavigator) Object.defineProperty(globalThis, 'navigator', oldNavigator);
    else delete globalThis.navigator;
  });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    createElement: (tag) => new Node(tag), body: new Node('body'), querySelector: () => null
  } });
  const shared = [];
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {
    canShare: () => true,
    share: async (data) => { shared.push(data); }
  } });
  const { bindProductShare, shareDetails } = await import('../src/lib/product-share.js');
  const product = products[0];
  let variant = product.variants[0];
  const options = { origin: 'https://shop.example', home: '/shops/client/', name: 'Client Shop' };
  const button = new Node('button');
  bindProductShare(button, () => ({ product, variant }), options);
  variant = product.variants[2];
  button.onclick();
  await setImmediate();
  await setImmediate();
  const modal = dialogs[0];
  const actions = modal.children.find(({ className }) => className === 'share-actions');
  const native = actions.children[0];
  assert.equal(native.disabled, false);
  await native.onclick();
  assert.equal(shared.length, 1);
  assert.equal(shared[0].files[0].type, 'image/jpeg');
  assert.match(shared[0].text, new RegExp(variant.name));
  assert.ok(shared[0].text.includes('/shops/client/products/' + product.id + '/' + variant.id + '/'));
  assert.ok(shared[0].text.includes('Client Shop'));
  assert.equal(modal.children.find(({ tag }) => tag === 'img').src, shareDetails(product, variant, options).image);

  navigator.share = async () => { throw new DOMException('Cancelled', 'AbortError'); };
  await native.onclick();
  assert.equal(modal.children.at(-1).textContent, '');
  assert.equal(native.disabled, false);
  modal.close();

  navigator.canShare = () => false;
  button.onclick();
  await setImmediate();
  await setImmediate();
  const fallback = dialogs.at(-1);
  const links = fallback.children.find(({ className }) => className === 'share-actions').children;
  assert.equal(links[0].hidden, true);
  assert.equal(new URL(links[1].href).searchParams.get('text'), shareDetails(product, variant, options).text);
  assert.equal(links[2].download, product.id + '-' + variant.id + '.jpg');
  fallback.close();
});

test('card and product page expose sharing while private previews do not', () => {
  const product = products[0];
  const variant = product.variants[1];
  assert.match(productCard(product, 'https://shop.example'), /data-share-product/);
  const page = variantPage(product, variant, 'https://shop.example');
  assert.match(page, /src="\/lib\/product-share.js"/);
  const selection = JSON.parse(page.match(/id="share-selection">([^<]+)<\/script>/)[1]);
  assert.equal(selection.variant.id, variant.id);
  assert.doesNotMatch(productCard(product, null, '', { preview: true }), /data-share-product/);
  assert.doesNotMatch(variantPage(product, variant, null, '', { preview: true }), /id="share-selection"/);
});
