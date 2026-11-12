import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const origin = process.env.DEPLOYMENT_URL || "https://seriesoftrials.com";
const revision = process.env.DEPLOYMENT_SHA || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const request = (path) => fetch(`${origin}${path}`, { redirect: "manual", signal: AbortSignal.timeout(15000) });
const digest = (body) => createHash("sha256").update(body).digest("hex");

async function verify() {
  const deployment = await request("/api/deployment");
  assert.equal(deployment.status, 200, "Homepage deployment endpoint");
  const status = await deployment.json();
  assert.equal(status.ok, true);
  assert.equal(status.revision, revision, "Deployed homepage commit");
  for (const [path, file] of [
    ["/", "index.html"], ["/ver2", "index.html"], ["/intro", "intro.html"],
    ["/ver2.css", "ver2.css"], ["/ver2-hero.js", "ver2-hero.js"],
    ["/profiles/hyoseok-v2-cutout.webp", "profiles/hyoseok-v2-cutout.webp"],
  ]) {
    const response = await request(path);
    assert.equal(response.status, 200, `${path} status`);
    assert.equal(response.headers.get("x-serial-homepage-revision"), revision, `${path} revision`);
    const [remote, local] = await Promise.all([response.arrayBuffer(), readFile(new URL(`../public/grainy/${file}`, import.meta.url))]);
    assert.equal(digest(Buffer.from(remote)), digest(local), `${path} matches this checkout`);
  }
  for (const path of ["/login", "/people", "/projects", "/brand"]) {
    const response = await request(path);
    assert.equal(response.status, 200, `${path} backend status`);
    await response.body?.cancel();
  }
  for (const path of ["/members", "/updates"]) {
    const response = await request(path);
    assert.equal(response.status, 303, `${path} requires a session`);
    assert.ok(response.headers.get("location")?.startsWith("/login"), `${path} login redirect`);
    await response.body?.cancel();
  }
  const health = await request("/api/health");
  assert.equal(health.status, 200, "Backend database health");
  assert.equal((await health.json()).ok, true);
  const auth = await request("/api/auth/ready");
  assert.equal(auth.status, 200, "Authentication readiness");
  assert.equal((await auth.json()).available, true);
}

for (let attempt = 1; attempt <= 6; attempt++) {
  try {
    await verify();
    console.log(`Verified homepage ${revision} at ${origin}: matching assets, backend health, login configuration and member protection.`);
    break;
  } catch (error) {
    if (attempt === 6) throw error;
    console.log(`Deployment check ${attempt}/6: ${error.message}`);
    await new Promise((done) => setTimeout(done, 5000));
  }
}
