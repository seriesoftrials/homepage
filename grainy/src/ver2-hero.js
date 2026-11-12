import { mountRibbon } from '../assets/serial-ribbon-sequence/landing.js';
import { SEQUENCE_DURATION } from '../assets/serial-ribbon-sequence/sequence.js';
import { applyLanguage, LANGUAGE_STORAGE_KEY } from './ver2-i18n.js';
import { mountSpiritLoop } from './spirit-loop.js';
import { mountCardDialogs } from './card-dialogs.js';
import { mountIntro } from './ver2-intro.js';

const holder = document.querySelector('[data-ver2-ribbon]');
const header = document.querySelector('[data-page-nav]');
const progressBar = header.querySelector('.nav-progress');
const menu = header.querySelector('.mobile-menu');
const menuToggle = menu.querySelector('.mobile-menu-toggle');
const languageMenu = header.querySelector('.language-switcher');
const languageToggle = languageMenu.querySelector('.language-toggle');
const dropdowns = [
  { root: menu, trigger: menuToggle, panel: menu.querySelector('nav') },
  { root: languageMenu, trigger: languageToggle, panel: languageMenu.querySelector('.language-menu') },
];
const navLinks = [...header.querySelectorAll('[data-section-link]')];
const sections = [...document.querySelectorAll('.site-sections > section[id]')];
const footer = document.querySelector('.site-footer');
const themeColor = document.querySelector('meta[name="theme-color"]');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const spiritLoops = [...document.querySelectorAll('[data-spirit-art]')].map(artwork => mountSpiritLoop(artwork, reducedMotion));
let ribbon;
let intro;
let elapsed = SEQUENCE_DURATION;
let scheduledFrame = 0;
let activeSection;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

if (footer) {
  // Match Safari's under-page / safe-area color to the visible page end.
  // Only update when the footer enters or leaves view, never on every scroll frame.
  const footerObserver = new IntersectionObserver(([entry]) => {
    document.documentElement.classList.toggle('at-page-footer', entry.isIntersecting);
    const edgeColor = getComputedStyle(document.documentElement).getPropertyValue('--page-edge').trim();
    themeColor?.setAttribute('content', edgeColor);
  });
  footerObserver.observe(footer);
}

function updateNavigation() {
  scheduledFrame = 0;
  if (document.documentElement.classList.contains('has-card-dialog')) return;
  spiritLoops.forEach(loop => loop?.refresh());
  const y = Math.max(0, window.scrollY);
  const compact = y > (header.classList.contains('is-compact') ? 32 : 80);
  header.classList.toggle('is-compact', compact);

  const distance = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.transform = `scaleX(${distance > 0 ? clamp(y / distance) : 0})`;

  let current = '';
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= window.innerHeight * .38) current = section.id;
  }
  if (current !== activeSection) {
    activeSection = current;
    for (const link of navLinks) {
      if (link.dataset.sectionLink === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }

}

function scheduleNavigation() {
  if (!scheduledFrame) scheduledFrame = requestAnimationFrame(updateNavigation);
}

function mountPage() {
  try {
    if (holder && !ribbon) {
      ribbon = mountRibbon(holder, { initialElapsed: elapsed });
      intro = mountIntro({ holder, header, hero: holder.closest('.hero'), preference: reducedMotion, ribbon });
    }
  } catch (error) {
    document.documentElement.classList.remove('intro-pending');
    throw error;
  }
  scheduleNavigation();
  header.classList.add('nav-ready');
}

function savedLanguage() {
  try { return localStorage.getItem(LANGUAGE_STORAGE_KEY); } catch { return 'ko'; }
}

function changeLanguage(value, save = false) {
  const language = applyLanguage(document, value);
  spiritLoops.forEach(loop => loop?.refresh());
  if (save) {
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, language); } catch {}
  }
  scheduleNavigation();
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

for (const { root, trigger } of dropdowns) {
  trigger.addEventListener('click', event => {
    setDropdown(root, root.dataset.open !== 'true', event.detail === 0);
  });
  root.addEventListener('focusout', event => {
    if (!root.contains(event.relatedTarget)) setDropdown(root, false);
  });
}

languageMenu.addEventListener('click', event => {
  const button = event.target.closest('[data-language-choice]');
  if (!button) return;
  changeLanguage(button.dataset.languageChoice, true);
  setDropdown(languageMenu, false, event.detail === 0);
  languageToggle.focus({ preventScroll: true });
});

header.addEventListener('click', event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (event.target.closest('a[href^="#"]')) {
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
  if (event.key === LANGUAGE_STORAGE_KEY) changeLanguage(event.newValue);
});
window.addEventListener('scroll', scheduleNavigation, { passive: true });
window.addEventListener('resize', scheduleNavigation, { passive: true });
window.addEventListener('hashchange', scheduleNavigation);
reducedMotion.addEventListener('change', scheduleNavigation);
window.addEventListener('pagehide', () => {
  intro?.dispose();
  cancelAnimationFrame(scheduledFrame);
  scheduledFrame = 0;
  if (!ribbon) return;
  elapsed = ribbon.state.elapsed;
  ribbon.dispose();
  ribbon = undefined;
});
window.addEventListener('pageshow', event => {
  if (event.persisted) {
    changeLanguage(savedLanguage());
    mountPage();
  }
});
document.fonts.ready.then(scheduleNavigation);
changeLanguage(savedLanguage());
mountCardDialogs(reducedMotion);
mountPage();
