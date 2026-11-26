import { mountRibbon } from '../assets/serial-ribbon-sequence/landing.js';
import { SEQUENCE_DURATION } from '../assets/serial-ribbon-sequence/sequence.js';
import { applyLanguage, LANGUAGE_STORAGE_KEY, preferredLanguage } from './ver2-i18n.js';
import { mountSpiritLoop } from './spirit-loop.js';
import { mountCardDialogs } from './card-dialogs.js';
import { mountStoryShare } from './story-share.js';
import { mountIntro } from './ver2-intro.js';
import { mountGrainMotion } from './grain-motion.js';
import { mountEventMotion } from './event-motion.js';
import { mountPreregistration } from './preregistration.js';
import { mountTheme } from './theme.js';
import { mountNavRibbon } from './nav-ribbon.js';

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
const sections = [...document.querySelectorAll('main > .event-section, .site-sections > section[id]')];
const statement = document.querySelector('[data-scroll-statement]');
const phrases = [...(statement?.querySelectorAll('span') || [])];
const footer = document.querySelector('.site-footer');
const themeColor = document.querySelector('meta[name="theme-color"]');
const peopleGrid = document.querySelector('.people-grid');
if (peopleGrid) {
  const cards = [...peopleGrid.querySelectorAll('.person-card')];
  // Shuffle complete cards once per page load so portraits and captions stay together.
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[randomIndex]] = [cards[randomIndex], cards[index]];
  }
  peopleGrid.append(...cards);
}
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const touchInput = matchMedia('(pointer: coarse)');
const theme = mountTheme();
const preregistration = mountPreregistration();
mountGrainMotion(reducedMotion);
mountMemberReveal(peopleGrid, reducedMotion);
for (const card of document.querySelectorAll('.past-event, .project-card')) {
  const copy = card.querySelector('.past-event-copy, .project-description');
  mountViewportReveal(card, reducedMotion, () => [
    animateReveal(card, 'translateY(18px)', 550),
    animateReveal(copy, 'translateY(8px)', 360, 150),
  ]);
}
mountPartnershipTicker(document.querySelector('[data-partnership-ticker]'));
const eventMotion = mountEventMotion(document.querySelector('main > .event-section'), reducedMotion);
const spiritLoops = [...document.querySelectorAll('[data-spirit-art]')].map(artwork => mountSpiritLoop(artwork, reducedMotion));
let ribbon;
let intro;
let navRibbon;
let elapsed = SEQUENCE_DURATION;
let scheduledFrame = 0;
let activeSection;
let navigationLayout;
let progressTransform;

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

function animateReveal(element, transform, duration, delay = 0) {
  return element.animate([
    { transform, opacity: 0 },
    { transform: 'none', opacity: 1 },
  ], { duration, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
}

function mountViewportReveal(element, preference, animate) {
  if (!element || preference.matches || !Element.prototype.animate || !window.IntersectionObserver) return;
  const visibleRatio = .12;
  let animations = [];

  function showWithoutMotion() {
    observer.disconnect();
    element.classList.remove('is-reveal-pending');
    animations.forEach(animation => animation.cancel());
  }

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.intersectionRatio < visibleRatio) return;
    observer.disconnect();
    element.classList.remove('is-reveal-pending');
    if (preference.matches) return;

    animations = animate();
    Promise.allSettled(animations.map(animation => animation.finished))
      .then(() => preference.removeEventListener('change', showWithoutMotion));
  }, { threshold: visibleRatio });

  element.classList.add('is-reveal-pending');
  preference.addEventListener('change', showWithoutMotion, { once: true });
  observer.observe(element);
}

function mountMemberReveal(grid, preference) {
  mountViewportReveal(grid, preference, () => {
    const bounds = grid.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const portraits = [...grid.querySelectorAll('.person-portrait')].map(portrait => {
      const { left, top, width, height } = portrait.getBoundingClientRect();
      const x = (centerX - left - width / 2) * .82;
      const y = clamp((centerY - top - height / 2) * .16, -48, 48);
      return { portrait, x, y, delay: Math.min(90, Math.abs(x) * .3) };
    });

    return portraits.flatMap(({ portrait, x, y, delay }) => [
      animateReveal(portrait, `translate(${x}px, ${y}px) scale(.88)`, 640, delay),
      animateReveal(portrait.nextElementSibling, 'translateY(8px)', 360, delay + 260),
    ]);
  });
}

