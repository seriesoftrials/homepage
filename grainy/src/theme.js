import { translations, normalizeLanguage } from './ver2-i18n.js';

export function mountTheme() {
  const root = document.documentElement;
  const button = document.querySelector('[data-theme-toggle]');
  const storageKey = 'serial-theme';
  if (!button) return;

  function apply(value, save = false) {
    const dark = value === 'dark';
    root.dataset.theme = dark ? 'dark' : 'light';
    const copy = translations[normalizeLanguage(root.lang)];
    button.setAttribute('aria-label', copy[dark ? 'themeLight' : 'themeDark']);
    button.setAttribute('aria-pressed', String(dark));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',
      getComputedStyle(root).getPropertyValue('--page-edge').trim());
    if (save) {
      try { localStorage.setItem(storageKey, root.dataset.theme); } catch {}
    }
  }

  button.addEventListener('click', () => apply(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
  window.addEventListener('storage', event => {
    if (event.key === storageKey) apply(event.newValue);
  });
  apply(root.dataset.theme);
  return { syncLanguage: () => apply(root.dataset.theme) };
}
