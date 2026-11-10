/**
 * Parent integration (this module does not mount the renderer):
 * - Link /ver2-intro.css AFTER /ver2.css in <head> and add intro-pending to <html>
 *   before first paint. Without that opt-in, this module leaves the page visible.
 * - After mountRibbon(holder, { initialElapsed: SEQUENCE_DURATION }), call
 *   mountIntro({ holder, header, hero, preference: reducedMotion, ribbon }). Keep the
 *   returned controller and call dispose() when unmounting. pagehide also disposes.
 * - The parent's startup error path must remove intro-pending if ribbon mounting
 *   or importing this module fails before mountIntro can run.
 *
 * The same prepared 3D surface starts large, makes one complete turn, then recedes.
 * Never swap the poster into a visible entrance. Renderer readiness has a bounded
 * 1200ms budget; failed renderers retain the normal static fallback.
 */

import { SEQUENCE_DURATION, ROTATION_DURATION, nextRotationStop } from '../assets/serial-ribbon-sequence/sequence.js';

const SEEN_KEY = 'serial:ver2:intro-seen:v1';
const READY_BUDGET = 2000;
// The logo fades in and floats still, turns once, then settles into the hero
// while the white page takes on its colors and the sections rise into place.
const FADE_IN_DURATION = 450;
const HOLD_DURATION = 700;
const TURN_DURATION = 1600;
const SETTLE_DURATION = 900;
const SETTLE_START = HOLD_DURATION + TURN_DURATION;
const LOGO_DURATION = SETTLE_START + SETTLE_DURATION;
const COLOR_START = HOLD_DURATION + TURN_DURATION * .6;
const REVEAL_DELAY = SETTLE_START + 150;
const REVEAL_DURATION = 900;
const REVEAL_RISE = '20px';
// Must match the CSS fallback release in ver2-intro.css.
const INTRO_DEADLINE = 4000;
const SETTLE_EASE = 'cubic-bezier(.5, 0, .15, 1)';
const mounted = new WeakMap();

