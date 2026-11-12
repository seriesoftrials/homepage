export function mountCardDialogs(preference) {
  if (typeof HTMLDialogElement === 'undefined') return;
  const root = document.documentElement;
  const entries = [
    { id: 'spirit-story', trigger: document.querySelector('[data-open-story]'), source: document.querySelector('#spirit'), morph: true },
    { id: 'support-dialog', trigger: document.querySelector('[data-open-support]'), morph: false },
  ].map(entry => ({ ...entry, dialog: document.getElementById(entry.id) }))
    .filter(entry => entry.trigger && entry.dialog && (!entry.morph || entry.dialog.querySelector('.manifesto')));
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  let active;
  let animation;
  let closing;
  let instantDismiss = false;
  let dismissPending = false;
  let savedScroll;
  let savedBody;
  let savedVisibility;
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

  function sourceTransform(entry, bounds) {
    const destination = entry.surface.getBoundingClientRect();
    return `translate(${bounds.left - destination.left}px, ${bounds.top - destination.top}px) scale(${bounds.width / destination.width}, ${bounds.height / destination.height})`;
  }

  function morphCardContent(entry, bounds, opening) {
    if (!entry.morph) return;
    const destination = entry.surface.getBoundingClientRect();
    const created = !entry.preview;
    if (!entry.preview) {
      const preview = entry.source.cloneNode(true);
      preview.removeAttribute('id');
      preview.removeAttribute('aria-labelledby');
      preview.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      preview.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
      preview.classList.add('dialog-card-preview');
      preview.setAttribute('aria-hidden', 'true');
      preview.inert = true;
      entry.dialog.append(preview);
      entry.preview = preview;
    }
    const previous = getComputedStyle(entry.preview);
    const current = { transform: previous.transform, opacity: previous.opacity };
    entry.previewAnimation?.cancel();
    Object.assign(entry.preview.style, { left: `${bounds.left}px`, top: `${bounds.top}px`, width: `${bounds.width}px`, height: `${bounds.height}px`, visibility: 'visible' });
    const readingTransform = `translate(${destination.left - bounds.left}px, ${destination.top - bounds.top}px) scale(${destination.width / bounds.width}, ${destination.height / bounds.height})`;
    const reverseFrom = created || Number(current.opacity) === 0 ? { transform: readingTransform, opacity: 0 } : current;
    entry.previewAnimation = entry.preview.animate(opening
      ? [{ transform: 'none', opacity: 1 }, { transform: readingTransform, opacity: 0 }]
      : [reverseFrom, { transform: 'none', opacity: 1 }],
    { duration: opening ? 300 : 180, easing: opening ? 'cubic-bezier(.32,.72,0,1)' : 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' });
  }

  function finishClose(entry) {
    if (active !== entry) return;
    animation?.cancel();
    clearTimeout(entry.revealTimer);
    entry.previewAnimation?.cancel();
    entry.preview?.remove();
    entry.preview = undefined;
    animation = undefined;
    entry.dialog.close();
    if (entry.source) entry.source.style.visibility = savedVisibility;
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
    const bounds = entry.source?.getBoundingClientRect();
    lockPage();
    active = entry;
    entry.dialog.dataset.state = 'opening';
    entry.dialog.showModal();
    entry.surface = entry.dialog.querySelector('[data-dialog-surface]');
    entry.dialog.querySelector('.dialog-scroll').scrollTop = 0;
    entry.trigger.setAttribute('aria-expanded', 'true');
    if (entry.source) {
      savedVisibility = entry.source.style.visibility;
      entry.source.style.visibility = 'hidden';
    }
    if (push) history.pushState({ ...history.state, serialDialog: entry.id, serialDialogRestoration: savedRestoration }, '');
    const from = entry.morph ? sourceTransform(entry, bounds) : 'translate(-50%, -50%) scale(.97)';
    const to = entry.morph ? 'none' : 'translate(-50%, -50%)';
    if (instant || preference.matches || !entry.surface.animate) {
      entry.dialog.dataset.state = 'open';
      return;
    }
    morphCardContent(entry, bounds, true);
    entry.revealTimer = setTimeout(() => {
      if (active === entry && entry.dialog.dataset.state === 'opening') entry.dialog.dataset.state = 'revealing';
    }, 120);
    animation = entry.surface.animate([{ transform: from }, { transform: to }], { duration: entry.morph ? 300 : 180, easing: 'cubic-bezier(.32,.72,0,1)' });
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
    const from = getComputedStyle(entry.surface).transform;
    animation?.cancel();
    if (instant || preference.matches || !entry.surface.animate) {
      finishClose(entry);
      return Promise.resolve();
    }
    // Read the resting geometry after cancelling the entrance, then reverse it.
    const to = entry.morph ? sourceTransform(entry, entry.source.getBoundingClientRect()) : 'translate(-50%, -50%) scale(.97)';
    morphCardContent(entry, entry.source?.getBoundingClientRect(), false);
    animation = entry.surface.animate([{ transform: from }, { transform: to }], { duration: 180, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' });
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
    if (preference.matches) { animation?.finish(); active?.previewAnimation?.finish(); }
  });
  void syncHistory();
}
