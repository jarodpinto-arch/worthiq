import { NextRequest, NextResponse } from 'next/server';

/** Node runtime: reliable server-side fetch to Railway; env read on every request (not at build). */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function backendBase(): string {
  const raw =
    process.env.BACKEND_URL ||
    process.env.RAILWAY_API_URL ||
    process.env.NEST_API_URL ||
    '';
  return String(raw).trim().replace(/\/$/, '');
}

type Ctx = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, ctx: Ctx): Promise<Response> {
  const base = backendBase();
  if (!base) {
    return NextResponse.json(
      {
        error:
          'BACKEND_URL is not set. Vercel → Settings → Environment Variables → Production → BACKEND_URL=https://api.worthiq.io then Redeploy.',
      },
      { status: 502 },
    );
  }

  const { path: segments } = await ctx.params;
  const pathname = segments.join('/');
  const url = new URL(request.url);
  const target = `${base}/${pathname}${url.search}`;

  const outHeaders = new Headers();
  request.headers.forEach((value, key) => {
    const kl = key.toLowerCase();
    // Hop-by-hop and proxy pitfalls; omit accept-encoding so origin returns plain bodies.
    if (
      ['host', 'connection', 'content-length', 'accept-encoding', 'te', 'trailer'].includes(
        kl,
      )
    )
      return;
    outHeaders.set(key, value);
  });

  let body: BodyInit | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const buf = await request.arrayBuffer();
    body = buf.byteLength > 0 ? buf : undefined;
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers: outHeaders,
      body,
      cache: 'no-store',
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Upstream fetch failed', detail: String(e) },
      { status: 502 },
    );
  }

  const resHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const kl = key.toLowerCase();
    if (['transfer-encoding', 'connection', 'content-encoding'].includes(kl))
      return;
    resHeaders.set(key, value);
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: resHeaders,
  });
}

export async function GET(request: NextRequest, ctx: Ctx) {
  return proxy(request, ctx);
}
export async function POST(request: NextRequest, ctx: Ctx) {
  return proxy(request, ctx);
}
export async function PUT(request: NextRequest, ctx: Ctx) {
  return proxy(request, ctx);
}
export async function PATCH(request: NextRequest, ctx: Ctx) {
  return proxy(request, ctx);
}
export async function DELETE(request: NextRequest, ctx: Ctx) {
  return proxy(request, ctx);
}
export async function OPTIONS(request: NextRequest, ctx: Ctx) {
  return proxy(request, ctx);
}
export async function HEAD(request: NextRequest, ctx: Ctx) {
  return proxy(request, ctx);
}