export function mountIntro({ holder, header, hero, preference, ribbon } = {}) {
  const doc = holder?.ownerDocument ?? hero?.ownerDocument ?? header?.ownerDocument
    ?? (typeof document === 'undefined' ? undefined : document);
  const root = doc?.documentElement;
  const view = doc?.defaultView;
  const animations = [];
  const cleanup = [];
  let disposed = false;
  const controller = { dispose };

  function dispose() {
    if (disposed) return;
    disposed = true;
    // Release the CSS gate before canceling its temporary animation overrides.
    root?.classList.remove('intro-pending');
    root?.removeAttribute('data-intro-active');
    for (const undo of cleanup.reverse()) {
      try { undo(); } catch { /* Continue restoring the remaining page state. */ }
    }
    for (const animation of animations) {
      try { animation.cancel(); } catch { /* A detached animation may be gone. */ }
    }
    if (doc && mounted.get(doc) === controller) mounted.delete(doc);
  }

  function listen(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    cleanup.push(() => target.removeEventListener(type, listener, options));
  }

  function timeout(callback, delay) {
    const timer = view.setTimeout(callback, delay);
    cleanup.push(() => view.clearTimeout(timer));
  }

  function animate(target, frames, options) {
    const animation = target.animate(frames, { fill: 'forwards', ...options });
    animations.push(animation);
    listen(animation, 'cancel', dispose, { once: true });
    return animation;
  }

  try {
    if (!doc || !view || !root) return controller;
    const optedIn = root.classList.contains('intro-pending');
    const previous = mounted.get(doc);
    previous?.dispose();
    mounted.set(doc, controller);
    // A duplicate mount cancels the old run rather than starting it again.
    if (previous) {
      dispose();
      return controller;
    }

    let seen = false;
    try {
      seen = view.sessionStorage.getItem(SEEN_KEY) === '1';
      // Consume at entry so leaving during loading/animation also counts.
      view.sessionStorage.setItem(SEEN_KEY, '1');
    } catch { /* History detection still works when tab storage is unavailable. */ }

    const navigation = view.performance?.getEntriesByType?.('navigation')?.[0];
    const reloading = navigation?.type === 'reload';
    const historyReturn = navigation?.type === 'back_forward'
      || view.performance?.navigation?.type === 2;
    const motion = preference ?? view.matchMedia?.('(prefers-reduced-motion: reduce)');
    const visual = holder?.closest('.hero-visual');
    hero ??= holder?.closest('.hero');
    header ??= doc.querySelector('[data-page-nav]');
    const copy = hero?.querySelector('.hero-copy');

    if (!optedIn || (seen && !reloading) || historyReturn || motion?.matches || doc.hidden
      || view.performance.now() >= INTRO_DEADLINE
      || !view.matchMedia?.('(scripting: enabled)').matches
      || view.scrollY > 4 || (view.location.hash && view.location.hash !== '#top')
      || !holder?.isConnected || !header || !copy || !hero?.contains(visual)
      || typeof ribbon?.seek !== 'function'
      || typeof holder.animate !== 'function' || typeof visual.animate !== 'function') {
      dispose();
      return controller;
    }

    const content = [...new Set([
      header, copy, ...doc.querySelectorAll('.site-sections, .site-footer'),
    ])];
    if (content.some(element => typeof element.animate !== 'function')) {
      dispose();
      return controller;
    }
    root.setAttribute('data-intro-active', '');
    const canvas = holder.querySelector('canvas');
    if (ribbon?.state?.playing) {
      const userPaused = ribbon.state.userPaused;
      ribbon.pause();
      cleanup.push(() => {
        if (ribbon.state.disposed) return;
        ribbon.state.userPaused = userPaused;
        if (!motion?.matches) ribbon.resume();
      });
    }

    // Read the actual responsive end state, never duplicate its size/opacity here.
    // Removing/replacing the class synchronously cannot expose an intermediate paint.
    root.classList.remove('intro-pending');
    const finalTransform = view.getComputedStyle(holder).transform;
    const finalVisualOpacity = view.getComputedStyle(visual).opacity;
    const finalContent = content.map(element => {
      const style = view.getComputedStyle(element);
      return { element, opacity: style.opacity, visibility: style.visibility };
    });
    const heroStyle = view.getComputedStyle(hero);
    const finalHero = {
      borderColor: heroStyle.borderTopColor,
      borderRadius: heroStyle.borderTopLeftRadius,
      backgroundColor: heroStyle.backgroundColor,
    };
    root.classList.add('intro-pending');

    for (const element of [...content, ...doc.querySelectorAll('.skip-link')]) {
      if (element.hasAttribute('inert')) continue;
      element.setAttribute('inert', '');
      cleanup.push(() => element.removeAttribute('inert'));
    }

    listen(view, 'pagehide', dispose);
    listen(doc, 'visibilitychange', () => { if (doc.hidden) dispose(); });
    listen(view, 'resize', dispose, { passive: true });
    listen(view, 'scroll', dispose, { passive: true });
    listen(view, 'wheel', dispose, { passive: true });
    listen(view, 'touchstart', dispose, { passive: true });
    listen(doc, 'keydown', event => {
      if (event.key === 'Escape' || event.key === 'Tab') dispose();
    });
    const motionChanged = event => { if (event.matches) dispose(); };
    if (motion?.addEventListener) listen(motion, 'change', motionChanged);
    else if (motion?.addListener) {
      motion.addListener(motionChanged);
      cleanup.push(() => motion.removeListener(motionChanged));
    }
    if (canvas) listen(canvas, 'webglcontextlost', dispose);

    function start() {
      if (disposed) return;
      try {
        const base = finalTransform === 'none' ? '' : `${finalTransform} `;
        const settle = SETTLE_START / LOGO_DURATION;
        animate(holder, [
          { transform: `${base}scale(1.28)`, offset: 0 },
          { transform: `${base}scale(1.28)`, offset: settle, easing: SETTLE_EASE },
          { transform: finalTransform, offset: 1 },
        ], { duration: LOGO_DURATION });

        animate(visual, [
          { opacity: '0', offset: 0, easing: 'ease-out' },
          { opacity: '1', offset: FADE_IN_DURATION / LOGO_DURATION },
          { opacity: '1', offset: settle, easing: SETTLE_EASE },
          { opacity: finalVisualOpacity, offset: 1 },
        ], { duration: LOGO_DURATION });

        // The white page takes on the gradient while the logo settles, so home
        // arrives as a color change rather than as a cut.
        const colorDuration = REVEAL_DELAY + REVEAL_DURATION;
        animate(root, [
          { '--intro-veil': '1', offset: 0 },
          { '--intro-veil': '1', offset: COLOR_START / colorDuration, easing: 'cubic-bezier(.45, 0, .25, 1)' },
          { '--intro-veil': '0', offset: 1 },
        ], { duration: colorDuration });

        // The hero starts as the whole white screen, then draws back into its
        // framed card as the colors arrive, like the page landing in place.
        const bounds = hero.getBoundingClientRect();
        const cover = Math.max(view.innerWidth / bounds.width, view.innerHeight / bounds.height) * 1.01;
        const open = { transform: `scale(${cover})`, borderColor: 'transparent', borderRadius: '0px', backgroundColor: 'transparent' };
        animate(hero, [
          { ...open, offset: 0 },
          { ...open, offset: SETTLE_START / colorDuration, easing: SETTLE_EASE },
          { transform: 'none', ...finalHero, offset: 1 },
        ], { duration: colorDuration });

        const turnEnd = nextRotationStop(ribbon.state.elapsed / SEQUENCE_DURATION) * SEQUENCE_DURATION;
        const turnStart = turnEnd - ROTATION_DURATION;
        let frame;
        const startTime = view.performance.now() + HOLD_DURATION;
        ribbon.seek(turnStart);
        const turn = now => {
          if (disposed) return;
          const progress = Math.min(1, Math.max(0, now - startTime) / TURN_DURATION);
          const easedProgress = progress * progress * (3 - 2 * progress);
          ribbon.seek(turnStart + easedProgress * ROTATION_DURATION);
          if (progress < 1) frame = view.requestAnimationFrame(turn);
        };
        frame = view.requestAnimationFrame(turn);
        timeout(() => {
          view.cancelAnimationFrame(frame);
          if (!disposed) ribbon.seek(turnEnd);
        }, SETTLE_START);
        cleanup.push(() => {
          view.cancelAnimationFrame(frame);
          if (!ribbon.state.disposed) ribbon.seek(motion?.matches ? SEQUENCE_DURATION : turnEnd);
        });

        // Visibility remains gated during the logo movement. The rest rises into
        // place; navigation fades only, as its fixed-position transform belongs
        // to the parent.
        let last;
        for (const { element, opacity, visibility } of finalContent) {
          const [from, to] = element === header ? [{}, {}]
            : [{ transform: `translateY(${REVEAL_RISE})` }, { transform: 'none' }];
          last = animate(element, [
            { opacity: '0', visibility, ...from },
            { opacity, visibility, ...to },
          ], { duration: REVEAL_DURATION, delay: REVEAL_DELAY, easing: SETTLE_EASE });
        }
        listen(last, 'finish', dispose, { once: true });
        // Protect the gate even if an engine does not deliver a finish event.
        timeout(dispose, REVEAL_DELAY + REVEAL_DURATION + 40);
      } catch { dispose(); }
    }

    const surfaceReady = () => holder.classList.contains('is-ready');
    if (surfaceReady()) start();
    else {
      let started = false;
      let observer;
      const startWhenReady = () => {
        if (started || disposed || !surfaceReady()) return;
        started = true;
        observer?.disconnect();
        start();
      };
      if (view.MutationObserver) {
        observer = new view.MutationObserver(startWhenReady);
        observer.observe(holder, { attributes: true, attributeFilter: ['class'] });
        cleanup.push(() => observer.disconnect());
      }
      timeout(() => { if (!started) dispose(); }, READY_BUDGET);
      // Covers the first rendered frame arriving during observer setup.
      startWhenReady();
    }
  } catch { dispose(); }

  return controller;
}
