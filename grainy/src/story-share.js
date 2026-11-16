import { normalizeLanguage, translations } from './ver2-i18n.js';

export async function shareStory(data, copy, container) {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return '';
    } catch (error) {
      if (error.name === 'AbortError') return '';
    }
  }

  try {
    await navigator.clipboard.writeText(data.url);
    return copy.storyLinkCopied;
  } catch {
    // Keep the fallback inside the active dialog; the rest of the page is inert.
    const input = document.createElement('textarea');
    input.value = data.url;
    input.readOnly = true;
    input.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    container.append(input);
    input.select();
    try {
      if (document.execCommand('copy')) return copy.storyLinkCopied;
    } catch { /* The browser may also deny the legacy clipboard API. */ }
    finally { input.remove(); }
    window.prompt(copy.storyCopyPrompt, data.url);
    return '';
  }
}

export function mountStoryShare() {
  const dialog = document.querySelector('#origin-story');
  const button = dialog?.querySelector('[data-share-story]');
  const status = dialog?.querySelector('[data-share-status]');
  if (!button || !status) return;
  let resetTimer;

  button.addEventListener('click', async () => {
    if (button.disabled) return;
    button.disabled = true;
    clearTimeout(resetTimer);
    status.textContent = '';
    const copy = translations[normalizeLanguage(document.documentElement.lang)];
    try {
      status.textContent = await shareStory({
        title: `${copy.originLink} · SERIAL`,
        url: new URL('/intro', window.location.origin).href,
      }, copy, dialog);
      resetTimer = setTimeout(() => { status.textContent = ''; }, 3000);
    } finally {
      button.disabled = false;
      if (dialog.open) button.focus({ preventScroll: true });
    }
  });
  dialog.addEventListener('close', () => {
    clearTimeout(resetTimer);
    status.textContent = '';
  });
}
