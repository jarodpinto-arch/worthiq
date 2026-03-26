import { NextResponse } from 'next/server';
import { backendProbeResponse } from '../../../lib/backend-probe';

/** Same as /api/health?deep=1 — neutral path name (some edges block "diagnostic"). */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const inner = await backendProbeResponse();
  const data = await inner.json();
  return NextResponse.json({ next: 'ok', via: 'probe', ...data });
}
