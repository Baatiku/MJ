const find = (id) => document.getElementById(id);
const signIn = find('sign-in');
const verify = find('verify');
const workspace = find('workspace');
const form = find('shop');
const notice = find('notice');
let current;
let email = '';

async function request(body) {
  const response = await fetch('/api/workspaces', body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  } : undefined);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(result.error || 'The workspace service is unavailable.'), { status: response.status });
  return result;
}

function edit(shop) {
  current = shop;
  form.reset();
  find('shop-heading').textContent = shop ? 'Edit storefront' : 'Create a storefront';
  find('slug-field').hidden = !!shop;
  form.elements.slug.required = !shop;
  find('publish-field').hidden = !shop;
  if (shop) {
    for (const key of ['name', 'description', 'whatsapp']) form.elements[key].value = shop[key];
    form.elements.published.checked = shop.published;
  }
}

function render(shops) {
  const add = document.createElement('button');
  add.type = 'button';
  add.textContent = 'Create a storefront';
  add.onclick = () => edit(null);
  const items = shops.map((shop) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = shop.name + (shop.published ? ' · Published' : ' · Draft');
    button.onclick = () => edit(shop);
    item.append(button);
    if (shop.published) {
      const link = document.createElement('a');
      link.href = '/shops/' + encodeURIComponent(shop.slug) + '/';
      link.textContent = ' View shop';
      item.append(link);
    }
    return item;
  });
  const list = document.createElement('ul');
  list.append(...items);
  find('shops').replaceChildren(add, list);
}

async function load() {
  try {
    const { shops } = await request();
    signIn.hidden = verify.hidden = true;
    workspace.hidden = false;
    render(shops);
  } catch (error) {
    workspace.hidden = true;
    verify.hidden = true;
    signIn.hidden = error.status !== 401;
    if (error.status !== 401) notice.textContent = error.message;
  }
}

function submit(target, action) {
  target.onsubmit = async (event) => {
    event.preventDefault();
    const button = target.querySelector('button[type=submit]');
    button.disabled = true;
    notice.textContent = '';
    try { await action(); } catch (error) { notice.textContent = error.message; }
    finally { button.disabled = false; }
  };
}

submit(signIn, async () => {
  email = signIn.elements.email.value.trim();
  await request({ action: 'otp', email });
  signIn.hidden = true;
  verify.hidden = false;
  notice.textContent = 'Check your email for a sign-in code.';
  verify.elements.code.focus();
});
submit(verify, async () => {
  await request({ action: 'verify', email, code: verify.elements.code.value.trim() });
  verify.reset();
  await load();
});
find('change-email').onclick = () => { verify.hidden = true; signIn.hidden = false; signIn.elements.email.focus(); };
find('sign-out').onclick = async () => {
  try { await request({ action: 'logout' }); edit(null); await load(); }
  catch (error) { notice.textContent = error.message; }
};
submit(form, async () => {
  const profile = Object.fromEntries(['name', 'description', 'whatsapp'].map((key) => [key, form.elements[key].value]));
  const { shop } = await request(current
    ? { action: 'update', ...profile, id: current.id, published: form.elements.published.checked }
    : { action: 'create', ...profile, slug: form.elements.slug.value });
  edit(shop);
  await load();
  notice.textContent = shop.published ? 'Storefront published.' : 'Draft saved.';
});
load();
