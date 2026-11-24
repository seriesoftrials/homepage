const objectId = /^[a-f0-9]{64}$/;
const pageSize = 24;
const roomCode = /^[a-f0-9]{10}$/;

export function roomDirectory(env) {
  return env.LIVE_ROOM_DIRECTORY.get(env.LIVE_ROOM_DIRECTORY.idFromName("rooms"));
}

export function trackRoom(env, origin, id) {
  return roomDirectory(env).fetch(`${origin}/track`, { method: "POST", body: id.toString() });
}

export async function readRoomSummary(env, origin, id) {
  const room = env.LIVE_ROOMS.get(id);
  const response = await room.fetch(`${origin}/summary`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Live room lookup failed.");
  const payload = await response.json();
  const { code, title, open } = payload.room ?? payload;
  return roomCode.test(code) && env.LIVE_ROOMS.idFromName(code).toString() === id.toString()
    ? { code, title, open: Boolean(open) }
    : null;
}

export class LiveRoomDirectory {
  constructor(ctx, env) {
    this.sql = ctx.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS room_objects (id TEXT PRIMARY KEY)");
    for (const [key, value] of Object.entries(env)) {
      if (!/^LIVE_ROOM_OBJECT_IDS_\d+$/.test(key)) continue;
      for (const id of value.split(",")) {
        if (objectId.test(id)) this.sql.exec("INSERT OR IGNORE INTO room_objects (id) VALUES (?)", id);
      }
    }
  }

  async fetch(request) {
    if (request.method === "POST") {
      const id = await request.text();
      if (!objectId.test(id)) return new Response(null, { status: 400 });
      this.sql.exec("INSERT OR IGNORE INTO room_objects (id) VALUES (?)", id);
      return new Response(null, { status: 204 });
    }
    const after = new URL(request.url).searchParams.get("after") ?? "";
    const rows = this.sql.exec("SELECT id FROM room_objects WHERE id > ? ORDER BY id LIMIT ?", after, pageSize + 1).toArray();
    return Response.json({ ids: rows.slice(0, pageSize).map(({ id }) => id), next: rows.length > pageSize ? rows[pageSize - 1].id : null });
  }
}
