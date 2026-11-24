import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { handleLive, LiveRoom } from "../worker/live.mjs";

function openRoom(db) {
  globalThis.WebSocketRequestResponsePair ??= class {};
  return new LiveRoom({
    storage: {
      sql: {
        exec(query, ...params) {
          const rows = db.prepare(query).all(...params.map((param) => param instanceof ArrayBuffer ? new Uint8Array(param) : param));
          return { toArray: () => rows, one: () => rows[0] };
        },
      },
      transactionSync(callback) {
        db.exec("BEGIN");
        try {
          const result = callback();
          db.exec("COMMIT");
          return result;
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
      },
    },
    getWebSockets: () => [],
    setWebSocketAutoResponse() {},
  });
}

function request(room, path, data) {
  return room.fetch(new Request(`https://example.test/${path}`, data && {
    method: "POST",
    body: JSON.stringify(data),
  }));
}

test("an existing AWAKE room keeps its questions and accepts new speaker-specific questions", async () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec(`
      CREATE TABLE posts (
        sequence INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, text TEXT NOT NULL,
        createdAt INTEGER NOT NULL, hidden INTEGER NOT NULL DEFAULT 0
      );
      INSERT INTO posts (id, text, createdAt) VALUES ('legacy', '기존 질문', 1);
    `);
    const first = openRoom(db);
    await request(first, "create", { code: "0123456789", title: "AWAKE 2026" });
    const room = openRoom(db);
    const initial = await (await request(room, "state")).json();
    assert.equal(initial.room.imageUrl, "/events/awake-2026-icon.png");
    assert.deepEqual(initial.room.speakers.map(({ name }) => name), ["박이철", "임지훈", "김민서"]);
    assert.equal(initial.posts[0].speaker, "");
    assert.equal(initial.posts[0].text, "기존 질문");

    const post = { id: "a".repeat(32), text: "어떻게 시작하셨나요?", speaker: "ichel" };
    assert.equal((await request(room, "posts", post)).status, 201);
    assert.equal((await request(room, "posts", post)).status, 200);
    assert.equal((await request(room, "posts", { ...post, speaker: "jihoon" })).status, 409);
    assert.equal((await request(room, "posts", { ...post, speaker: "other" })).status, 400);
    assert.equal((await request(room, "posts", { id: "b".repeat(32), text: "전체 질문" })).status, 201);
    for (const path of ["state", "manage"]) {
      const snapshot = await (await request(room, path)).json();
      assert.equal(snapshot.total, 3);
      assert.deepEqual(snapshot.posts.map(({ speaker }) => speaker), ["", "ichel", ""]);
    }
  } finally {
    db.close();
  }
});

test("unrelated events retain the existing general question flow", async () => {
  const db = new DatabaseSync(":memory:");
  try {
    const room = openRoom(db);
    const created = await (await request(room, "create", { code: "0123456789", title: "SERIAL 정기회의" })).json();
    assert.deepEqual(created.room.speakers, []);
    assert.equal(created.room.imageUrl, null);
    const post = { id: "a".repeat(32), text: "질문" };
    assert.equal((await request(room, "posts", { ...post, speaker: "minseo" })).status, 400);
    assert.equal((await request(room, "posts", post)).status, 201);
  } finally {
    db.close();
  }
});

test("only an administrator can replace the room's public event image", async () => {
  const db = new DatabaseSync(":memory:");
  try {
    const room = openRoom(db);
    await request(room, "create", { code: "0123456789", title: "AWAKE 2026" });
    const env = {
      BACKEND: { fetch: () => Response.json({ member: { role: "admin" } }) },
      LIVE_ROOMS: {
        idFromName: (code) => code,
        get: () => ({ fetch: (url, init) => room.fetch(new Request(url, init)) }),
      },
    };
    const url = new URL("https://example.test/api/live/0123456789/image");
    const jpeg = Uint8Array.of(0xff, 0xd8, 0xff, 0xd9);
    const upload = (body, cookie) => handleLive(new Request(url, {
      method: "PUT",
      headers: { origin: url.origin, "content-type": "image/jpeg", ...(cookie && { cookie }) },
      body,
    }), env, url);

    assert.equal((await upload(jpeg)).status, 401);
    assert.equal((await upload(Uint8Array.of(0), "session=admin")).status, 400);
    const uploaded = await upload(jpeg, "session=admin");
    assert.equal(uploaded.status, 200);
    const { room: updated } = await uploaded.json();
    assert.equal(updated.imageUrl, "/api/live/0123456789/image?v=1");
    const image = await handleLive(new Request(url), env, url);
    assert.equal(image.headers.get("content-type"), "image/jpeg");
    assert.deepEqual(new Uint8Array(await image.arrayBuffer()), jpeg);
  } finally {
    db.close();
  }
});
