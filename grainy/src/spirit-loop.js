export function spiritFramePosition(top, artworkHeight, viewportHeight, frameCount) {
  // Prefer the part of the scroll where the entire figure fits on screen.
  const start = Math.max(viewportHeight * .4, viewportHeight - artworkHeight - 32);
  const end = viewportHeight * .12;
  const progress = Math.max(0, Math.min(1, (start - top) / (start - end)));
  return progress * Math.max(0, frameCount - 1);
}

export function spiritFrameOpacities(position, frameCount) {
  // Opaque lower frames prevent a transparent seam during each crossfade.
  return Array.from({ length: frameCount }, (_, index) => index === 0 ? 1 : Math.max(0, Math.min(1, position - index + 1)));
}

export function mountSpiritLoop(artwork, preference) {
  if (!artwork) return null;
  const urls = artwork.dataset.spiritFrames?.split(',').filter(Boolean) ?? [];
  const frames = [];
  let nearViewport = false;
  let loaded = false;
  let loading = false;

  async function loadFrames() {
    if (!urls.length || loading || loaded || preference.matches) return;
    loading = true;
    const images = urls.map(url => {
      const image = new Image();
      image.className = 'spirit-frame';
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      image.draggable = false;
      image.decoding = 'async';
      image.src = url;
      return image;
    });
    try {
      await Promise.all(images.map(image => image.decode()));
      frames.push(...images);
      artwork.append(...images);
      loaded = true;
      artwork.dataset.sequence = 'ready';
    } catch {
      // Preserve the original picture if any frame is unavailable.
      artwork.dataset.sequence = 'unavailable';
    }
    sync();
  }

  function sync() {
    const bounds = artwork.getBoundingClientRect();
    const visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
    artwork.dataset.motion = visible && !preference.matches && !document.hidden ? 'running' : 'paused';
    if (nearViewport && !preference.matches) void loadFrames();
    if (!loaded) return;
    const position = preference.matches ? 0 : Math.round(spiritFramePosition(bounds.top, bounds.height, window.innerHeight, frames.length + 1));
    const opacities = spiritFrameOpacities(position, frames.length + 1);
    frames.forEach((image, index) => {
      const opacity = opacities[index + 1].toFixed(3);
      if (image.style.opacity !== opacity) image.style.opacity = opacity;
    });
    artwork.dataset.frame = String(Math.floor(position));
  }

  const observer = new IntersectionObserver(entries => {
    nearViewport = entries[0].isIntersecting;
    sync();
  }, { rootMargin: '500px 0px' });
  observer.observe(artwork);
  preference.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  sync();

  return { refresh: sync };
}
