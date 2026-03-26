"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { WorthIQLogo, type WorthIQLogoProps } from "./WorthIQLogo";

function resolveHref(): "/" | "/dashboard" {
  if (typeof window === "undefined") return "/";
  return localStorage.getItem("authToken") ? "/dashboard" : "/";
}

export type WorthIQLogoNavProps = WorthIQLogoProps & {
  /** Extra classes on the interactive wrapper (e.g. drop-shadow from auth animation). */
  wrapperClassName?: string;
};

/**
 * Logo as primary navigation: `/` when logged out, `/dashboard` when a session token exists.
 * Re-evaluates on route changes and `auth:logout`.
 */
export function WorthIQLogoNav({ wrapperClassName, className, ...logoProps }: WorthIQLogoNavProps) {
  const pathname = usePathname();
  const [href, setHref] = useState<"/" | "/dashboard">("/");

  useEffect(() => {
    setHref(resolveHref());
  }, [pathname]);

  useEffect(() => {
    const onLogout = () => setHref("/");
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  return (
    <Link
      href={href}
      className={`group inline-flex max-w-full shrink-0 rounded-md bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-[#46c2e9]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0c10] ${wrapperClassName ?? ""}`.trim()}
      aria-label={href === "/dashboard" ? "WorthIQ — go to dashboard" : "WorthIQ — home"}
    >
      <span className="inline-flex origin-center bg-transparent transition-[transform,filter] duration-300 ease-out will-change-transform group-hover:scale-[1.06] group-hover:brightness-110 group-active:scale-[0.96] motion-reduce:transform-none motion-reduce:transition-none">
        <WorthIQLogo {...logoProps} className={className} />
      </span>
    </Link>
  );
}
