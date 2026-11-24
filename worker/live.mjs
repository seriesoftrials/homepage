import { readRoomSummary, roomDirectory, trackRoom } from "./live-directory.mjs";

const roomCode = "[a-f0-9]{10}";
const apiPath = new RegExp(`^/api/live/(${roomCode})(?:/(stream|posts|manage|image|reactions))?$`);
const anonymousId = /^[a-f0-9]{32}$/;
const pagePath = new RegExp(`^/live/(?:${roomCode})(?:/(?:screen|manage))?/?$`);
const postLimit = 1000;
const imageLimit = 96 * 1024;
const awakeImage = "/events/awake-2026-icon.png";
const awakeSpeakers = [
  { id: "ichel", name: "박이철", photo: "/events/awake-speakers/ichel.webp" },
  { id: "jihoon", name: "임지훈", photo: "/events/awake-speakers/jihoon.webp" },
  { id: "minseo", name: "김민서", photo: "/events/awake-speakers/minseo.webp" },
];

function speakerPreset(title) {
  return /\bawake\b|어웨이크/i.test(title) ? "awake" : "";
}

function speakersFor(preset) {
  return preset === "awake" ? awakeSpeakers : [];
}

function eventTitle(value) {
  const title = typeof value === "string" ? value.trim() : "";
  return title.length <= 80 ? title : "";
}

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

