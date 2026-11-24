import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { LiveRoom } from "../worker/live.mjs";

test("moderators can remove public and hidden posts without replay restoring them", async (t) => {
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  globalThis.WebSocketRequestResponsePair = class {};
  t.after(() => { delete globalThis.WebSocketRequestResponsePair; });
  const room = new LiveRoom({
    storage: {
      sql: {
        exec(statement, ...parameters) {
          const rows = db.prepare(statement).all(...parameters);
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
    setWebSocketAutoResponse() {},
    getWebSockets: () => [],
  });
  const request = (path, method = "GET", body) => room.fetch(new Request(`https://test.invalid${path}`, {
    method, body: body && JSON.stringify(body),
  }));

  assert.equal((await request("/create", "POST", { code: "0123456789", title: "Test event" })).status, 201);
  const visible = { id: "a".repeat(32), text: "Visible post" };
  const hidden = { id: "b".repeat(32), text: "Hidden post" };
  assert.equal((await request("/posts", "POST", visible)).status, 201);
  assert.equal((await request("/posts", "POST", hidden)).status, 201);
  assert.equal((await request("/manage", "PATCH", { id: hidden.id, hidden: true })).status, 200);

  const remove = (id) => request("/manage", "PATCH", { id, remove: true });
  const first = await remove(visible.id);
  assert.equal(first.status, 200);
  const remaining = await first.json();
  assert.deepEqual(remaining.posts.map(({ id }) => id), [hidden.id]);
  assert.deepEqual((await (await request("/state")).json()).posts, []);
  assert.equal((await request("/posts", "POST", visible)).status, 200);
  assert.equal((await (await remove(visible.id)).json()).room.version, remaining.room.version);

  assert.equal((await remove(hidden.id)).status, 200);
  assert.equal((await (await request("/manage")).json()).total, 0);
  assert.equal((await request("/manage", "PATCH", { id: hidden.id, hidden: false })).status, 404);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM posts").get().count, 0);
});
