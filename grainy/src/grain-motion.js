export function mountGrainMotion(preference) {
  const root = document.documentElement;
  const sync = () => {
    root.classList.toggle('grain-running', !preference.matches && !document.hidden);
  };
  preference.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => root.classList.remove('grain-running'));
  window.addEventListener('pageshow', sync);
  sync();
}