function missingRoom() {
  return error("행사를 찾을 수 없습니다. 참가 링크를 확인해 주세요.", 404);
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

async function readImage(request) {
  if (request.headers.get("content-type") !== "image/jpeg" || !request.body) return null;
  const reader = request.body.getReader();
  const bytes = new Uint8Array(imageLimit);
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (size + value.byteLength > imageLimit) {
        await reader.cancel();
        return null;
      }
      bytes.set(value, size);
      size += value.byteLength;
    }
    if (size < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 ||
        bytes[size - 2] !== 0xff || bytes[size - 1] !== 0xd9) return null;
    return bytes.subarray(0, size);
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
  const collection = url.pathname === "/api/live/rooms";
  const remembering = url.pathname === "/api/live/rooms/remember";
  const route = apiPath.exec(url.pathname);
  if (!collection && !remembering && !route) return error("주소를 다시 확인해 주세요.", 404);
  const [, code, view = "state"] = route || [];
  const { method } = request;
  const allowed = collection ? ["GET", "POST"]
    : remembering || view === "posts" ? ["POST"]
    : view === "manage" ? ["GET", "PATCH", "DELETE"]
    : view === "image" || view === "reactions" ? ["GET", "PUT"]
    : ["GET"];
  if (!allowed.includes(method)) return error("지원하지 않는 요청입니다.", 405);
  if ((method !== "GET" || view === "stream") && request.headers.get("origin") !== url.origin) {
    return error("이 페이지에서 다시 시도해 주세요.", 403);
  }

  if (collection || remembering || view === "manage" || (view === "image" && method === "PUT")) {
    const denial = await adminAccess(request, env, url.origin);
    if (denial) return denial;
  }

  if (collection && method === "GET") {
    const after = url.searchParams.get("after");
    if (after !== null && !/^[a-f0-9]{64}$/.test(after)) return error("행사 목록을 다시 열어 주세요.", 400);
    try {
      const page = new URL("/list", url.origin);
      if (after) page.searchParams.set("after", after);
      const { ids, next } = await (await roomDirectory(env).fetch(page)).json();
      const rooms = [];
      for (let start = 0; start < ids.length; start += 5) {
        const summaries = await Promise.all(ids.slice(start, start + 5)
          .map((id) => readRoomSummary(env, url.origin, env.LIVE_ROOMS.idFromString(id))));
        rooms.push(...summaries.filter(Boolean));
      }
      return json({ rooms, next });
    } catch {
      return error("행사 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.", 503);
    }
  }

  if (remembering) {
    const input = await readInput(request);
    if (typeof input?.code !== "string" || !new RegExp(`^${roomCode}$`).test(input.code)) {
      return error("행사 링크나 10자리 코드를 확인해 주세요.", 400);
    }
    const object = env.LIVE_ROOMS.idFromName(input.code);
    try {
      const room = await readRoomSummary(env, url.origin, object);
      if (!room) return missingRoom();
      if (!(await trackRoom(env, url.origin, object)).ok) throw new Error("Directory write failed.");
      return json({ room });
    } catch {
      return error("행사를 목록에 추가하지 못했어요. 잠시 후 다시 시도해 주세요.", 503);
    }
  }

  if (collection) {
    const input = await readInput(request);
    const title = eventTitle(input?.title);
    if (!title) return error("행사 이름을 1~80자로 입력해 주세요.", 400);
    for (let attempt = 0; attempt < 3; attempt++) {
      const id = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
      const object = env.LIVE_ROOMS.idFromName(id);
      try {
        if (!(await trackRoom(env, url.origin, object)).ok) throw new Error("Directory write failed.");
      } catch {
        return error("행사 목록에 저장하지 못했어요. 잠시 후 다시 시도해 주세요.", 503);
      }
      const room = env.LIVE_ROOMS.get(object);
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
    const stream = new URL("/stream", url.origin);
    for (const tag of ["typing", "reactions"]) {
      if (url.searchParams.get(tag) === "1") stream.searchParams.set(tag, "1");
    }
    return room.fetch(stream, { headers: { upgrade: "websocket" } });
  }
  const headers = new Headers();
  if (view === "reactions" || (view === "posts" && request.headers.has("x-live-voter"))) {
    const voter = request.headers.get("x-live-voter");
    if (!anonymousId.test(voter ?? "")) return error("새로고침한 뒤 다시 시도해 주세요.", 400);
    headers.set("x-live-voter", voter);
  }
  if (method === "GET" || method === "DELETE") return room.fetch(`${url.origin}/${view}`, { method, headers });
  if (view === "image") {
    const body = await readImage(request);
    if (!body) return error("이미지를 처리할 수 없어요. 다른 사진을 선택해 주세요.", 400);
    return room.fetch(`${url.origin}/image`, { method, body });
  }

  const input = await readInput(request);
  if (!input || typeof input !== "object" || Array.isArray(input)) return error("입력 내용을 확인해 주세요.", 400);
  return room.fetch(`${url.origin}/${view}`, { method, headers, body: JSON.stringify(input) });
}

export class LiveRoom {
  constructor(ctx) {
    this.ctx = ctx;
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS room (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1), code TEXT NOT NULL,
      title TEXT NOT NULL, open INTEGER NOT NULL DEFAULT 1, version INTEGER NOT NULL DEFAULT 0,
      speakerPreset TEXT NOT NULL DEFAULT '', deleted INTEGER NOT NULL DEFAULT 0
    )`);
    const roomColumns = this.sql.exec("PRAGMA table_info(room)").toArray().map(({ name }) => name);
    if (!roomColumns.includes("speakerPreset")) {
      ctx.storage.transactionSync(() => {
        this.sql.exec("ALTER TABLE room ADD COLUMN speakerPreset TEXT NOT NULL DEFAULT ''");
        const existing = this.sql.exec("SELECT title FROM room WHERE singleton = 1").toArray()[0];
        if (existing) this.sql.exec("UPDATE room SET speakerPreset = ? WHERE singleton = 1", speakerPreset(existing.title));
      });
    }
    if (!roomColumns.includes("deleted")) {
      this.sql.exec("ALTER TABLE room ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0");
    }
    this.sql.exec(`CREATE TABLE IF NOT EXISTS posts (
      sequence INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, text TEXT NOT NULL,
      createdAt INTEGER NOT NULL, hidden INTEGER NOT NULL DEFAULT 0, speaker TEXT NOT NULL DEFAULT '',
      legacyAuthorLike INTEGER NOT NULL DEFAULT 1
    )`);
    const postColumns = this.sql.exec("PRAGMA table_info(posts)").toArray().map(({ name }) => name);
    if (!postColumns.includes("speaker")) {
      this.sql.exec("ALTER TABLE posts ADD COLUMN speaker TEXT NOT NULL DEFAULT ''");
    }
    if (!postColumns.includes("legacyAuthorLike")) {
      this.sql.exec("ALTER TABLE posts ADD COLUMN legacyAuthorLike INTEGER NOT NULL DEFAULT 1");
    }
    this.sql.exec(`CREATE TABLE IF NOT EXISTS event_image (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1), version INTEGER NOT NULL, data BLOB NOT NULL
    )`);
    this.sql.exec("CREATE TABLE IF NOT EXISTS deleted_posts (id TEXT PRIMARY KEY)");
    this.sql.exec(`CREATE TABLE IF NOT EXISTS post_reactions (
      postId TEXT NOT NULL, voter TEXT NOT NULL, PRIMARY KEY (postId, voter)
    )`);
    this.sql.exec("CREATE INDEX IF NOT EXISTS post_reactions_by_voter ON post_reactions (voter)");
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  current() {
    return this.sql.exec("SELECT code, title, open, version, speakerPreset, deleted FROM room WHERE singleton = 1").toArray()[0];
  }

  snapshot({ code, title, open, version, speakerPreset }, admin = false) {
    const posts = admin
      ? this.sql.exec("SELECT id, text, createdAt, hidden, speaker FROM posts ORDER BY sequence DESC").toArray()
      : this.sql.exec(`SELECT id, text, createdAt, speaker,
          legacyAuthorLike + (SELECT COUNT(*) FROM post_reactions WHERE postId = posts.id) AS likes
        FROM posts WHERE hidden = 0 ORDER BY sequence DESC LIMIT 50`).toArray();
    const total = this.sql.exec(admin ? "SELECT COUNT(*) AS count FROM posts" : "SELECT COUNT(*) AS count FROM posts WHERE hidden = 0").one().count;
    const speakers = speakersFor(speakerPreset);
    const image = this.sql.exec("SELECT version FROM event_image WHERE singleton = 1").toArray()[0];
    const imageUrl = image ? `/api/live/${code}/image?v=${image.version}` : speakers.length ? awakeImage : null;
    return { room: { code, title, open, version, speakers, imageUrl }, posts, total };
  }

  async fetch(request) {
    const room = this.current();
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === "/create") {
      if (room) return error("이미 사용 중인 행사 링크입니다.", 409);
      const { code, title } = await request.json();
      const created = this.sql.exec(`INSERT INTO room (singleton, code, title, speakerPreset) VALUES (1, ?, ?, ?)
        ON CONFLICT DO NOTHING RETURNING code`, code, title, speakerPreset(title)).toArray()[0];
      if (!created) return error("이미 사용 중인 행사 링크입니다.", 409);
      return json(this.snapshot(this.current(), true), 201);
    }
    if (!room) return missingRoom();
    if (path === "/manage" && request.method === "DELETE") return this.deleteRoom();
    if (room.deleted) return missingRoom();
    if (path === "/summary") return json({ code: room.code, title: room.title, open: Boolean(room.open) });
    if (path === "/image") return this.eventImage(request);
    if (path === "/stream") {
      const [client, server] = Object.values(new WebSocketPair());
      const tags = ["typing", "reactions"].filter((tag) => url.searchParams.get(tag) === "1");
      this.ctx.acceptWebSocket(server, tags);
      if (tags.includes("typing")) server.serializeAttachment({ id: crypto.randomUUID(), active: false, lastStarted: 0 });
      server.send(JSON.stringify(this.snapshot(room)));
      return new Response(null, { status: 101, webSocket: client });
    }
    if (path === "/reactions" && request.method === "GET") {
      const votes = this.sql.exec("SELECT postId FROM post_reactions WHERE voter = ?", request.headers.get("x-live-voter")).toArray();
      return json({ liked: votes.map(({ postId }) => postId) });
    }
    if (request.method === "GET") return json(this.snapshot(room, path === "/manage"));

    const input = await request.json();
    // Read after the body await so a concurrent pause or deletion takes effect.
    const latest = this.current();
    if (latest.deleted) return missingRoom();
    if (path === "/posts") return this.submit(input, latest, request.headers.get("x-live-voter"));
    if (path === "/reactions") return this.react(input, request.headers.get("x-live-voter"));
    if (path === "/manage") return this.update(input);
    return error("주소를 다시 확인해 주세요.", 404);
  }

  async eventImage(request) {
    if (request.method === "GET") {
      const image = this.sql.exec("SELECT data FROM event_image WHERE singleton = 1").toArray()[0];
      if (!image) return error("행사 이미지가 없어요.", 404);
      return new Response(image.data, {
        headers: { "content-type": "image/jpeg", "cache-control": "no-cache", "x-content-type-options": "nosniff" },
      });
    }
    const data = await request.arrayBuffer();
    if (this.current().deleted) return missingRoom();
    this.ctx.storage.transactionSync(() => {
      const { version } = this.sql.exec("UPDATE room SET version = version + 1 WHERE singleton = 1 RETURNING version").one();
      this.sql.exec(`INSERT INTO event_image (singleton, version, data) VALUES (1, ?, ?)
        ON CONFLICT (singleton) DO UPDATE SET version = excluded.version, data = excluded.data`, version, data);
    });
    const room = this.current();
    this.broadcast(room);
    return json(this.snapshot(room, true));
  }

  submit({ id, text, speaker = "" }, room, voter) {
    const message = typeof text === "string" ? text.trim() : "";
    if (typeof id !== "string" || !anonymousId.test(id) || !message || message.length > 280) {
      return error("글을 1~280자로 입력해 주세요.", 400);
    }
    if (speaker !== "" && !speakersFor(room.speakerPreset).some(({ id }) => id === speaker)) {
      return error("질문 대상을 다시 선택해 주세요.", 400);
    }
    const existing = this.sql.exec(`SELECT text, speaker,
        EXISTS (SELECT 1 FROM post_reactions WHERE postId = posts.id AND voter = ?) AS liked
      FROM posts WHERE id = ?`, voter, id).toArray()[0];
    if (existing) {
      if (existing.text !== message || existing.speaker !== speaker) return error("다시 입력해 주세요.", 409);
      return json({ id, liked: Boolean(existing.liked) });
    }
    if (this.wasDeleted(id)) return json({ id, liked: false });
    if (!room.open) return error("이 행사의 글 접수가 마감되었습니다.", 409);
    const count = this.sql.exec("SELECT COUNT(*) AS count FROM posts").one().count;
    if (count >= postLimit) return error("이 행사에서 받을 수 있는 글이 모두 찼습니다.", 409);
    this.ctx.storage.transactionSync(() => {
      this.sql.exec("INSERT INTO posts (id, text, createdAt, speaker, legacyAuthorLike) VALUES (?, ?, ?, ?, ?)",
        id, message, Date.now(), speaker, Number(!voter));
      if (voter) this.sql.exec("INSERT INTO post_reactions (postId, voter) VALUES (?, ?)", id, voter);
      this.sql.exec("UPDATE room SET version = version + 1 WHERE singleton = 1");
    });
    this.broadcast(this.current());
    return json({ id, liked: Boolean(voter) }, 201);
  }

  wasDeleted(id) {
    return this.sql.exec("SELECT id FROM deleted_posts WHERE id = ?", id).toArray().length > 0;
  }

  react({ id, active }, voter) {
    if (typeof id !== "string" || !anonymousId.test(id) || typeof active !== "boolean") {
      return error("따봉을 반영하지 못했어요. 다시 시도해 주세요.", 400);
    }
    const post = this.sql.exec("SELECT legacyAuthorLike FROM posts WHERE id = ? AND hidden = 0", id).toArray()[0];
    if (!post) {
      return error("이 질문은 더 이상 볼 수 없어요.", 404);
    }
    const { changed, version, likes } = this.ctx.storage.transactionSync(() => {
      const query = active
        ? "INSERT INTO post_reactions (postId, voter) VALUES (?, ?) ON CONFLICT DO NOTHING RETURNING postId"
        : "DELETE FROM post_reactions WHERE postId = ? AND voter = ? RETURNING postId";
      const changed = this.sql.exec(query, id, voter).toArray().length > 0;
      const { version } = changed
        ? this.sql.exec("UPDATE room SET version = version + 1 WHERE singleton = 1 RETURNING version").one()
        : this.current();
      const { likes } = this.sql.exec("SELECT COUNT(*) AS likes FROM post_reactions WHERE postId = ?", id).one();
      return { changed, version, likes };
    });
    const update = { id, version, likes: likes + post.legacyAuthorLike };
    if (changed) this.sendToSockets(this.ctx.getWebSockets("reactions"), { type: "reaction", ...update });
    return json({ ...update, active });
  }

  deletePost(id) {
    if (typeof id !== "string" || !anonymousId.test(id)) return error("입력 내용을 확인해 주세요.", 400);
    const removed = this.ctx.storage.transactionSync(() => {
      const post = this.sql.exec("DELETE FROM posts WHERE id = ? RETURNING id", id).toArray()[0];
      if (!post) return false;
      this.sql.exec("DELETE FROM post_reactions WHERE postId = ?", id);
      // Keep the receipt ID so a retry cannot bring the deleted post back.
      this.sql.exec("INSERT INTO deleted_posts (id) VALUES (?)", id);
      this.sql.exec("UPDATE room SET version = version + 1 WHERE singleton = 1");
      return true;
    });
    if (!removed && !this.wasDeleted(id)) return error("글을 찾을 수 없습니다.", 404);
    const room = this.current();
    if (removed) this.broadcast(room);
    return json(this.snapshot(room, true));
  }

  deleteRoom() {
    // Keep the room code reserved so old links cannot open another event.
    this.sql.exec("UPDATE room SET deleted = 1, open = 0, version = version + 1 WHERE singleton = 1 AND deleted = 0");
    for (const socket of this.ctx.getWebSockets()) {
      if (socket.readyState === WebSocket.OPEN) socket.close(4004, "Room deleted");
    }
    return json({ ok: true });
  }

  update({ title: name, open, id, hidden, remove }) {
    if (remove === true) return this.deletePost(id);
    if (name !== undefined) {
      const title = eventTitle(name);
      if (!title) return error("행사 이름을 1~80자로 입력해 주세요.", 400);
      this.sql.exec("UPDATE room SET title = ?, version = version + 1 WHERE singleton = 1 AND title <> ?", title, title);
    } else if (typeof open === "boolean") {
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
    if (sockets.length) this.sendToSockets(sockets, this.snapshot(room));
  }

  sendToSockets(sockets, payload, sender) {
    const message = JSON.stringify(payload);
    for (const socket of sockets) {
      if (socket === sender || socket.readyState !== WebSocket.OPEN) continue;
      try { socket.send(message); } catch { socket.close(1011, "Reconnect"); }
    }
  }

  webSocketMessage(socket, message) {
    const sender = socket.deserializeAttachment();
    if (!sender || (message !== "typing" && message !== "typing-stop")) {
      socket.close(1008, "Unsupported message");
      return;
    }
    const active = message === "typing";
    const now = Date.now();
    if (active ? now - sender.lastStarted < 1000 || !this.current()?.open : !sender.active) return;
    socket.serializeAttachment({ ...sender, active, lastStarted: active ? now : sender.lastStarted });
    this.broadcastTyping(socket, sender.id, active);
  }

  broadcastTyping(sender, id, active) {
    this.sendToSockets(this.ctx.getWebSockets("typing"), { type: "typing", id, active }, sender);
  }

  webSocketClose(socket) {
    const sender = socket.deserializeAttachment();
    if (sender?.active) this.broadcastTyping(socket, sender.id, false);
  }
}
