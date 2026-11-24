import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { handleLive, LiveRoom } from "../worker/live.mjs";

function openRoom(db, getWebSockets = () => []) {
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
    getWebSockets,
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
      CREATE TABLE room (
        singleton INTEGER PRIMARY KEY CHECK (singleton = 1), code TEXT NOT NULL,
        title TEXT NOT NULL, open INTEGER NOT NULL DEFAULT 1, version INTEGER NOT NULL DEFAULT 0
      );
      INSERT INTO room (singleton, code, title) VALUES (1, '0123456789', 'AWAKE 2026');
      CREATE TABLE posts (
        sequence INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, text TEXT NOT NULL,
        createdAt INTEGER NOT NULL, hidden INTEGER NOT NULL DEFAULT 0
      );
      INSERT INTO posts (id, text, createdAt) VALUES ('legacy', '기존 질문', 1);
    `);
    const room = openRoom(db);
    const initial = await (await request(room, "state")).json();
    assert.equal(initial.room.imageUrl, "/events/awake-2026-icon.png");
    assert.deepEqual(initial.room.speakers.map(({ name }) => name), ["박이철", "임지훈", "김민서"]);
    assert.equal(initial.posts[0].speaker, "");
    assert.equal(initial.posts[0].text, "기존 질문");
    assert.equal(initial.posts[0].likes, 1);

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

test("author reactions start selected and changes broadcast only the new count", async () => {
  const db = new DatabaseSync(":memory:");
  try {
    const messages = [];
    const room = openRoom(db, (tag) => tag === "reactions" ? [{
      readyState: WebSocket.OPEN,
      send: (message) => messages.push(JSON.parse(message)),
    }] : []);
    const code = "0123456789";
    const id = "a".repeat(32);
    const author = "b".repeat(32);
    const second = "c".repeat(32);
    await request(room, "create", { code, title: "Test event" });
    const env = { LIVE_ROOMS: {
      idFromName: (name) => name,
      get: () => ({ fetch: (url, init) => room.fetch(new Request(url, init)) }),
    } };
    const url = new URL(`https://example.test/api/live/${code}/reactions`);
    const postsUrl = new URL(`https://example.test/api/live/${code}/posts`);
    const submit = () => handleLive(new Request(postsUrl, {
      method: "POST",
      headers: { origin: url.origin, "content-type": "application/json", "x-live-voter": author },
      body: JSON.stringify({ id, text: "Question" }),
    }), env, postsUrl);
    const reaction = (voter, active, origin = url.origin) => handleLive(new Request(url, {
      method: active === undefined ? "GET" : "PUT",
      headers: { origin, "content-type": "application/json", "x-live-voter": voter },
      body: active === undefined ? undefined : JSON.stringify({ id, active }),
    }), env, url);

    assert.deepEqual(await (await submit()).json(), { id, liked: true });
    assert.equal((await (await request(room, "state")).json()).posts[0].likes, 1);
    assert.deepEqual(await (await reaction(author)).json(), { liked: [id] });
    assert.deepEqual(await (await reaction(second)).json(), { liked: [] });
    assert.equal((await reaction("wrong", true)).status, 400);
    assert.equal((await reaction(author, true, "https://other.test")).status, 403);
    const added = await (await reaction(second, true)).json();
    assert.deepEqual(added, { id, version: 2, likes: 2, active: true });
    assert.deepEqual(await (await reaction(second, true)).json(), added);
    assert.deepEqual(messages, [{ type: "reaction", id, version: 2, likes: 2 }]);
    assert.equal((await (await reaction(author, false)).json()).likes, 1);
    assert.deepEqual(await (await reaction(author)).json(), { liked: [] });
    assert.deepEqual(await (await submit()).json(), { id, liked: false });
    assert.deepEqual(await (await reaction(second)).json(), { liked: [id] });
    assert.equal((await (await request(openRoom(db), "state")).json()).posts[0].likes, 1);

    await request(room, "manage", { id, hidden: true });
    assert.equal((await reaction(author, true)).status, 404);
    await request(room, "manage", { id, remove: true });
    assert.deepEqual(await (await reaction(second)).json(), { liked: [] });
    assert.equal((await reaction(author, true)).status, 404);
  } finally {
    db.close();
  }
});

test("event actions require an administrator and preserve room identity until deletion", async () => {
  const db = new DatabaseSync(":memory:");
  try {
    const room = openRoom(db);
    const code = "0123456789";
    await request(room, "create", { code, title: "AWAKE 2026" });
    const original = { id: "a".repeat(32), text: "기존 발표 질문", speaker: "minseo" };
    assert.equal((await request(room, "posts", original)).status, 201);
    const env = {
      BACKEND: { fetch: (req) => Response.json({ member: { role: req.headers.get("cookie").split("=")[1] } }) },
      LIVE_ROOMS: {
        idFromName: (name) => name,
        get: () => ({ fetch: (url, init) => room.fetch(new Request(url, init)) }),
      },
    };
    const url = new URL(`https://example.test/api/live/${code}/manage`);
    const action = (method, role, body, origin = url.origin) => handleLive(new Request(url, {
      method,
      headers: { origin, "content-type": "application/json", ...(role && { cookie: `session=${role}` }) },
      body: body && JSON.stringify(body),
    }), env, url);

    assert.equal((await action("PATCH", "member", { title: "새 이름" })).status, 403);
    assert.equal((await action("PATCH", "admin", { title: " " })).status, 400);
    assert.equal((await action("DELETE")).status, 401);
    assert.equal((await action("DELETE", "member")).status, 403);
    assert.equal((await action("DELETE", "admin", undefined, "https://other.test")).status, 403);
    const renamed = await (await action("PATCH", "admin", { title: "  새 이름  " })).json();
    assert.equal(renamed.room.code, code);
    assert.equal(renamed.room.title, "새 이름");
    assert.equal(renamed.room.open, 1);
    assert.equal(renamed.room.imageUrl, "/events/awake-2026-icon.png");
    assert.equal(renamed.room.speakers.length, 3);
    assert.equal(renamed.posts[0].id, original.id);
    const persisted = openRoom(db);
    assert.deepEqual(await (await request(persisted, "summary")).json(), { code, title: "새 이름", open: true });
    assert.equal((await request(persisted, "posts", { ...original, id: "b".repeat(32) })).status, 201);

    assert.equal((await action("DELETE", "admin")).status, 200);
    assert.equal((await action("DELETE", "admin")).status, 200);
    for (const path of ["state", "summary", "manage", "stream", "image"]) {
      assert.equal((await request(persisted, path)).status, 404);
    }
    assert.equal((await request(persisted, "posts", original)).status, 404);
    assert.equal((await action("PATCH", "admin", { title: "다시 열기" })).status, 404);
    assert.equal((await request(persisted, "create", { code, title: "다른 행사" })).status, 409);
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
