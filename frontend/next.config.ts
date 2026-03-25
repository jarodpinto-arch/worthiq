import type { NextConfig } from "next";

/**
 * API proxy lives in `src/app/api/backend/[[...path]]/route.ts` so BACKEND_URL
 * is read at request time on Vercel. Rewrites in this file only see env at build
 * time and caused 404s when BACKEND_URL was missing during `next build`.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
