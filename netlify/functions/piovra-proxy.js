/**
 * Netlify Function (v2 API) that proxies authenticated requests to the piovra
 * orchestrator running on the VPS. The PIOVRA_API_KEY secret lives in Netlify
 * env vars and is never exposed to the browser.
 *
 * Path examples:
 *   POST /api/piovra/orchestrate        (SSE streamed through)
 *   GET  /api/piovra/definitions
 *   GET  /api/piovra/instances
 *   GET  /api/piovra/runs
 */

export default async (req, _context) => {
  const piovraUrl = process.env.PIOVRA_URL;
  const piovraKey = process.env.PIOVRA_API_KEY;

  if (!piovraUrl || !piovraKey) {
    return new Response(
      JSON.stringify({ error: 'Piovra is not configured on the server.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const inUrl = new URL(req.url);
  // Strip the /api/piovra prefix (or /.netlify/functions/piovra-proxy)
  const stripped = inUrl.pathname
    .replace(/^\/api\/piovra/, '')
    .replace(/^\/\.netlify\/functions\/piovra-proxy/, '');
  const target = new URL(stripped + inUrl.search, piovraUrl).toString();

  const upstreamHeaders = new Headers();
  for (const [k, v] of req.headers.entries()) {
    const lower = k.toLowerCase();
    if (lower === 'host' || lower === 'content-length') continue;
    if (lower === 'authorization') continue; // never forward caller auth
    upstreamHeaders.set(k, v);
  }
  upstreamHeaders.set('x-piovra-key', piovraKey);

  const upstream = await fetch(target, {
    method: req.method,
    headers: upstreamHeaders,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req.body,
    // @ts-expect-error undici-specific flag; required to stream request bodies
    duplex: 'half',
  });

  // Copy upstream headers (drop hop-by-hop)
  const outHeaders = new Headers();
  for (const [k, v] of upstream.headers.entries()) {
    const lower = k.toLowerCase();
    if (
      lower === 'transfer-encoding' ||
      lower === 'connection' ||
      lower === 'keep-alive'
    ) {
      continue;
    }
    outHeaders.set(k, v);
  }
  // Make sure SSE proxies don't buffer
  if (outHeaders.get('content-type')?.includes('text/event-stream')) {
    outHeaders.set('Cache-Control', 'no-cache, no-transform');
    outHeaders.set('X-Accel-Buffering', 'no');
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  });
};

export const config = {
  path: ['/api/piovra/*', '/.netlify/functions/piovra-proxy/*'],
};
