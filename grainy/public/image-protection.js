(() => {
  const imageSelector = "img, .hero-image, .person-profile__avatar, .wordmark-mark";
  const editableSelector = "input, textarea, [contenteditable]:not([contenteditable='false'])";

  function isImageTarget(target) {
    return target instanceof Element && Boolean(target.closest(imageSelector));
  }

  function isEditable(target) {
    return target instanceof Element && Boolean(target.closest(editableSelector));
  }

  document.querySelectorAll("img").forEach((image) => {
    image.draggable = false;
  });

  for (const eventName of ["contextmenu", "dragstart"]) {
    document.addEventListener(eventName, (event) => {
      if (isImageTarget(event.target)) event.preventDefault();
    }, true);
  }

  function protectClipboard(event) {
    if (isEditable(event.target) || isEditable(document.activeElement)) return;

    const selection = window.getSelection();
    const includesImage = selection?.rangeCount > 0 && [...document.querySelectorAll(imageSelector)]
      .some((image) => selection.containsNode(image, true));

    if (!isImageTarget(event.target) && !includesImage) return;

    event.preventDefault();
    event.clipboardData?.clearData();
    // Keep selected text copyable without putting images into the clipboard.
    const text = selection?.toString() ?? "";
    if (text && event.clipboardData) event.clipboardData.setData("text/plain", text);
  }

  document.addEventListener("copy", protectClipboard, true);
  document.addEventListener("cut", protectClipboard, true);
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
    }
  }, true);
})();
