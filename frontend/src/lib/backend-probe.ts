import { NextResponse } from 'next/server';

/** Server-side fetch to Nest /health (Vercel → Railway). */
export async function backendProbeResponse(): Promise<NextResponse> {
  const base = String(
    process.env.BACKEND_URL ||
      process.env.RAILWAY_API_URL ||
      process.env.NEST_API_URL ||
      '',
  )
    .trim()
    .replace(/\/$/, '');

  if (!base) {
    return NextResponse.json(
      {
        ok: false,
        step: 'env',
        detail: 'BACKEND_URL (or RAILWAY_API_URL / NEST_API_URL) is empty',
      },
      { status: 200 },
    );
  }

  try {
    const r = await fetch(`${base}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    const text = await r.text();
    return NextResponse.json({
      ok: r.ok,
      step: 'fetch',
      backendStatus: r.status,
      snippet: text.slice(0, 200),
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      step: 'fetch',
      detail: String(e),
    });
  }
}
