export function mountCardDialogs(preference) {
  if (typeof HTMLDialogElement === 'undefined') return;
  const root = document.documentElement;
  // `rest` is each surface's own resting transform; both rise into it.
  const entries = [
    { id: 'origin-story', trigger: document.querySelector('[data-open-story]'), rest: '' },
    { id: 'support-dialog', trigger: document.querySelector('[data-open-support]'), rest: 'translate(-50%, -50%)' },
  ].map(entry => ({ ...entry, dialog: document.getElementById(entry.id) }))
    .filter(entry => entry.trigger && entry.dialog);
  const lowered = entry => `${entry.rest} translateY(18px) scale(.98)`;
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  let active;
  let animation;
  let closing;
  let instantDismiss = false;
  let dismissPending = false;
  let savedScroll;
  let savedBody;
  let savedRestoration;
  let restoreFrame;

  function lockPage() {
    cancelAnimationFrame(restoreFrame);
    savedRestoration ??= history.state?.serialDialogRestoration ?? history.scrollRestoration;
    history.scrollRestoration = 'manual';
    savedScroll = { x: window.scrollX, y: window.scrollY };
    savedBody = ['position', 'top', 'left', 'width'].map(name => [name, document.body.style.getPropertyValue(name)]);
    const width = document.documentElement.clientWidth;
    root.classList.add('has-card-dialog');
    Object.assign(document.body.style, { position: 'fixed', top: `${-savedScroll.y}px`, left: `${-savedScroll.x}px`, width: `${width}px` });
  }

  function unlockPage() {
    for (const [name, value] of savedBody) {
      if (value) document.body.style.setProperty(name, value);
      else document.body.style.removeProperty(name);
    }
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    root.classList.remove('has-card-dialog');
    window.scrollTo(savedScroll.x, savedScroll.y);
    root.style.scrollBehavior = previousBehavior;
  }

  function finishClose(entry) {
    if (active !== entry) return;
    animation?.cancel();
    clearTimeout(entry.revealTimer);
    animation = undefined;
    entry.dialog.close();
    entry.trigger.setAttribute('aria-expanded', 'false');
    unlockPage();
    active = undefined;
    closing = undefined;
    dismissPending = false;
    // Fragment restoration happens after popstate. Return focus on the next frame.
    restoreFrame = requestAnimationFrame(() => {
      if (active) return;
      history.scrollRestoration = savedRestoration;
      savedRestoration = undefined;
      entry.trigger.focus({ preventScroll: true });
    });
  }

  function open(entry, instant = false, push = true) {
    if (active) return;
    lockPage();
    active = entry;
    entry.dialog.dataset.state = 'opening';
    entry.dialog.showModal();
    entry.surface = entry.dialog.querySelector('[data-dialog-surface]');
    entry.dialog.querySelector('.dialog-scroll').scrollTop = 0;
    entry.trigger.setAttribute('aria-expanded', 'true');
    if (push) history.pushState({ ...history.state, serialDialog: entry.id, serialDialogRestoration: savedRestoration }, '');
    if (instant || preference.matches || !entry.surface.animate) {
      entry.dialog.dataset.state = 'open';
      return;
    }
    entry.revealTimer = setTimeout(() => {
      if (active === entry && entry.dialog.dataset.state === 'opening') entry.dialog.dataset.state = 'revealing';
    }, 120);
    animation = entry.surface.animate([
      { transform: lowered(entry), opacity: 0 },
      { transform: entry.rest || 'none', opacity: 1 },
    ], { duration: 380, easing: 'cubic-bezier(.32,.72,0,1)' });
    animation.finished.then(() => {
      clearTimeout(entry.revealTimer);
      if (active === entry && entry.dialog.dataset.state !== 'closing') entry.dialog.dataset.state = 'open';
    }).catch(() => {});
  }

  function close(entry, instant = false) {
    if (closing) return closing;
    if (active !== entry) return Promise.resolve();
    entry.dialog.dataset.state = 'closing';
    clearTimeout(entry.revealTimer);
    const { transform: from, opacity } = getComputedStyle(entry.surface);
    animation?.cancel();
    if (instant || preference.matches || !entry.surface.animate) {
      finishClose(entry);
      return Promise.resolve();
    }
    // Sink back out from wherever the entrance had reached.
    animation = entry.surface.animate([
      { transform: from, opacity },
      { transform: lowered(entry), opacity: 0 },
    ], { duration: 200, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' });
    closing = animation.finished.catch(() => {}).then(() => finishClose(entry));
    return closing;
  }

  function dismiss(entry, instant) {
    if (active !== entry || closing || dismissPending) return;
    if (history.state?.serialDialog === entry.id) {
      dismissPending = true;
      instantDismiss = instant;
      history.back();
    } else void close(entry, instant);
  }

  async function syncHistory() {
    dismissPending = false;
    const target = byId.get(history.state?.serialDialog);
    const instant = instantDismiss;
    instantDismiss = false;
    if (active && active !== target) await close(active, instant);
    const current = byId.get(history.state?.serialDialog);
    if (!active && current) open(current, true, false);
  }

  for (const entry of entries) {
    entry.trigger.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      open(entry, event.detail === 0);
    });
    entry.dialog.querySelector('[data-dialog-close]').addEventListener('click', event => dismiss(entry, event.detail === 0));
    entry.dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(entry, true); });
    entry.dialog.addEventListener('click', event => { if (event.target === entry.dialog) dismiss(entry, false); });
  }
  window.addEventListener('popstate', syncHistory);
  window.addEventListener('resize', () => {
    if (active) document.body.style.width = `${root.clientWidth}px`;
  }, { passive: true });
  window.addEventListener('pagehide', () => { if (active) finishClose(active); });
  window.addEventListener('pageshow', () => { void syncHistory(); });
  preference.addEventListener('change', () => {
    if (preference.matches) animation?.finish();
  });
  void syncHistory();
}
