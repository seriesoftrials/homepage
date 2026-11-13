export function mountGrainMotion(preference) {
  const root = document.documentElement;
  const surfaces = document.querySelectorAll('.hero, .section-tile');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      entry.target.classList.toggle('grain-visible', entry.isIntersecting);
    }
  });
  for (const surface of surfaces) observer.observe(surface);

  const sync = () => {
    root.classList.toggle('grain-running', !preference.matches && !document.hidden);
  };
  preference.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => root.classList.remove('grain-running'));
  window.addEventListener('pageshow', sync);
  sync();
}