function mountPartnershipTicker(ticker) {
  if (!ticker || !window.IntersectionObserver) return;
  const group = ticker.querySelector('.partnership-ticker-group');
  const toggle = ticker.querySelector('.partnership-ticker-toggle');
  const repeatedMessage = group.firstElementChild.cloneNode(true);
  repeatedMessage.classList.add('ticker-repeat');
  repeatedMessage.setAttribute('aria-hidden', 'true');
  group.append(repeatedMessage);

  const repeatedGroup = group.cloneNode(true);
  repeatedGroup.classList.add('ticker-repeat');
  repeatedGroup.setAttribute('aria-hidden', 'true');
  group.after(repeatedGroup);
  ticker.classList.add('is-ready');

  const observer = new IntersectionObserver(([entry]) => {
    ticker.classList.toggle('is-visible', entry.isIntersecting);
  });
  observer.observe(ticker);

  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    const paused = ticker.classList.toggle('is-paused');
    toggle.setAttribute('aria-pressed', String(paused));
  });
}

function updateNavigation() {
  scheduledFrame = 0;
  if (document.documentElement.classList.contains('has-card-dialog')) return;

  const scrollY = window.scrollY;
  const scrollTop = Math.max(0, scrollY);
  const viewportHeight = window.innerHeight;
  // Section geometry only changes when the document reflows, even as the fixed
  // header and the mobile browser bars move during a scroll.
  const layout = navigationLayout ??= {
    sectionTops: sections.map(section => section.getBoundingClientRect().top + scrollY),
    statementTop: statement ? statement.getBoundingClientRect().top + scrollY : undefined,
    documentHeight: document.documentElement.scrollHeight,
  };
  eventMotion?.refresh();
  spiritLoops.forEach(loop => loop?.refresh());

  const compact = scrollTop > (header.classList.contains('is-compact') ? 32 : 80);
  header.classList.toggle('is-compact', compact);

  const distance = layout.documentHeight - viewportHeight;
  const transform = `scaleX(${distance > 0 ? clamp(scrollTop / distance) : 0})`;
  if (transform !== progressTransform) {
    progressTransform = transform;
    progressBar.style.transform = transform;
  }

  let current = '';
  for (const [index, section] of sections.entries()) {
    if (layout.sectionTops[index] - scrollY <= viewportHeight * .38) {
      current = section.dataset.navSection || section.id;
    }
  }
  if (current !== activeSection) {
    activeSection = current;
    for (const link of navLinks) {
      if (link.dataset.sectionLink === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }

  if (layout.statementTop !== undefined) {
    const readingProgress = reducedMotion.matches ? 1 : clamp(
      (viewportHeight * .8 - layout.statementTop + scrollY) / (viewportHeight * .6),
    );
    phrases.forEach((phrase, index) => {
      phrase.classList.toggle('is-read', reducedMotion.matches || readingProgress > index / phrases.length);
    });
  }
}

function scheduleNavigation() {
  if (!scheduledFrame) scheduledFrame = requestAnimationFrame(updateNavigation);
}

function invalidateNavigationLayout() {
  navigationLayout = undefined;
  scheduleNavigation();
}

function mountPage() {
  navRibbon ??= mountNavRibbon(header.querySelector('.brand'), reducedMotion);
  try {
    if (holder && !ribbon) {
      ribbon = mountRibbon(holder, { initialElapsed: elapsed, maxPixelRatio: touchInput.matches ? 2 : 3 });
      intro = mountIntro({ holder, header, hero: holder.closest('.hero'), preference: reducedMotion, ribbon });
    }
  } catch (error) {
    document.documentElement.classList.remove('intro-pending');
    throw error;
  }
  scheduleNavigation();
  header.classList.add('nav-ready');
}

function changeLanguage(value, save = false) {
  const language = applyLanguage(document, value);
  theme?.syncLanguage();
  preregistration?.syncLanguage();
  spiritLoops.forEach(loop => loop?.refresh());
  if (save) {
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, language); } catch {}
  }
  invalidateNavigationLayout();
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
  if (event.key === LANGUAGE_STORAGE_KEY || event.key === null) changeLanguage(preferredLanguage());
});
window.addEventListener('scroll', scheduleNavigation, { passive: true });
window.addEventListener('resize', scheduleNavigation, { passive: true });
window.addEventListener('hashchange', scheduleNavigation);
reducedMotion.addEventListener('change', scheduleNavigation);
window.addEventListener('pagehide', () => {
  navRibbon?.dispose();
  navRibbon = undefined;
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
    changeLanguage(preferredLanguage());
    mountPage();
  }
});
const navigationResize = new ResizeObserver(invalidateNavigationLayout);
for (const element of [document.body, holder?.closest('.hero'), statement, ...sections]) {
  if (element) navigationResize.observe(element, { box: 'border-box' });
}
document.fonts.ready.then(invalidateNavigationLayout);
changeLanguage(preferredLanguage());
mountCardDialogs(reducedMotion);
mountStoryShare();
mountPage();
