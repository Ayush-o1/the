// Contact form. With a form key in config.js it posts to the form service.
// Without one it builds a mailto: link, so the form works on day one.
import { config } from '../config.js';
import { $ } from '../lib/dom.js';

function setNote(note, state, text) {
  note.dataset.state = state;
  note.textContent = text;
}

function readForm(form) {
  const data = new FormData(form);
  return {
    name: String(data.get('name')).trim(),
    email: String(data.get('email')).trim(),
    message: String(data.get('message')).trim(),
    website: String(data.get('website')),
  };
}

function openMailApp(fields) {
  const subject = `Message from ${fields.name}`;
  const body = `${fields.message}\n\n${fields.name}\n${fields.email}`;
  window.location.href =
    `mailto:${config.email}?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;
}

async function sendToService(fields) {
  const response = await fetch(config.formEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: config.formKey,
      name: fields.name,
      email: fields.email,
      message: fields.message,
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || 'Request failed');
}

export function initContact() {
  const form = $('#contact-form');
  const note = $('#contact-note');
  if (!form || !note) return;

  if (config.formKey) setNote(note, 'idle', 'Your message goes straight to my inbox.');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fields = readForm(form);

    // A filled honeypot means a bot. Look successful and send nothing.
    if (fields.website) {
      setNote(note, 'ok', 'Sent.');
      return;
    }

    if (!config.formKey) {
      openMailApp(fields);
      setNote(note, 'ok', `If your mail app did not open, write to ${config.email}.`);
      return;
    }

    const button = $('button[type="submit"]', form);
    button.disabled = true;
    setNote(note, 'idle', 'Sending.');
    try {
      await sendToService(fields);
      form.reset();
      setNote(note, 'ok', 'Sent. Thank you.');
    } catch {
      setNote(note, 'error', `That did not send. Email ${config.email} instead.`);
    } finally {
      button.disabled = false;
    }
  });
}
