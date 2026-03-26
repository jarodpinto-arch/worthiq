"use client";

import { usePathname } from "next/navigation";

/**
 * Re-mounts on navigation; drives a short enter animation (see globals.css).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="min-h-[100dvh] page-enter">
      {children}
    </div>
  );
}
