import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

function backendBase(): string {
  const raw =
    process.env.BACKEND_URL ||
    process.env.RAILWAY_API_URL ||
    process.env.NEST_API_URL ||
    '';
  return raw.replace(/\/$/, '');
}

function readBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const base = backendBase();
  if (!base) {
    res.status(502).json({
      error:
        'BACKEND_URL is not set. In Vercel → Environment Variables add BACKEND_URL (Production), then redeploy.',
    });
    return;
  }

  const q = req.query.path;
  const segments = Array.isArray(q) ? q : q != null ? [String(q)] : [];
  const path = segments.join('/');

  const url = req.url || '';
  const qIdx = url.indexOf('?');
  const search = qIdx >= 0 ? url.slice(qIdx) : '';

  const target = path ? `${base}/${path}${search}` : `${base}${search}`;

  const outHeaders = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    const kl = key.toLowerCase();
    if (['host', 'connection'].includes(kl)) continue;
    outHeaders.set(key, Array.isArray(value) ? value.join(', ') : value);
  }

  let body: Buffer | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await readBody(req);
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers: outHeaders,
      body: body && body.length > 0 ? body : undefined,
      cache: 'no-store',
    });
  } catch (e) {
    res.status(502).json({ error: 'Upstream fetch failed', detail: String(e) });
    return;
  }

  res.status(upstream.status);
  upstream.headers.forEach((value, key) => {
    const kl = key.toLowerCase();
    if (['transfer-encoding', 'connection', 'content-encoding'].includes(kl)) return;
    res.setHeader(key, value);
  });

  const buf = Buffer.from(await upstream.arrayBuffer());
  res.send(buf);
}
