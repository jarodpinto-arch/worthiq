import { NextResponse } from 'next/server';

/** Explicit route so `/api/backend/health` is not dependent on catch-all matching on all hosts. */
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

export async function GET() {
  const base = backendBase();
  if (!base) {
    return NextResponse.json(
      {
        error:
          'BACKEND_URL is not set on Vercel (Production). Add it under Environment Variables and redeploy.',
      },
      { status: 502 },
    );
  }

  try {
    const upstream = await fetch(`${base}/health`, { cache: 'no-store' });
    const body = await upstream.text();
    const ct = upstream.headers.get('content-type') || 'application/json';
    return new NextResponse(body, {
      status: upstream.status,
      headers: { 'content-type': ct },
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Upstream fetch failed', detail: String(e) },
      { status: 502 },
    );
  }
}
