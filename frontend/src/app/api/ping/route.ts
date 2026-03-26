import { NextResponse } from 'next/server';

/** If this 404s on your domain, that hostname is not this Vercel project/build. */
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ pong: true, via: 'next-api-route' });
}
