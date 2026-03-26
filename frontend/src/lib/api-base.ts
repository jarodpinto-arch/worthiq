/**
 * Base URL for the Nest API from the browser.
 *
 * Local (.env.local): NEXT_PUBLIC_API_URL=http://localhost:3001
 *
 * Production (Vercel): NEXT_PUBLIC_API_URL=/api/backend + BACKEND_URL for the proxy.
 *
 * If NEXT_PUBLIC_API_URL was missing at build time, the old default was localhost — which
 * breaks production ("could not connect"). On any non-local hostname we fall back to
 * same-origin `/api/backend`.
 */
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (raw != null && String(raw).trim() !== '') {
    return String(raw).replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    return '/api/backend';
  }
  return 'http://localhost:3001';
}
