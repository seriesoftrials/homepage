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
const statement = document.querySelector('[data-scroll-statement]');
const phrases = [...statement.querySelectorAll('span')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const pageGrain = document.querySelector('[data-page-grain]');
function syncPageGrain() {
  pageGrain?.setAttribute('data-motion', document.hidden ? 'paused' : 'running');
}
document.addEventListener('visibilitychange', syncPageGrain);
syncPageGrain();
const spiritArts = [...document.querySelectorAll('[data-spirit-art]')];
const spiritLoops = spiritArts.map(artwork => mountSpiritLoop(artwork, reducedMotion));
let ribbon;
let intro;
let elapsed = SEQUENCE_DURATION;
let scheduledFrame = 0;
let activeSection;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

// The drawn page scrollbar: its thumb shows how much of the page is in view.
const pageScrollbar = document.querySelector('[data-page-scrollbar]');
const scrollThumb = pageScrollbar?.firstElementChild;
let thumbTravel = 0;
function syncScrollbar(progress, height, visible) {
  if (!scrollThumb || !height) return;
  const track = height - 8;
  const size = Math.max(40, track * visible);
  thumbTravel = track - size;
  scrollThumb.style.setProperty('--thumb-size', `${size}px`);
  scrollThumb.style.setProperty('--thumb-offset', `${thumbTravel * progress}px`);
}
scrollThumb?.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  event.preventDefault();
  const startY = event.clientY;
  const startScroll = window.scrollY;
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  const drag = move => window.scrollTo({ top: startScroll + (move.clientY - startY) * distance / Math.max(1, thumbTravel), behavior: 'instant' });
  scrollThumb.setPointerCapture(event.pointerId);
  pageScrollbar.dataset.dragging = '';
  scrollThumb.addEventListener('pointermove', drag);
  scrollThumb.addEventListener('lostpointercapture', () => {
    scrollThumb.removeEventListener('pointermove', drag);
    delete pageScrollbar.dataset.dragging;
  }, { once: true });
});

function updateNavigation() {
  scheduledFrame = 0;
  if (document.documentElement.classList.contains('has-card-dialog')) return;
  // Read every position before writing anything, so the browser lays the page
  // out once per frame instead of again after each change.
  const y = Math.max(0, window.scrollY);
  const viewport = window.innerHeight;
  const distance = document.documentElement.scrollHeight - viewport;
  const progress = distance > 0 ? clamp(y / distance) : 0;
  const sectionTops = sections.map(section => [section.id, section.getBoundingClientRect().top]);
  const statementTop = statement.getBoundingClientRect().top;
  const track = pageScrollbar?.offsetHeight ?? 0;
  const spiritBounds = spiritArts.map(artwork => artwork.getBoundingClientRect());

  spiritLoops.forEach((loop, index) => loop?.refresh(spiritBounds[index], viewport));

  header.classList.toggle('is-compact', y > (header.classList.contains('is-compact') ? 32 : 80));

  progressBar.style.transform = `scaleX(${progress})`;
  syncScrollbar(progress, track, viewport / (distance + viewport));

  let current = '';
  for (const [id, top] of sectionTops) {
    if (top <= viewport * .38) current = id;
  }
  if (current !== activeSection) {
    activeSection = current;
    for (const link of navLinks) {
      if (link.dataset.sectionLink === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }

  const readingProgress = reducedMotion.matches ? 1 : clamp((viewport * .8 - statementTop) / (viewport * .6));
  phrases.forEach((phrase, index) => {
    phrase.classList.toggle('is-read', reducedMotion.matches || readingProgress > index / phrases.length);
  });
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

// Picture boxes hold a frosted placeholder until their picture is decoded.
for (const box of document.querySelectorAll('.spirit-art, .person-portrait, .project-visual')) {
  const image = box.querySelector('img');
  if (!image || (image.complete && image.naturalWidth)) continue;
  box.dataset.image = 'loading';
  image.decode().catch(() => {}).finally(() => { box.dataset.image = 'ready'; });
}

// After the entrance, fetch and decode the lazy images one after another so none
// of them decodes in the middle of a scroll. Decoding runs off the main thread.
async function warmImages() {
  for (const image of document.querySelectorAll('img[loading="lazy"]')) {
    image.loading = 'eager';
    await image.decode().catch(() => {});
  }
  spiritLoops.forEach(loop => loop?.warm());
}
const whenIdle = callback => (window.requestIdleCallback ?? (run => setTimeout(run, 200)))(callback, { timeout: 1000 });
window.addEventListener('load', () => setTimeout(() => whenIdle(warmImages), 4500), { once: true });
changeLanguage(savedLanguage());
mountCardDialogs(reducedMotion);
mountPage();
