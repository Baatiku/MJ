const find = (id) => document.getElementById(id);
const signIn = find('sign-in');
const accept = find('accept');
const inviteOwner = find('invite-owner');
const invite = new URLSearchParams(location.hash.slice(1)).get('invite');
if (invite) history.replaceState(null, '', location.pathname + location.search);
const workspace = find('workspace');
const form = find('shop');
const notice = find('notice');
let current;
let hasInvite = Boolean(invite);

async function request(body) {
  const response = await fetch('/api/workspaces', body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  } : undefined);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(result.error || 'The workspace service is unavailable.'), { status: response.status, canInvite: result.canInvite === true });
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
    const { shops, canInvite } = await request();
    inviteOwner.hidden = !canInvite;
    signIn.hidden = accept.hidden = true;
    workspace.hidden = hasInvite;
    accept.hidden = !hasInvite;
    render(shops);
  } catch (error) {
    workspace.hidden = true;
    inviteOwner.hidden = !error.canInvite;
    accept.hidden = error.status !== 401 || !hasInvite;
    signIn.hidden = error.status !== 401 || hasInvite;
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

submit(inviteOwner, async () => {
  const { link } = await request({ action: 'invite', email: inviteOwner.elements.email.value });
  inviteOwner.elements.link.value = link;
  find('invite-result').hidden = false;
  inviteOwner.elements.link.select();
  notice.textContent = 'Invite created. It expires in 24 hours.';
});
submit(signIn, async () => {
  await request({ action: 'login', email: signIn.elements.email.value, password: signIn.elements.password.value });
  signIn.reset();
  await load();
});
submit(accept, async () => {
  await request({ action: 'accept', invite, password: accept.elements.password.value });
  hasInvite = false;
  accept.reset();
  await load();
});
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
