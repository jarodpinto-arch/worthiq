"use client";

import Link from "next/link";
import { TransitionLink } from "./PageTransitionProvider";

const PRODUCT_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Connect Bank", href: "/connect" },
  { label: "Sage AI", href: "/dashboard" },
  { label: "Transactions", href: "/transactions" },
];

const COMPANY_LINKS = [
  { label: "Security", href: "/security" },
  { label: "Blog", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Contact", href: "mailto:hello@worthiq.io" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Security", href: "/security" },
];

export function Footer({ variant = "marketing" }: { variant?: "marketing" | "app" }) {
  if (variant === "app") {
    return (
      <footer className="border-t border-slate-800 bg-[#0a0c10] px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} WorthIQ. All rights reserved.</span>
          <div className="flex gap-4">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.label} href={l.href} className="transition hover:text-slate-300">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-white/[0.07] bg-black/60 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <span className="text-xl font-black tracking-tight text-white">
              Worth<span className="text-[#46c2e9]">IQ</span>
              <sup className="ml-0.5 text-[10px] font-bold text-slate-500">™</sup>
            </span>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Personal finance intelligence. Bank-linked insights, Sage AI, and dashboards built around your life.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href="https://twitter.com/worthiq"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-[#46c2e9]/40 hover:text-[#46c2e9]"
                aria-label="Twitter / X"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com/company/worthiq"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-[#46c2e9]/40 hover:text-[#46c2e9]"
                aria-label="LinkedIn"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Product</h3>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.label}>
                  <TransitionLink
                    href={l.href}
                    className="text-sm text-slate-400 transition hover:text-white"
                  >
                    {l.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Company</h3>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("mailto:") ? (
                    <a href={l.href} className="text-sm text-slate-400 transition hover:text-white">
                      {l.label}
                    </a>
                  ) : (
                    <TransitionLink href={l.href} className="text-sm text-slate-400 transition hover:text-white">
                      {l.label}
                    </TransitionLink>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Legal</h3>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map((l) => (
                <li key={l.label}>
                  <TransitionLink href={l.href} className="text-sm text-slate-400 transition hover:text-white">
                    {l.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/[0.07] pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} WorthIQ, Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <svg className="h-3 w-3 text-[#46c2e9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Bank-level 256-bit encryption
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3 w-3 text-[#46c2e9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Powered by Plaid
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
