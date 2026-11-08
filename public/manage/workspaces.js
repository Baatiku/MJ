const find = (id) => document.getElementById(id);
const platform = /^\/platform-admin\/?$/.test(location.pathname);
if (platform) {
  document.title = 'Platform admin';
  find('manage-heading').textContent = 'Platform admin';
  find('shops-heading').textContent = 'Client storefronts';
  find('shop').hidden = true;
  find('original-shop').hidden = false;
}
const signIn = find('sign-in');
const register = find('register');
const setup = !platform && new URLSearchParams(location.search).get('setup') === '1';

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
  const response = await fetch('/api/workspaces' + (platform && !body ? '?platform=1' : ''), body ? {
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
    const link = document.createElement('a');
    link.href = '/manage/' + encodeURIComponent(shop.slug) + '/';
    link.textContent = shop.name + (shop.published ? ' · Published' : ' · Draft');
    const preview = document.createElement('a');
    preview.href = '/shops/' + encodeURIComponent(shop.slug) + '/' + (shop.published ? '' : '?preview=1');
    preview.textContent = shop.published ? 'View storefront' : 'Preview draft';
    item.append(link, preview);
    if (platform && shop.slug !== 'maknoon-jamil') {
      const binding = document.createElement('form');
      const field = document.createElement('label');
      field.textContent = 'WhatsApp runtime tenant ID';
      const tenant = document.createElement('input');
      tenant.required = true;
      tenant.maxLength = 36;
      field.append(tenant);
      const save = document.createElement('button');
      save.type = 'submit';
      save.textContent = 'Assign WhatsApp tenant';
      binding.append(field, save);
      submit(binding, async () => {
        const response = await fetch('/api/whatsapp?shop=' + encodeURIComponent(shop.slug), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'assign-runtime', tenant: tenant.value })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to assign WhatsApp.');
        binding.reset();
        notice.textContent = 'WhatsApp assigned to ' + shop.name + '.';
      });
      item.append(binding);
    }
    return item;
  });
  const list = document.createElement('ul');
  list.append(...items);
  find('shops').replaceChildren(...(platform ? [] : [add]), list);
}

async function load() {
  try {
    const { shops, canInvite } = await request();
    inviteOwner.hidden = !canInvite;
    signIn.hidden = accept.hidden = register.hidden = true;
    workspace.hidden = hasInvite;
    accept.hidden = !hasInvite;
    find('platform-sign-in').hidden = true;
    find('change-password').hidden = platform;
    find('import-original').hidden = !platform || shops.some(({ slug }) => slug === 'maknoon-jamil');
    find('original-shop').hidden = !platform || shops.some(({ slug }) => slug === 'maknoon-jamil');
    find('bootstrap-brands').hidden = !platform || !shops.some(({ slug }) => slug === 'maknoon-jamil') || ['pop-and-petals','flawless-glow-co'].every((slug) => shops.some((shop) => shop.slug === slug));
    render(shops);
    if (setup && !hasInvite) {
      form.elements.name.focus();
      form.scrollIntoView({ block: 'start' });
    }
  } catch (error) {
    workspace.hidden = true;
    find('change-password').hidden = find('import-original').hidden = find('bootstrap-brands').hidden = true;
    inviteOwner.hidden = !error.canInvite;
    accept.hidden = error.status !== 401 || !hasInvite;
    signIn.hidden = platform || error.status !== 401 || hasInvite || setup;
    register.hidden = !setup || error.status !== 401 || hasInvite;
    find('platform-sign-in').hidden = !platform || error.status !== 401;
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

submit(find('platform-sign-in'), async () => {
  const form = find('platform-sign-in');
  const response = await fetch('/api/admin', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: form.elements.password.value })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Unable to sign in.');
  form.reset();
  await load();
});
submit(inviteOwner, async () => {
  const { link } = await request({ action: 'invite', email: inviteOwner.elements.email.value });
  inviteOwner.elements.link.value = link;
  find('invite-result').hidden = false;
  inviteOwner.elements.link.select();
  notice.textContent = 'Invite created. It expires in 24 hours.';
});
submit(signIn, async () => {
  await request({ action: 'login', identity: signIn.elements.identity.value, password: signIn.elements.password.value });
  signIn.reset();
  await load();
});
register.elements.name.oninput = () => {
  if (register.elements.slug.dataset.edited) return;
  register.elements.slug.value = register.elements.name.value.toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '').slice(0, 48).replace(/-+$/, '');
};
register.elements.slug.oninput = () => { register.elements.slug.dataset.edited = 'true'; };
submit(register, async () => {
  const fields = Object.fromEntries(['name', 'slug', 'username', 'password'].map((key) => [key, register.elements[key].value]));
  const { shop } = await request({ action: 'register', ...fields });
  register.reset();
  location.assign('/setup/?shop=' + encodeURIComponent(shop.slug));
});
submit(accept, async () => {
  await request({ action: 'accept', invite, password: accept.elements.password.value });
  hasInvite = false;
  accept.reset();
  await load();
});
find('sign-out').onclick = async () => {
  try {
    if (platform) {
      const response = await fetch('/api/admin', { method: 'DELETE' });
      if (!response.ok) throw new Error('Sign-out failed. Try again.');
    } else {
      await request({ action: 'logout' });
      edit(null);
    }
    await load();
  }
  catch (error) { notice.textContent = error.message; }
};
submit(form, async () => {
  const profile = Object.fromEntries(['name', 'description', 'whatsapp'].map((key) => [key, form.elements[key].value]));
  const { shop } = await request(current
    ? { action: 'update', ...profile, id: current.id, published: form.elements.published.checked }
    : { action: 'create', ...profile, slug: form.elements.slug.value });
  location.assign('/setup/?shop=' + encodeURIComponent(shop.slug));
});
submit(find('import-original'), async () => {
  if (!window.confirm('Move the live Maknoon Jamil catalog to this owner?')) return;
  const { admin } = await request({ action: 'import-original', email: find('import-original').elements.email.value });
  location.assign(admin);
});
submit(find('bootstrap-brands'), async () => {
  const response = await request({ action: 'bootstrap-brands' });
  notice.textContent = response.already ? 'The three brands are already set up.' : 'Sister brands created under the same owner.';
  await load();
});
submit(find('change-password'), async () => {
  const form = find('change-password');
  await request({ action: 'change-password', currentPassword: form.elements.currentPassword.value, password: form.elements.password.value });
  form.reset();
  notice.textContent = 'Password changed.';
});
load();
