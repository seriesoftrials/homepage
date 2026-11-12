const pagePaths = new Map([
  ["/", "/index.html"],
  ["/ver2", "/index.html"],
  ["/ver2/", "/index.html"],
  ["/intro", "/intro.html"],
  ["/intro/", "/intro.html"],
]);

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
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
    if (!["GET", "HEAD"].includes(request.method) ||
        /^\/(?:api|login|members|updates)(?:\/|$)/.test(url.pathname)) {
      return env.BACKEND.fetch(request);
    }

    const assetUrl = new URL(url);
    assetUrl.pathname = pagePaths.get(url.pathname) || url.pathname;
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
    response.headers.set("x-serial-homepage-revision", env.DEPLOYMENT_SHA || "local");
    return response;
  },
};

export default worker;
