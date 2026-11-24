import { handleLive, isLivePage } from "./live.mjs";
import { styleMemberPage } from "./member-page.mjs";

export { LiveRoom } from "./live.mjs";
export { LiveRoomDirectory } from "./live-directory.mjs";

const pagePaths = new Map([
  ["/", "/index.html"],
  ["/ver2", "/index.html"],
  ["/ver2/", "/index.html"],
  ["/intro", "/intro.html"],
  ["/intro/", "/intro.html"],
  ["/support", "/support.html"],
  ["/support/", "/support.html"],
]);

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (/^\/api\/live(?:\/|$)/.test(url.pathname)) return handleLive(request, env, url);
    if (url.pathname === "/api/deployment") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
      }
      return new Response(request.method === "HEAD" ? null : JSON.stringify({
        ok: Boolean(env.DEPLOYMENT_SHA),
        revision: env.DEPLOYMENT_SHA || null,
        repository: "seriesoftrials/homepage",
      }), {
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
      });
    }

    // Preserve the complete request, including session cookies and POST bodies.
    // Protected pages always reach the member server, even if an asset is added.
    const memberPage = /^\/(login|members)\/?$/.exec(url.pathname)?.[1];
    if (request.method === "GET" && memberPage) {
      return styleMemberPage(await env.BACKEND.fetch(request), memberPage);
    }
    if (!["GET", "HEAD"].includes(request.method) ||
        /^\/(?:api|login|members|updates)(?:\/|$)/.test(url.pathname)) {
      return env.BACKEND.fetch(request);
    }

    if (url.pathname === "/live" || url.pathname === "/live/") {
      return new Response(null, { status: 302, headers: { location: `/live/manage${url.search}` } });
    }

    const assetUrl = new URL(url);
    const live = isLivePage(url.pathname) || url.pathname === "/live.html";
    assetUrl.pathname = live ? "/live.html" : pagePaths.get(url.pathname) || url.pathname;
    const asset = await env.ASSETS.fetch(new Request(assetUrl, request));
    if (asset.status === 404) return env.BACKEND.fetch(request);

    if (asset.headers.get("content-type")?.startsWith("image/") &&
        url.pathname !== "/og-image-v1.png" &&
        (request.headers.get("sec-fetch-mode") === "navigate" ||
         request.headers.get("sec-fetch-site") === "cross-site")) {
      return new Response("Image access is restricted.", { status: 403 });
    }
    const response = new Response(asset.body, asset);
    response.headers.set("cache-control", "no-cache");
    response.headers.set("x-content-type-options", "nosniff");
    response.headers.set("x-frame-options", "DENY");
    response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
    if (live) response.headers.set("x-robots-tag", "noindex");
    response.headers.set("x-serial-homepage-revision", env.DEPLOYMENT_SHA || "local");
    return response;
  },
};

export default worker;
