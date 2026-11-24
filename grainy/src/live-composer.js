export function setupComposer(form, slot, field) {
  const dialog = document.getElementById("compose-dialog");
  const closeButton = document.getElementById("close-compose");
  const shared = [form.querySelector("#compose-title"), field, form.querySelector(".compose-meta")];
  const controls = [closeButton, form.querySelector("#question-targets"), form.querySelector(".compose-submit")];
  const viewport = window.visualViewport;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const openTiming = { duration: 370, easing: "cubic-bezier(.2, .78, .24, 1)" };
  const closeTiming = { duration: 285, easing: "cubic-bezier(.3, .1, .34, 1)", fill: "forwards" };
  const revealed = { opacity: 1, transform: "translateY(0)" };
  const concealed = { opacity: 0, transform: "translateY(5px)" };
  let motions = [];
  let dockLayout;

  function fitViewport() {
    if (!dialog.open || !viewport) return;
    dialog.style.setProperty("--compose-viewport-top", `${viewport.offsetTop}px`);
    dialog.style.setProperty("--compose-viewport-height", `${viewport.height}px`);
  }

  function measure(card) {
    const bounds = card.getBoundingClientRect();
    const content = shared.map((node) => {
      const rect = node.getBoundingClientRect();
      return { x: rect.left - bounds.left, y: rect.top - bounds.top, height: rect.height };
    });
    return { bounds, content };
  }

  function clip(height, radius) {
    return `inset(0px 0px ${Math.max(0, height)}px 0px round ${radius})`;
  }

  function morphFrames(modal, dockBounds) {
    const { bounds, content } = modal;
    const frames = [{
      node: dialog,
      docked: {
        transform: `translate(${dockBounds.left - bounds.left}px, calc(-50% + ${dockBounds.top - bounds.top}px))`,
        clipPath: clip(bounds.height - dockBounds.height, "18px"),
      },
      opened: { transform: "translate(0px, -50%)", clipPath: clip(0, "18px") },
    }];
    shared.forEach((node, index) => {
      const from = dockLayout.content[index];
      const to = content[index];
      const docked = { transform: `translate(${from.x - to.x}px, ${from.y - to.y}px)` };
      const opened = { transform: "translate(0px, 0px)" };
      if (node === field && from.height < to.height) {
        docked.clipPath = clip(to.height - from.height, "12px");
        opened.clipPath = clip(0, "12px");
      }
      frames.push({ node, docked, opened });
    });
    return frames;
  }

  function cancelMotions() {
    for (const animation of motions) animation.cancel();
    motions = [];
  }

  function finishClose() {
    cancelMotions();
    dialog.close();
    closeButton.hidden = true;
    slot.append(form);
    slot.style.height = "";
    delete dialog.dataset.closing;
    if (!slot.hidden) slot.focus({ preventScroll: true });
  }

  function close(animate = true) {
    if (!dialog.open) return;
    if (!animate || reducedMotion.matches || slot.hidden) return finishClose();
    if (dialog.hasAttribute("data-closing")) return;
    dialog.dataset.closing = "";
    const snapshots = [dialog, ...shared, ...controls].map((node) => {
      const { transform, clipPath, opacity } = getComputedStyle(node);
      return { node, transform, clipPath, opacity };
    });
    cancelMotions();
    motions = morphFrames(measure(dialog), slot.getBoundingClientRect()).map(({ node, docked, opened }, index) => {
      const { transform, clipPath } = snapshots[index];
      const current = { transform };
      if (docked.clipPath) current.clipPath = clipPath === "none" ? opened.clipPath : clipPath;
      return node.animate([current, docked], closeTiming);
    });
    for (const { node, transform, opacity } of snapshots.slice(1 + shared.length)) {
      if (!node.hidden) motions.push(node.animate([{ transform, opacity }, concealed], {
        duration: 135, easing: "ease-out", fill: "forwards",
      }));
    }
    motions[0].onfinish = finishClose;
  }

  function open() {
    if (dialog.open || slot.hidden) return;
    dockLayout = measure(form);
    slot.style.height = `${dockLayout.bounds.height}px`;
    dialog.append(form);
    closeButton.hidden = false;
    dialog.showModal();
    field.focus({ preventScroll: true });
    fitViewport();
    if (!reducedMotion.matches) {
      motions = morphFrames(measure(dialog), dockLayout.bounds)
        .map(({ node, docked, opened }) => node.animate([docked, opened], openTiming));
      for (const node of controls) {
        if (!node.hidden) motions.push(node.animate([concealed, revealed], {
          delay: 100, duration: 220, easing: "cubic-bezier(.22, .7, .3, 1)", fill: "backwards",
        }));
      }
    }
  }

  field.addEventListener("click", open);
  field.addEventListener("input", open);
  closeButton.addEventListener("click", () => close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  viewport?.addEventListener("resize", fitViewport);
  viewport?.addEventListener("scroll", fitViewport);
  return close;
}
