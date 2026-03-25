/**
 * Base URL for the Nest API from the browser.
 *
 * Local (.env.local): NEXT_PUBLIC_API_URL=http://localhost:3001
 *
 * Production (Vercel): avoid CORS by proxying through Next:
 *   BACKEND_URL=https://your-service.up.railway.app   (server-only, for rewrites)
 *   NEXT_PUBLIC_API_URL=/api/backend
 */
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (raw != null && String(raw).trim() !== '') {
    return String(raw).replace(/\/$/, '');
  }
  return 'http://localhost:3001';
}
