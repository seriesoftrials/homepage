import { mountNavRibbon } from './nav-ribbon.js';
import { applySupportLanguage } from './support-i18n.js';
import { mountTheme } from './theme.js';
import { LANGUAGE_STORAGE_KEY, preferredLanguage } from './ver2-i18n.js';

const header = document.querySelector('[data-page-nav]');
const progress = header.querySelector('.nav-progress');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const theme = mountTheme();
const dropdowns = [
  { root: header.querySelector('.mobile-menu'), trigger: '.mobile-menu-toggle', panel: 'nav' },
  { root: header.querySelector('.language-switcher'), trigger: '.language-toggle', panel: '.language-menu' },
].map(({ root, trigger, panel }) => ({ root, trigger: root.querySelector(trigger), panel: root.querySelector(panel) }));
const languageMenu = dropdowns[1];
let frame = 0;
let ribbon;

function refreshNavigation() {
  frame = 0;
  const y = Math.max(0, scrollY);
  header.classList.toggle('is-compact', y > (header.classList.contains('is-compact') ? 32 : 80));
  const distance = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, y / distance) : 0})`;
}

function scheduleNavigation() {
  if (!frame) frame = requestAnimationFrame(refreshNavigation);
}

function setDropdown(root, open, instant = false) {
  for (const dropdown of dropdowns) {
    if (dropdown.root !== root && !open) continue;
    const expanded = dropdown.root === root && open;
    dropdown.root.dataset.instant = String(instant);
    dropdown.root.dataset.open = String(expanded);
    dropdown.trigger.setAttribute('aria-expanded', String(expanded));
    dropdown.panel.setAttribute('aria-hidden', String(!expanded));
    dropdown.panel.inert = !expanded;
  }
}

function changeLanguage(value, save = false) {
  const language = applySupportLanguage(document, value);
  theme?.syncLanguage();
  if (save) {
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, language); } catch {}
  }
  scheduleNavigation();
}

function mountNavigation() {
  ribbon ??= mountNavRibbon(header.querySelector('.brand'), preference);
  header.classList.add('nav-ready');
  scheduleNavigation();
}

for (const { root, trigger } of dropdowns) {
  trigger.addEventListener('click', event => setDropdown(root, root.dataset.open !== 'true', event.detail === 0));
  root.addEventListener('focusout', event => {
    if (!root.contains(event.relatedTarget)) setDropdown(root, false);
  });
}

languageMenu.root.addEventListener('click', event => {
  const choice = event.target.closest('[data-language-choice]');
  if (!choice) return;
  changeLanguage(choice.dataset.languageChoice, true);
  setDropdown(languageMenu.root, false, event.detail === 0);
  languageMenu.trigger.focus({ preventScroll: true });
});

header.addEventListener('click', event => {
  if (event.target.closest('a[href]')) {
    for (const { root } of dropdowns) setDropdown(root, false, event.detail === 0);
  }
});
document.addEventListener('pointerdown', event => {
  for (const { root } of dropdowns) {
    if (root.dataset.open === 'true' && !root.contains(event.target)) setDropdown(root, false);
  }
});
document.addEventListener('keydown', event => {
  const dropdown = dropdowns.find(({ root }) => root.dataset.open === 'true');
  if (event.key === 'Escape' && dropdown) {
    event.preventDefault();
    setDropdown(dropdown.root, false, true);
    dropdown.trigger.focus({ preventScroll: true });
  }
});
window.addEventListener('storage', event => {
  if (event.key === LANGUAGE_STORAGE_KEY || event.key === null) changeLanguage(preferredLanguage());
});
window.addEventListener('scroll', scheduleNavigation, { passive: true });
window.addEventListener('resize', scheduleNavigation, { passive: true });
window.addEventListener('pagehide', () => {
  ribbon?.dispose();
  ribbon = undefined;
  cancelAnimationFrame(frame);
  frame = 0;
});
window.addEventListener('pageshow', event => {
  if (event.persisted) {
    changeLanguage(preferredLanguage());
    mountNavigation();
  }
});
document.fonts.ready.then(scheduleNavigation);
changeLanguage(preferredLanguage());
mountNavigation();
