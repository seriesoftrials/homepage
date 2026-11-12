import assert from "node:assert/strict";
import { test } from "node:test";
import worker from "../worker/index.mjs";

const revision = "a".repeat(40);
test("landing aliases and query strings serve the new assets", async () => {
  for (const [path, expected] of [["/?lang=ko", "/index.html?lang=ko"], ["/ver2/", "/index.html"], ["/intro", "/intro.html"]]) {
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
