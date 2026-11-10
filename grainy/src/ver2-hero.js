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
const membersSection = document.querySelector('#members');
const joinSection = document.querySelector('#join');
const themeColor = document.querySelector('meta[name="theme-color"]');
const statement = document.querySelector('[data-scroll-statement]');
const phrases = [...statement.querySelectorAll('span')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const pageGrain = document.querySelector('[data-page-grain]');
function syncPageGrain() {
  pageGrain?.setAttribute('data-motion', document.hidden ? 'paused' : 'running');
}
document.addEventListener('visibilitychange', syncPageGrain);
syncPageGrain();
const spiritLoops = [...document.querySelectorAll('[data-spirit-art]')].map(artwork => mountSpiritLoop(artwork, reducedMotion));
let ribbon;
let intro;
let elapsed = SEQUENCE_DURATION;
let scheduledFrame = 0;
let activeSection;
let activeDarkTheme;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

// The drawn page scrollbar: its thumb shows how much of the page is in view.
const pageScrollbar = document.querySelector('[data-page-scrollbar]');
const scrollThumb = pageScrollbar?.firstElementChild;
let thumbTravel = 0;
function syncScrollbar(progress) {
  if (!scrollThumb || !pageScrollbar.offsetHeight) return;
  const track = pageScrollbar.offsetHeight - 8;
  const size = Math.max(40, track * window.innerHeight / document.documentElement.scrollHeight);
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
const smoothstep = value => value * value * (3 - 2 * value);

function updateNavigation() {
  scheduledFrame = 0;
  if (document.documentElement.classList.contains('has-card-dialog')) return;
  spiritLoops.forEach(loop => loop?.refresh());
  const y = Math.max(0, window.scrollY);
  const compact = y > (header.classList.contains('is-compact') ? 32 : 80);
  header.classList.toggle('is-compact', compact);

  // Blend into the night while the members card rises through the lower 60% of
  // the screen, and back out as the join card does, in either direction.
  const nightRamp = top => smoothstep(clamp((window.innerHeight - top) / (window.innerHeight * .6)));
  const night = nightRamp(membersSection.getBoundingClientRect().top)
    * (1 - nightRamp(joinSection.getBoundingClientRect().top));
  document.documentElement.style.setProperty('--night', night.toFixed(3));
  const darkTheme = night > .5;
  if (darkTheme !== activeDarkTheme) {
    activeDarkTheme = darkTheme;
    document.documentElement.classList.toggle('is-members-theme', darkTheme);
    themeColor?.setAttribute('content', darkTheme ? '#050a24' : '#dcebef');
  }

  const distance = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.transform = `scaleX(${distance > 0 ? clamp(y / distance) : 0})`;
  syncScrollbar(distance > 0 ? clamp(y / distance) : 0);

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

  const readingProgress = reducedMotion.matches ? 1 : clamp(
    (window.innerHeight * .8 - statement.getBoundingClientRect().top) / (window.innerHeight * .6),
  );
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
