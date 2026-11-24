const roomCode = "[a-f0-9]{10}";
const apiPath = new RegExp(`^/api/live/(${roomCode})(?:/(stream|posts|manage))?$`);
const pagePath = new RegExp(`^/live/(?:${roomCode})(?:/(?:screen|manage))?/?$`);
const postLimit = 1000;

export function isLivePage(pathname) {
  return /^\/live\/manage\/?$/.test(pathname) || pagePath.test(pathname);
}

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

function error(message, status) {
  return json({ error: message }, status);
}

async function readInput(request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json" || !request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch {
    return null;
  }
}

async function adminAccess(request, env, origin) {
  const cookie = request.headers.get("cookie");
  if (!cookie) return error("SERIAL 관리자 로그인이 필요합니다.", 401);

  try {
    const response = await env.BACKEND.fetch(new Request(`${origin}/api/me`, { headers: { cookie } }));
    if (response.status === 401) return error("SERIAL 관리자 로그인이 필요합니다.", 401);
    if (response.status === 403) return error("SERIAL 관리자만 사용할 수 있습니다.", 403);
    if (response.ok) {
      const { member } = await response.json();
      return member?.role === "admin" ? null : error("SERIAL 관리자만 사용할 수 있습니다.", 403);
    }
  } catch {
    // The member service can be temporarily unavailable.
  }
  return error("관리자 권한을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.", 503);
}

export async function handleLive(request, env, url) {
  const creating = url.pathname === "/api/live/rooms";
  const route = apiPath.exec(url.pathname);
  if (!creating && !route) return error("주소를 다시 확인해 주세요.", 404);
  const [, code, view = "state"] = route || [];
  const { method } = request;
  const allowed = creating || view === "posts" ? ["POST"] : view === "manage" ? ["GET", "PATCH"] : ["GET"];
  if (!allowed.includes(method)) return error("지원하지 않는 요청입니다.", 405);
  if ((method !== "GET" || view === "stream") && request.headers.get("origin") !== url.origin) {
    return error("이 페이지에서 다시 시도해 주세요.", 403);
  }

  if (creating || view === "manage") {
    const denial = await adminAccess(request, env, url.origin);
    if (denial) return denial;
  }

  if (creating) {
    const input = await readInput(request);
    const title = typeof input?.title === "string" ? input.title.trim() : "";
    if (!title || title.length > 80) return error("행사 이름을 1~80자로 입력해 주세요.", 400);
    for (let attempt = 0; attempt < 3; attempt++) {
      const id = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
      const room = env.LIVE_ROOMS.get(env.LIVE_ROOMS.idFromName(id));
      const response = await room.fetch(`${url.origin}/create`, {
        method: "POST",
        body: JSON.stringify({ code: id, title }),
      });
      if (response.status !== 409) return response;
    }
    return error("행사를 만들 수 없습니다. 다시 시도해 주세요.", 503);
  }

  const room = env.LIVE_ROOMS.get(env.LIVE_ROOMS.idFromName(code));
  if (view === "stream") {
    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
      return error("실시간 연결을 시작할 수 없습니다.", 426);
    }
    return room.fetch(`${url.origin}/stream`, { headers: { upgrade: "websocket" } });
  }
  if (method === "GET") return room.fetch(`${url.origin}/${view}`);

  const input = await readInput(request);
  if (!input || typeof input !== "object" || Array.isArray(input)) return error("입력 내용을 확인해 주세요.", 400);
  return room.fetch(`${url.origin}/${view}`, { method, body: JSON.stringify(input) });
}

