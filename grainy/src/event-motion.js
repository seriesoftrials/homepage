export function mountEventMotion(card, preference) {
  if (!card) return;
  const root = document.documentElement;
  const following = document.querySelector('.site-sections');
  const hero = document.querySelector('.hero');
  const heroCopy = document.querySelector('.hero-copy');
  let offset = 0;
  let room = 0;
  let baseTop = 0;
  let height = 0;
  let viewportWidth = 0;
  let viewportHeight = 0;

  function refresh() {
    if (preference.matches || root.classList.contains('has-card-dialog') || document.hidden) return;
    if (viewportWidth !== window.innerWidth || viewportHeight !== window.innerHeight) {
      resize();
      return;
    }
    // Keep the layout baseline independent of the interpolating transform.
    // CSS follows each new target with interruptible, compositor-only inertia.
    const start = Math.max(0, baseTop - window.innerHeight * .72);
    const progress = room > 0 ? Math.min(1, Math.max(0, (window.scrollY - start) / (room / .14))) : 0;
    const next = room * (progress - Math.sin(2 * Math.PI * progress) / (2 * Math.PI));
    if (Math.abs(next - offset) > .1) {
      offset = next;
      card.style.setProperty('--event-motion-offset', `${offset.toFixed(2)}px`);
    }
    const top = baseTop - window.scrollY + offset;
    card.classList.toggle('event-motion-active', top + height > 0 && top < window.innerHeight);
  }

  function resize() {
    if (root.classList.contains('has-card-dialog')) return;
    if (hero && heroCopy) {
      const heroTop = hero.getBoundingClientRect().top + window.scrollY;
      const copyEnd = heroCopy.getBoundingClientRect().bottom + window.scrollY;
      card.style.setProperty('--event-hero-clearance', `${Math.ceil(copyEnd + heroTop + 40)}px`);
    }
    const rect = card.getBoundingClientRect();
    const style = getComputedStyle(card);
    const visualOffset = style.transform === 'none' ? 0 : new DOMMatrixReadOnly(style.transform).m42;
    baseTop = rect.top + window.scrollY - visualOffset;
    height = rect.height;
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    card.style.setProperty('--event-height', `${height}px`);
    const limit = Number.parseFloat(style.getPropertyValue('--event-motion-room')) || 0;
    const gap = following ? Number.parseFloat(getComputedStyle(following).marginTop) || 0 : 0;
    const available = following
      ? following.getBoundingClientRect().top - (card.getBoundingClientRect().bottom - visualOffset) - gap
      : 0;
    room = Math.min(limit, Math.max(0, available));
    // Clamp immediately only when the visible card exceeds newly smaller bounds.
    // Font loading / an initial observer delivery must not cancel its inertia.
    const reset = visualOffset > room || preference.matches;
    if (reset) card.classList.add('event-motion-reset');
    offset = Math.min(offset, room);
    card.style.setProperty('--event-motion-offset', `${offset.toFixed(2)}px`);
    refresh();
    if (reset) {
      card.getBoundingClientRect();
      card.classList.remove('event-motion-reset');
    }
  }

  function syncPreference() {
    offset = 0;
    card.style.removeProperty('--event-motion-offset');
    card.classList.remove('event-motion-active');
    root.classList.toggle('has-event-motion', !preference.matches);
    resize();
  }

  preference.addEventListener('change', syncPreference);
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pageshow', resize);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) resize(); });
  const observer = new ResizeObserver(resize);
  observer.observe(card);
  if (heroCopy) observer.observe(heroCopy);
  syncPreference();
  return { refresh };
}
