import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Always served by Next (no Railway). Use this to confirm API routes deploy.
 * Backend liveness: GET /api/backend/health (needs BACKEND_URL on Vercel for the proxy route).
 */
export async function GET() {
  const base =
    process.env.BACKEND_URL ||
    process.env.RAILWAY_API_URL ||
    process.env.NEST_API_URL ||
    '';

  return NextResponse.json({
    next: 'ok',
    backendUrlConfigured: Boolean(String(base).trim()),
    backendHealthUrl: '/api/backend/health',
    timestamp: new Date().toISOString(),
  });
}
