// Local Next preview only. Production /api/* is forwarded to the member Worker
// by worker/index.mjs, so D1 remains owned by the existing member server.
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') return new Response(null, { status: 404 });
  const incoming = new URL(request.url);
  const previewOrigin = `${incoming.protocol}//${request.headers.get('host') || incoming.host}`;
  if (request.headers.get('origin') !== previewOrigin || request.headers.get('sec-fetch-site') === 'cross-site') {
    return Response.json({ error: 'invalid_origin' }, { status: 403 });
  }
  const origin = new URL(process.env.SERIAL_MEMBER_API_ORIGIN || 'http://localhost:4174');
  if (!['localhost', '127.0.0.1'].includes(origin.hostname)) {
    return Response.json({ error: 'invalid_preview_backend' }, { status: 503 });
  }
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: 'invalid_body' }, { status: 400 });
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) {
        await reader.cancel();
        return Response.json({ error: 'body_too_large' }, { status: 413 });
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const response = await fetch(new URL('/api/pre-registrations', origin), {
      method: 'POST',
      headers: { 'content-type': request.headers.get('content-type') || '', origin: origin.origin },
      body: bytes,
      signal: AbortSignal.timeout(10000),
      redirect: 'error',
    });
    return new Response(response.body, { status: response.status, headers: {
      'content-type': 'application/json', 'cache-control': 'no-store',
      ...(response.headers.has('retry-after') ? { 'retry-after': response.headers.get('retry-after')! } : {}),
    } });
  } catch {
    return Response.json({ error: 'temporarily_unavailable' }, { status: 503 });
  }
}
