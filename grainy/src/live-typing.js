export function setupTyping(send) {
  const dots = document.getElementById("typing-dots");
  const status = document.getElementById("typing-status");
  const peers = new Map();
  let lastSent = -Infinity;
  let outgoing = false;
  let sendTimer;
  let idleTimer;

  function report() {
    sendTimer = undefined;
    if (!send("typing")) return;
    lastSent = performance.now();
    outgoing = true;
  }

  function stop() {
    clearTimeout(sendTimer);
    clearTimeout(idleTimer);
    sendTimer = undefined;
    if (outgoing) send("typing-stop");
    outgoing = false;
  }

  function input(active) {
    if (!active) return stop();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(stop, 3000);
    if (sendTimer !== undefined) return;
    const wait = 2400 - (performance.now() - lastSent);
    if (wait > 0) sendTimer = setTimeout(report, wait);
    else report();
  }

  function show() {
    const count = peers.size;
    const label = count ? `${count}명이 작성 중이에요` : "";
    if (status.textContent === label) return;
    dots.hidden = count === 0;
    status.textContent = label;
  }

  function remove(id) {
    clearTimeout(peers.get(id));
    peers.delete(id);
    show();
  }

  function receive({ id, active }) {
    if (!active) return remove(id);
    clearTimeout(peers.get(id));
    peers.set(id, setTimeout(() => remove(id), 6500));
    show();
  }

  function reset() {
    stop();
    lastSent = -Infinity;
    for (const timer of peers.values()) clearTimeout(timer);
    peers.clear();
    show();
  }

  return { input, receive, reset, stop };
}
