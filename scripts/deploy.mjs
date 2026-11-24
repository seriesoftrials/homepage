import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const revision = process.env.DEPLOYMENT_SHA || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (!/^[a-f0-9]{40}$/i.test(revision)) throw new Error("DEPLOYMENT_SHA must be a full Git commit SHA.");
const config = JSON.parse(readFileSync(new URL("../wrangler.json", import.meta.url), "utf8"));
const token = process.env.CLOUDFLARE_API_TOKEN;
const account = process.env.CLOUDFLARE_ACCOUNT_ID || config.account_id;

async function cloudflare(path, query) {
  const url = new URL(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/durable_objects/namespaces${path}`);
  url.search = new URLSearchParams(query);
  const res = await fetch(url, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Cloudflare could not list existing Live room storage (HTTP ${res.status}).`);
  const data = await res.json();
  if (!data.success || !Array.isArray(data.result)) throw new Error("Cloudflare returned an invalid Live room inventory.");
  return data;
}

async function existingRoomObjects() {
  let namespace;
  for (let page = 1; !namespace; page++) {
    const { result, result_info: info } = await cloudflare("", { page, per_page: 50 });
    namespace = result.find((item) => item.script === config.name && item.class === "LiveRoom");
    if (!namespace && page >= (info?.total_pages ?? (result.length < 50 ? page : page + 1))) return [];
  }
  const ids = new Set();
  const cursors = new Set();
  let cursor;
  do {
    const { result, result_info: info } = await cloudflare(`/${encodeURIComponent(namespace.id)}/objects`, {
      limit: 100, ...(cursor && { cursor }),
    });
    for (const { id, hasStoredData } of result) {
      if (hasStoredData !== false && /^[a-f0-9]{64}$/.test(id)) ids.add(id);
    }
    cursor = info?.cursor;
    if (cursor && cursors.has(cursor)) throw new Error("Cloudflare returned a repeated Live room inventory cursor.");
    if (cursor) cursors.add(cursor);
  } while (cursor);
  return [...ids].sort();
}

const args = ["deploy", "--var", `DEPLOYMENT_SHA:${revision}`];
let scratch;
try {
  if (token) {
    const ids = await existingRoomObjects().catch((error) => {
      console.warn(`Existing Live room inventory was not refreshed: ${error.message}`);
      return [];
    });
    if (ids.length) {
      const values = {};
      for (let i = 0; i < ids.length; i += 64) {
        values[`LIVE_ROOM_OBJECT_IDS_${i / 64}`] = ids.slice(i, i + 64).join(",");
      }
      scratch = mkdtempSync(join(tmpdir(), "serial-live-deploy-"));
      const file = join(scratch, "bindings.json");
      writeFileSync(file, JSON.stringify(values), { mode: 0o600 });
      args.push("--secrets-file", file);
    }
    console.log(`Found ${ids.length} Live storage objects to check for existing events.`);
  }
  execFileSync("node_modules/.bin/wrangler", args, { stdio: "inherit" });
} finally {
  if (scratch) rmSync(scratch, { recursive: true });
}
