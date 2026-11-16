import { translations, normalizeLanguage } from './ver2-i18n.js';

export function mountPreregistration() {
  const form = document.querySelector('[data-preregistration-form]');
  if (!form) return;
  let status = form.querySelector('[data-preregistration-status]');
  let submit = form.querySelector('[type="submit"]');
  const success = document.querySelector('[data-preregistration-success]');
  const entry = document.querySelector('[data-preregistration-entry]');
  const dialog = form.closest('dialog');
  let pending = false;
  let errorKey;
  let controls;
  let enhanced = false;
  const copy = () => translations[normalizeLanguage(document.documentElement.lang)];

  function enhance() {
    if (!controls || enhanced || pending) return;
    controls.enhancePreregistrationForm(form);
    enhanced = true;
    status = form.querySelector('[data-preregistration-status]');
    submit = form.querySelector('[type="submit"]');
    syncLanguage();
  }
  const observer = new MutationObserver(() => {
    if (!dialog.open || enhanced) return;
    import('./preregistration-controls').then(module => { controls = module; enhance(); }).catch(() => {});
  });
  observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });

  function syncLanguage() {
    (submit.querySelector('[data-preregistration-submit-label]') || submit).textContent = copy()[pending ? 'preregistrationPending' : 'preregistrationSubmit'];
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
        body: JSON.stringify({ name: fields.get('name'), email: fields.get('email'), phone: fields.get('phone'), consent: fields.get('consent') === 'on', consentVersion: '2027-1-v2', cohort: '2027-1' }),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        errorKey = response.status === 429 ? 'preregistrationRateLimit' : 'preregistrationError';
        throw new Error('Registration was not accepted');
      }
      form.reset();
      entry.hidden = true;
      success.hidden = false;
      dialog.setAttribute('aria-labelledby', 'preregistration-success-title');
      success.focus({ preventScroll: true });
    } catch {
      errorKey ||= 'preregistrationError';
      status.hidden = false;
    } finally {
      pending = false;
      submit.disabled = false;
      form.removeAttribute('aria-busy');
      syncLanguage();
      if (!entry.hidden) enhance();
    }
  });
  return { syncLanguage };
}
