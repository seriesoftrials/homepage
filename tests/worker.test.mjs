import assert from "node:assert/strict";
import { test } from "node:test";
import worker from "../worker/index.mjs";

const revision = "a".repeat(40);
test("landing aliases and query strings serve the new assets", async () => {
  for (const [path, expected] of [
    ["/?lang=ko", "/index.html?lang=ko"],
    ["/ver2/", "/index.html"],
    ["/intro", "/intro.html"],
    ["/support?ref=alumni", "/support.html?ref=alumni"],
    ["/support/", "/support.html"],
  ]) {
    const response = await worker.fetch(new Request(`https://seriesoftrials.com${path}`), {
      DEPLOYMENT_SHA: revision,
      ASSETS: { fetch: async (request) => {
        const url = new URL(request.url);
        assert.equal(url.pathname + url.search, expected);
        return new Response("homepage", { headers: { "content-type": "text/html" } });
      } },
    });
    assert.equal(await response.text(), "homepage");
    assert.equal(response.headers.get("x-serial-homepage-revision"), revision);
    assert.equal(response.headers.get("cache-control"), "no-cache");
  }
});

test("protected routes bypass assets and preserve cookies, status and response headers", async () => {
  for (const path of ["/members", "/members/", "/updates", "/updates/", "/login", "/api/auth/get-session", "/api/health"]) {
    const request = new Request(`https://seriesoftrials.com${path}`, { headers: { cookie: "session=existing" } });
    const response = await worker.fetch(request, {
      ASSETS: { fetch: () => assert.fail("Protected pages must not be served as public assets") },
      BACKEND: { fetch: async (forwarded) => {
        assert.equal(forwarded, request);
        assert.equal(forwarded.headers.get("cookie"), "session=existing");
        return new Response(null, { status: 303, headers: { location: "/login", "cache-control": "private, no-store", "set-cookie": "session=renewed; HttpOnly" } });
      } },
    });
    assert.equal(response.status, 303);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(response.headers.get("set-cookie"), "session=renewed; HttpOnly");
  }
});

test("POST bodies reach the existing backend unchanged", async () => {
  const request = new Request("https://seriesoftrials.com/api/inquiries", { method: "POST", body: '{"name":"test"}' });
  const response = await worker.fetch(request, {
    BACKEND: { fetch: async (forwarded) => {
      assert.equal(forwarded, request);
      assert.equal(await forwarded.text(), '{"name":"test"}');
      return new Response(null, { status: 201 });
    } },
  });
  assert.equal(response.status, 201);
});

test("pages and files outside the homepage fall through to the backend", async () => {
  const request = new Request("https://seriesoftrials.com/brand?lang=en");
  const response = await worker.fetch(request, {
    ASSETS: { fetch: async () => new Response(null, { status: 404 }) },
    BACKEND: { fetch: async (forwarded) => {
      assert.equal(forwarded, request);
      return new Response("brand");
    } },
  });
  assert.equal(await response.text(), "brand");
});

test("image restrictions preserve public social previews", async () => {
  const env = { ASSETS: { fetch: async () => new Response("image", { headers: { "content-type": "image/png" } }) } };
  const headers = { "sec-fetch-mode": "navigate", "sec-fetch-site": "cross-site" };
  assert.equal((await worker.fetch(new Request("https://seriesoftrials.com/profiles/member.png", { headers }), env)).status, 403);
  assert.equal((await worker.fetch(new Request("https://seriesoftrials.com/og-image-v1.png", { headers }), env)).status, 200);
});

test("deployment identity is uncached and does not intercept backend health", async () => {
  const response = await worker.fetch(new Request("https://seriesoftrials.com/api/deployment"), { DEPLOYMENT_SHA: revision });
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { ok: true, revision, repository: "seriesoftrials/homepage" });
  const head = await worker.fetch(new Request("https://seriesoftrials.com/api/deployment", { method: "HEAD" }), { DEPLOYMENT_SHA: revision });
  assert.equal(await head.text(), "");
});

test("the Live entry redirects to the event management page", async () => {
  for (const [method, path] of [["GET", "/live"], ["HEAD", "/live/?ref=home"]]) {
    const url = new URL(path, "https://seriesoftrials.com");
    const response = await worker.fetch(new Request(url, { method }), {});
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), `/live/manage${url.search}`);
  }
});

test("live participant, stage and admin views serve the same standalone page", async () => {
  for (const path of ["/live/manage", "/live/0123456789", "/live/0123456789/screen", "/live/0123456789/manage"]) {
    const response = await worker.fetch(new Request(`https://seriesoftrials.com${path}`), {
      ASSETS: { fetch: async (request) => {
        assert.equal(new URL(request.url).pathname, "/live.html");
        return new Response("live");
      } },
    });
    assert.equal(await response.text(), "live");
    assert.equal(response.headers.get("x-robots-tag"), "noindex");
  }
});

test("live manager permissions come from the verified member session", async () => {
  const origin = "https://seriesoftrials.com";
  const url = `${origin}/api/live/0123456789/manage`;
  const env = {
    LIVE_ROOMS: { idFromName: () => assert.fail("Unauthorized requests must not reach live rooms") },
    BACKEND: { fetch: async (request) => {
      assert.equal(request.url, `${origin}/api/me`);
      assert.equal(request.headers.get("cookie"), "session=member");
      assert.equal(request.headers.get("oai-authenticated-user-id"), null);
      return Response.json({ member: { role: "member" } });
    } },
  };
  assert.equal((await worker.fetch(new Request(url), env)).status, 401);
  const headers = { cookie: "session=member", "oai-authenticated-user-id": "fake-admin" };
  assert.equal((await worker.fetch(new Request(url, { headers }), env)).status, 403);
  assert.equal((await worker.fetch(new Request(url, { method: "PATCH", headers: { ...headers, origin: "https://other.example" } }), env)).status, 403);
});
