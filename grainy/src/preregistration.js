import { translations, normalizeLanguage } from './ver2-i18n.js';

export function mountPreregistration() {
  const form = document.querySelector('[data-preregistration-form]');
  if (!form) return;
  const status = form.querySelector('[data-preregistration-status]');
  const submit = form.querySelector('[type="submit"]');
  const success = document.querySelector('[data-preregistration-success]');
  let pending = false;
  let errorKey;
  const copy = () => translations[normalizeLanguage(document.documentElement.lang)];

  function syncLanguage() {
    submit.textContent = copy()[pending ? 'preregistrationPending' : 'preregistrationSubmit'];
    if (errorKey) status.textContent = copy()[errorKey];
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    pending = true;
    errorKey = undefined;
    status.hidden = true;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    syncLanguage();
    const fields = new FormData(form);
    try {
      const response = await fetch('/api/pre-registrations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ name: fields.get('name'), email: fields.get('email'), consent: fields.get('consent') === 'on', cohort: '2027-1' }),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        errorKey = response.status === 429 ? 'preregistrationRateLimit' : 'preregistrationError';
        throw new Error('Registration was not accepted');
      }
      form.reset();
      form.hidden = true;
      success.hidden = false;
    } catch {
      errorKey ||= 'preregistrationError';
      status.hidden = false;
    } finally {
      pending = false;
      submit.disabled = false;
      form.removeAttribute('aria-busy');
      syncLanguage();
    }
  });
  return { syncLanguage };
}
