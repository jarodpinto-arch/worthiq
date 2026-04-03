import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

/**
 * /api/backend/* is proxied by `src/app/api/backend/[...path]/route.ts` (runtime env).
 * Do not use next.config rewrites for that path — BACKEND_URL can be missing when the
 * config module first loads on Vercel, which produces empty rewrites and a 404.
 */
function tracingRoot(): string {
  const parent = path.resolve(process.cwd(), "..");
  try {
    return fs.realpathSync(parent);
  } catch {
    return process.cwd();
  }
}

const nextConfig: NextConfig = {
  transpilePackages: ["@worthiq/core"],
  ...(!process.env.VERCEL ? { outputFileTracingRoot: tracingRoot() } : {}),
};

export default nextConfig;
