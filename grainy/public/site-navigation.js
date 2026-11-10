(() => {
  if (!document.getElementById("site-page")) return;

  const publicPaths = new Set(["/", "/index.html", "/intro", "/intro/", "/people", "/people/", "/projects", "/projects/"]);
  const metadataSelector = 'meta[name="viewport"], meta[name="theme-color"], meta[name="description"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"]';
  const positions = new Map();
  let entry = history.state?.serialEntry || crypto.randomUUID();
  let displayedUrl = new URL(location.href);
  let pending;
  let transition;

  history.replaceState({ ...history.state, serialEntry: entry }, "");
  history.scrollRestoration = "manual";

  function isPublicPage(url) {
    return url.origin === location.origin && publicPaths.has(url.pathname);
  }

  async function navigate(url, { pop = false, targetEntry } = {}) {
    positions.set(entry, { left: scrollX, top: scrollY });
    const position = pop ? positions.get(targetEntry) : null;
    pending?.abort();
    transition?.skipTransition();
    const request = new AbortController();
    pending = request;
    document.documentElement.setAttribute("aria-busy", "true");

    try {
      const response = await fetch(url.href, { signal: request.signal, credentials: "same-origin" });
      if (!response.ok || response.redirected || !response.headers.get("content-type")?.includes("text/html")) {
        throw new Error("Page unavailable");
      }
      const nextDocument = new DOMParser().parseFromString(await response.text(), "text/html");
      const source = nextDocument.getElementById("site-page");
      if (!source) throw new Error("Page cannot be navigated inline");
      const nextPage = document.importNode(source, true);

      // Decode before changing the visible DOM, so photos never pop in after it.
      await Promise.all([...nextPage.querySelectorAll("img")].map(image => image.decode().catch(() => {})));
      if (request.signal.aborted) return;
      const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

      const commit = () => {
        if (request.signal.aborted) return;
        document.getElementById("site-page").replaceWith(nextPage);
        document.body.className = nextDocument.body.className;
        if (!pop && !reducedMotion && nextDocument.body.className.split(/\s+/).includes("intro-page")) {
          document.body.className += " serial-intro-enter";
        }
        document.title = nextDocument.title;
        document.querySelectorAll(metadataSelector).forEach(element => element.remove());
        nextDocument.querySelectorAll(metadataSelector).forEach(element => {
          document.head.append(document.importNode(element, true));
        });

        entry = pop ? targetEntry : crypto.randomUUID();
        if (!pop) history.pushState({ serialEntry: entry }, "", url.href);
        displayedUrl = url;
        window.scrollTo({ left: position?.left || 0, top: position?.top || 0, behavior: "instant" });
        if (url.hash) document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView({ behavior: "instant" });
        document.dispatchEvent(new CustomEvent("serial:pagechange"));
      };

      if (document.startViewTransition && !reducedMotion) {
        const logo = document.querySelector("#site-page .wordmark");
        const bounds = logo?.getBoundingClientRect();
        // A header above the viewport should not fly in from outside the screen.
        document.documentElement.classList.toggle("serial-static-logo", !!bounds && (bounds.bottom <= 0 || bounds.top >= innerHeight));
        transition = document.startViewTransition(commit);
        transition.ready.catch(() => {});
        await transition.finished;
      } else {
        commit();
      }

      if (!request.signal.aborted && !nextPage.contains(document.activeElement)) {
        const main = nextPage.querySelector("main");
        main?.setAttribute("tabindex", "-1");
        main?.focus({ preventScroll: true });
      }
    } catch {
      if (!request.signal.aborted) location.assign(url.href);
    } finally {
      if (pending === request) {
        pending = null;
        transition = null;
        document.documentElement.removeAttribute("aria-busy");
        document.documentElement.classList.remove("serial-static-logo");
      }
    }
  }

  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.("a[href]");
    if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
    const url = new URL(link.href);
    if (!isPublicPage(url)) return;
    if (url.pathname === displayedUrl.pathname && url.search === displayedUrl.search) return;
    event.preventDefault();
    void navigate(url);
  });

  window.addEventListener("popstate", event => {
    const url = new URL(location.href);
    if (!isPublicPage(url)) return;
    if (url.pathname === displayedUrl.pathname && url.search === displayedUrl.search) {
      positions.set(entry, { left: scrollX, top: scrollY });
      pending?.abort();
      transition?.skipTransition();
      pending = null;
      transition = null;
      document.documentElement.removeAttribute("aria-busy");
      document.documentElement.classList.remove("serial-static-logo");
      entry = event.state?.serialEntry || crypto.randomUUID();
      history.replaceState({ ...event.state, serialEntry: entry }, "");
      displayedUrl = url;
      const position = positions.get(entry);
      window.scrollTo({ left: position?.left || 0, top: position?.top || 0, behavior: "instant" });
      if (url.hash) document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView({ behavior: "instant" });
      return;
    }
    void navigate(url, { pop: true, targetEntry: event.state?.serialEntry });
  });
})();
