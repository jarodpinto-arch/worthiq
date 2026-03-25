import type { NextConfig } from "next";

/**
 * Monorepo: parent `package-lock.json` can make Next infer the wrong app root on Vercel.
 * Pin Turbopack to this directory so routes (including `pages/api`) resolve correctly.
 */
const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
