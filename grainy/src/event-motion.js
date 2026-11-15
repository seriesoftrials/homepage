export function mountEventMotion(card, preference) {
  if (!card) return;
  const root = document.documentElement;
  const following = document.querySelector('.site-sections');
  let offset = 0;
  let room = 0;

  function refresh() {
    if (preference.matches) return;
    const rect = card.getBoundingClientRect();
    const baseTop = rect.top + window.scrollY - offset;
    // Ease into and out of the slower travel, with no velocity jump at either end.
    // This is tied to scroll position; it adds no idle animation loop or wheel delay.
    const start = Math.max(0, baseTop - window.innerHeight * .72);
    const progress = room > 0 ? Math.min(1, Math.max(0, (window.scrollY - start) / (room / .14))) : 0;
    const next = room * (progress - Math.sin(2 * Math.PI * progress) / (2 * Math.PI));
    if (Math.abs(next - offset) > .1) {
      offset = next;
      card.style.setProperty('--event-motion-offset', `${offset.toFixed(2)}px`);
    }
    card.classList.toggle('event-motion-active', rect.bottom > 0 && rect.top < window.innerHeight);
  }

  function resize() {
    card.style.setProperty('--event-height', `${card.getBoundingClientRect().height}px`);
    const limit = Number.parseFloat(getComputedStyle(card).getPropertyValue('--event-motion-room')) || 0;
    const gap = following ? Number.parseFloat(getComputedStyle(following).marginTop) || 0 : 0;
    const available = following
      ? following.getBoundingClientRect().top - (card.getBoundingClientRect().bottom - offset) - gap
      : 0;
    room = Math.min(limit, Math.max(0, available));
    refresh();
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
  new ResizeObserver(resize).observe(card);
  syncPreference();
  return { refresh };
}