export class LiveRoom {
  constructor(ctx) {
    this.ctx = ctx;
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS room (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1), code TEXT NOT NULL,
      title TEXT NOT NULL, open INTEGER NOT NULL DEFAULT 1, version INTEGER NOT NULL DEFAULT 0
    )`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS posts (
      sequence INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, text TEXT NOT NULL,
      createdAt INTEGER NOT NULL, hidden INTEGER NOT NULL DEFAULT 0
    )`);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  current() {
    return this.sql.exec("SELECT code, title, open, version FROM room WHERE singleton = 1").toArray()[0];
  }

  snapshot(room, admin = false) {
    const posts = admin
      ? this.sql.exec("SELECT id, text, createdAt, hidden FROM posts ORDER BY sequence DESC").toArray()
      : this.sql.exec("SELECT id, text, createdAt FROM posts WHERE hidden = 0 ORDER BY sequence DESC LIMIT 50").toArray();
    const total = this.sql.exec(admin ? "SELECT COUNT(*) AS count FROM posts" : "SELECT COUNT(*) AS count FROM posts WHERE hidden = 0").one().count;
    return { room, posts, total };
  }

  async fetch(request) {
    const room = this.current();
    const path = new URL(request.url).pathname;
    if (path === "/create") {
      if (room) return error("이미 사용 중인 행사 링크입니다.", 409);
      const { code, title } = await request.json();
      const created = this.sql.exec("INSERT INTO room (singleton, code, title) VALUES (1, ?, ?) ON CONFLICT DO NOTHING RETURNING code", code, title).toArray()[0];
      if (!created) return error("이미 사용 중인 행사 링크입니다.", 409);
      return json(this.snapshot(this.current(), true), 201);
    }
    if (!room) return error("행사를 찾을 수 없습니다. 참가 링크를 확인해 주세요.", 404);
    if (path === "/stream") {
      const [client, server] = Object.values(new WebSocketPair());
      this.ctx.acceptWebSocket(server);
      server.send(JSON.stringify(this.snapshot(room)));
      return new Response(null, { status: 101, webSocket: client });
    }
    if (request.method === "GET") return json(this.snapshot(room, path === "/manage"));

    const input = await request.json();
    // Read after the body await so a concurrent pause takes effect before inserting.
    if (path === "/posts") return this.submit(input, this.current());
    if (path === "/manage") return this.update(input);
    return error("주소를 다시 확인해 주세요.", 404);
  }

  submit({ id, text }, room) {
    const message = typeof text === "string" ? text.trim() : "";
    if (typeof id !== "string" || !/^[a-f0-9]{32}$/.test(id) || !message || message.length > 280) {
      return error("글을 1~280자로 입력해 주세요.", 400);
    }
    const existing = this.sql.exec("SELECT id, text FROM posts WHERE id = ?", id).toArray()[0];
    if (existing) return existing.text === message ? json({ id }) : error("다시 입력해 주세요.", 409);
    if (!room.open) return error("이 행사의 글 접수가 마감되었습니다.", 409);
    const count = this.sql.exec("SELECT COUNT(*) AS count FROM posts").one().count;
    if (count >= postLimit) return error("이 행사에서 받을 수 있는 글이 모두 찼습니다.", 409);
    this.ctx.storage.transactionSync(() => {
      this.sql.exec("INSERT INTO posts (id, text, createdAt) VALUES (?, ?, ?)", id, message, Date.now());
      this.sql.exec("UPDATE room SET version = version + 1 WHERE singleton = 1");
    });
    this.broadcast(this.current());
    return json({ id }, 201);
  }

  update({ open, id, hidden }) {
    if (typeof open === "boolean") {
      this.sql.exec("UPDATE room SET open = ?, version = version + 1 WHERE singleton = 1", Number(open));
    } else if (typeof id === "string" && typeof hidden === "boolean") {
      const changed = this.ctx.storage.transactionSync(() => {
        const post = this.sql.exec("UPDATE posts SET hidden = ? WHERE id = ? RETURNING id", Number(hidden), id).toArray()[0];
        if (post) this.sql.exec("UPDATE room SET version = version + 1 WHERE singleton = 1");
        return post;
      });
      if (!changed) return error("글을 찾을 수 없습니다.", 404);
    } else {
      return error("입력 내용을 확인해 주세요.", 400);
    }
    const room = this.current();
    this.broadcast(room);
    return json(this.snapshot(room, true));
  }

  broadcast(room) {
    const sockets = this.ctx.getWebSockets();
    if (!sockets.length) return;
    const message = JSON.stringify(this.snapshot(room));
    for (const socket of sockets) {
      if (socket.readyState !== WebSocket.OPEN) continue;
      try { socket.send(message); } catch { socket.close(1011, "Reconnect"); }
    }
  }

  webSocketMessage(socket) {
    socket.close(1008, "Read only");
  }
}
