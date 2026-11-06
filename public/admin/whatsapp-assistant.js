const find = (id) => document.getElementById(id);
const panel = find('whatsapp-assistant');
const controls = find('wa-controls');
const notice = find('wa-notice');
const status = find('wa-status');
const qr = find('wa-qr');
const delegate = find('wa-delegate');
let session = {};
let generation = 0;
let pairingTimer;
let contactRequest = 0;
let contactOffset = 0;
let contactQuery = '';

async function api(body, query = '') {
  const params = new URLSearchParams(query);
  const shop = /^\/manage\/([a-z0-9-]+)\/?$/.exec(location.pathname)?.[1];
  if (shop) params.set('shop', shop);
  const suffix = params.size ? '?' + params : '';
  const response = await fetch('/api/whatsapp' + suffix, body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  } : undefined);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'WhatsApp service setup is pending.');
  return data;
}

function render(data) {
  session = data;
  controls.hidden = false;
  status.textContent = data.connected
    ? `Connected${data.phone ? ' · ' + data.phone : ''} · Replies ${data.enabled ? 'on' : 'paused'}`
    : `Connection: ${data.status || 'offline'}`;
  qr.hidden = !data.qrDataUrl;
  if (data.qrDataUrl) qr.src = data.qrDataUrl;
  else qr.removeAttribute('src');
  find('wa-toggle').textContent = data.enabled ? 'Pause replies' : 'Enable replies';
  find('wa-toggle').disabled = !data.connected;
  find('wa-disconnect').disabled = !data.connected && !data.qrDataUrl;
  delegate.querySelector('button[type=submit]').disabled = !data.connected;
  if (data.connected) {
    find('wa-code').textContent = '';
    clearTimeout(pairingTimer);
  }
}

async function refresh({ poll = false } = {}) {
  const current = generation;
  clearTimeout(pairingTimer);
  try {
    const data = await api();
    if (current !== generation) return;
    render(data);
    if (poll && !data.connected) pairingTimer = setTimeout(() => refresh({ poll: true }), 5000);
  } catch (error) {
    if (current === generation) status.textContent = error.message;
  }
}

async function act(button, body, done) {
  const current = generation;
  button.disabled = true;
  notice.textContent = '';
  try {
    const data = await api(body);
    if (current === generation) await done(data);
  } catch (error) {
    if (current === generation) notice.textContent = error.message;
  } finally {
    if (current === generation) button.disabled = button === delegate.querySelector('button[type=submit]') && !session.connected;
  }
}

find('wa-refresh').onclick = () => refresh();
find('wa-connect').onclick = (event) => act(event.currentTarget, { action: 'connect' }, async (data) => {
  render(data);
  await refresh({ poll: true });
});
find('wa-toggle').onclick = (event) => act(event.currentTarget, { action: 'toggle', enabled: !session.enabled }, () => refresh());
find('wa-disconnect').onclick = (event) => {
  if (confirm('Disconnect the WhatsApp assistant?')) {
    act(event.currentTarget, { action: 'disconnect' }, () => refresh());
  }
};
find('wa-pair').onsubmit = (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  act(form.querySelector('button'), { action: 'pair', phone: form.elements.phone.value.trim() }, async ({ code }) => {
    find('wa-code').textContent = code || '';
    await refresh({ poll: true });
  });
};
find('wa-guidance').onsubmit = (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  act(form.querySelector('button'), { action: 'guidance', role: form.elements.role.value, brief: form.elements.brief.value }, () => {
    notice.textContent = 'Assistant guidance saved.';
  });
};
const contactSelect = delegate.elements.contact;
const contactSearch = find('wa-contact-search');
const contactMore = find('wa-contact-more');
const contactNote = find('wa-contact-note');

function recipientMode() {
  const manual = delegate.elements.recipientMode.value === 'manual';
  find('wa-contact-picker').hidden = manual;
  find('wa-manual-recipient').hidden = !manual;
  contactSelect.required = !manual;
  delegate.elements.phone.required = manual;
}

async function loadContacts(append = false) {
  const request = ++contactRequest;
  const current = generation;
  if (!append) {
    contactOffset = 0;
    contactQuery = find('wa-contact-query').value.trim();
    contactSelect.replaceChildren(new Option('Select a contact', ''));
    contactMore.hidden = true;
  }
  contactSearch.disabled = contactMore.disabled = true;
  contactNote.textContent = 'Loading contacts…';
  try {
    const params = new URLSearchParams({ view: 'contacts', q: contactQuery, offset: String(contactOffset) });
    const data = await api(undefined, '?' + params);
    if (request !== contactRequest || current !== generation) return;
    for (const { jid, name } of data.contacts) {
      const phone = jid.endsWith('@s.whatsapp.net') ? '+' + jid.split('@')[0] : '';
      contactSelect.add(new Option([name, phone].filter(Boolean).join(' · ') || 'WhatsApp contact', jid));
    }
    contactOffset += 30;
    contactMore.hidden = !data.hasMore;
    contactNote.textContent = contactSelect.options.length > 1 ? '' : 'No contacts found.';
  } catch (error) {
    if (request === contactRequest && current === generation) contactNote.textContent = error.message;
  } finally {
    if (request === contactRequest && current === generation) contactSearch.disabled = contactMore.disabled = false;
  }
}

contactSearch.onclick = () => loadContacts();
contactMore.onclick = () => loadContacts(true);
delegate.elements.recipientMode.onchange = recipientMode;
delegate.closest('details').ontoggle = (event) => {
  if (event.currentTarget.open && session.connected && contactOffset === 0) void loadContacts();
};

delegate.onsubmit = (event) => {
  event.preventDefault();
  const manual = delegate.elements.recipientMode.value === 'manual';
  const phone = delegate.elements.phone.value.trim();
  const label = manual ? phone : contactSelect.selectedOptions[0]?.textContent;
  if (!session.connected || !label || !confirm(`Have the assistant write and send this reply to ${label}?`)) return;
  act(delegate.querySelector('button[type=submit]'), {
    action: 'delegate', ...(manual ? { phone } : { jid: contactSelect.value }), modality: delegate.elements.modality.value, brief: delegate.elements.brief.value, confirm: true
  }, ({ modality }) => {
    notice.textContent = modality === 'voice' ? 'Voice note sent.' : 'Message sent.';
    delegate.reset();
    recipientMode();
  });
};

export const assistantPanel = {
  show() { panel.hidden = false; void refresh(); },
  hide() {
    generation += 1;
    clearTimeout(pairingTimer);
    session = {};
    panel.hidden = true;
    controls.hidden = true;
    qr.hidden = true;
    qr.removeAttribute('src');
    find('wa-code').textContent = '';
    notice.textContent = '';
    delegate.reset();
    recipientMode();
    contactRequest += 1;
    contactOffset = 0;
    contactSelect.replaceChildren(new Option('Select a contact', ''));
    contactSearch.disabled = contactMore.disabled = false;
    contactMore.hidden = true;
    contactNote.textContent = '';
    find('wa-pair').reset();
    find('wa-guidance').reset();
  }
};
