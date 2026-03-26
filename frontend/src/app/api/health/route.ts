import { NextRequest, NextResponse } from 'next/server';
import { backendProbeResponse } from '../../../lib/backend-probe';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health — Next alive + whether BACKEND_URL is set.
 * GET /api/health?deep=1 — also fetch Nest /health from Vercel (same check as /api/probe).
 */
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('deep') === '1') {
    const probe = await backendProbeResponse();
    const data = await probe.json();
    return NextResponse.json({ next: 'ok', deep: true, ...data });
  }

  const base = String(
    process.env.BACKEND_URL ||
      process.env.RAILWAY_API_URL ||
      process.env.NEST_API_URL ||
      '',
  ).trim();

  return NextResponse.json({
    next: 'ok',
    backendUrlConfigured: Boolean(base),
    backendHealthUrl: '/api/backend/health',
    deepCheckUrl: '/api/health?deep=1',
    timestamp: new Date().toISOString(),
  });
}
