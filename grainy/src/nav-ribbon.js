import { mountRibbon } from '../assets/serial-ribbon-sequence/landing.js';
import { SEQUENCE_DURATION, ROTATION_DURATION, nextRotationStop } from '../assets/serial-ribbon-sequence/sequence.js';

// Use the intro's actual geometry and deformation, rendering only while hovered.
export function mountNavRibbon(brand, preference) {
  const holder = brand?.querySelector('[data-nav-ribbon]');
  if (!holder) return;
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  let ribbon;
  let frame = 0;
  let timer = 0;
  let hovering = false;

  function stop() {
    hovering = false;
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    frame = timer = 0;
    brand.classList.remove('has-ribbon');
    ribbon?.seek?.(SEQUENCE_DURATION);
  }

  function turn() {
    if (!hovering || preference.matches || document.hidden) return stop();
    const end = nextRotationStop(ribbon.state.elapsed / SEQUENCE_DURATION) * SEQUENCE_DURATION;
    const start = end - ROTATION_DURATION;
    const began = performance.now();
    const draw = now => {
      const progress = Math.min(1, (now - began) / 1500);
      const eased = progress * progress * (3 - 2 * progress);
      ribbon.seek(start + eased * ROTATION_DURATION);
      if (progress < 1) frame = requestAnimationFrame(draw);
      else { frame = 0; timer = setTimeout(turn, 1500); }
    };
    ribbon.seek(start);
    brand.classList.add('has-ribbon');
    frame = requestAnimationFrame(draw);
  }

  function enter(event) {
    if (event.pointerType === 'touch' || !hover.matches || preference.matches || hovering) return;
    hovering = true;
    if (!ribbon) {
      try {
        ribbon = mountRibbon(holder, {
          initialElapsed: SEQUENCE_DURATION, autoplay: false, interactive: false, maxPixelRatio: 2, cameraZoom: 1.28,
          // Preserve the original 30px logo slot, with room for 3D deformation.
          createMaterial: THREE => new THREE.MeshPhysicalMaterial({
            color: 0x171715, metalness: .25, roughness: .3, clearcoat: 1, clearcoatRoughness: .2,
          }),
          onReady: () => { if (hovering) turn(); },
        });
        if (!ribbon.seek) stop();
      } catch { stop(); }
    } else if (ribbon.state.ready) turn();
  }

  function visibility() { if (document.hidden) stop(); }
  function motion() { if (preference.matches || !hover.matches) stop(); }
  const listeners = [
    [brand, 'pointerenter', enter], [brand, 'pointerleave', stop], [brand, 'pointercancel', stop],
    [document, 'visibilitychange', visibility], [preference, 'change', motion], [hover, 'change', motion],
    [holder.querySelector('canvas'), 'webglcontextlost', stop],
  ];
  for (const [target, type, listener] of listeners) target.addEventListener(type, listener);
  return { dispose() {
    stop();
    for (const [target, type, listener] of listeners) target.removeEventListener(type, listener);
    ribbon?.dispose();
  } };
}
