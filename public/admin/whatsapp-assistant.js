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

async function api(body) {
  const response = await fetch('/api/whatsapp', body ? {
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
  delegate.querySelector('button').disabled = !data.connected;
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
    if (current === generation) button.disabled = button === delegate.querySelector('button') && !session.connected;
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
delegate.onsubmit = (event) => {
  event.preventDefault();
  const phone = delegate.elements.phone.value.trim();
  if (!session.connected || !confirm(`Have the assistant write and send this reply to ${phone}?`)) return;
  act(delegate.querySelector('button'), {
    action: 'delegate', phone, modality: delegate.elements.modality.value, brief: delegate.elements.brief.value, confirm: true
  }, ({ modality }) => {
    notice.textContent = modality === 'voice' ? 'Voice note sent.' : 'Message sent.';
    delegate.reset();
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
    find('wa-pair').reset();
    find('wa-guidance').reset();
  }
};
