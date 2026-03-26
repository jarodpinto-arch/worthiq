"use client";

import React, { useEffect, useState } from "react";
import { WorthIQLogo } from "../WorthIQLogo";

type Phase = "burst" | "main";

type AuthBrandScreenProps = {
  children: React.ReactNode;
  tagline: string;
  subtitle?: string;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

export function AuthBrandScreen({ children, tagline, subtitle }: AuthBrandScreenProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>(reducedMotion ? "main" : "burst");

  useEffect(() => {
    if (reducedMotion) return;
    const toMain = window.setTimeout(() => setPhase("main"), 1180);
    return () => window.clearTimeout(toMain);
  }, [reducedMotion]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-slate-200">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_85%_65%_at_50%_38%,rgba(70,194,233,0.14)_0%,transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_100%,rgba(82,183,136,0.06)_0%,transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 pb-12 pt-[max(2rem,env(safe-area-inset-top))] sm:px-8">
        <div
          className={`flex flex-col items-center transition-[padding,margin] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            phase === "main" ? "mb-8 pt-4 sm:pt-8" : "flex flex-1 items-center justify-center py-8"
          }`}
        >
          <div className="relative flex flex-col items-center">
            <div
              className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 ${
                phase === "main" ? "opacity-[0.15]" : "opacity-100"
              }`}
              aria-hidden
            >
              <div
                className={`absolute left-1/2 top-1/2 h-[min(85vw,320px)] w-[min(85vw,320px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-worthiq-cyan/25 ${
                  phase === "burst" && !reducedMotion ? "auth-ring-pulse" : ""
                }`}
              />
              <div
                className={`absolute left-1/2 top-1/2 h-[min(72vw,268px)] w-[min(72vw,268px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-worthiq-cyan/15 ${
                  phase === "burst" && !reducedMotion ? "auth-ring-pulse-delayed" : ""
                }`}
              />
            </div>

            <div
              className={`origin-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                phase === "main" ? "scale-[0.72] sm:scale-[0.78]" : "scale-100"
              }`}
            >
              <div
                className={`relative z-[1] ${
                  reducedMotion
                    ? "auth-logo-post-burst"
                    : phase === "burst"
                      ? "auth-logo-burst"
                      : "auth-logo-post-burst"
                }`}
              >
                <div
                  className={`rounded-[2rem] transition-[box-shadow] duration-700 ${
                    phase === "main"
                      ? "shadow-[0_0_48px_-14px_rgba(70,194,233,0.32)]"
                      : "shadow-[0_0_100px_-6px_rgba(70,194,233,0.5)]"
                  }`}
                >
                  <WorthIQLogo className="w-56 sm:w-64" priority />
                </div>
              </div>
            </div>

            <div
              className={`mt-5 max-w-xs text-center transition-all duration-500 ease-out ${
                phase === "main"
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-3 opacity-0"
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-worthiq-cyan">
                {tagline}
              </p>
              {subtitle ? (
                <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div
          className={`w-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            phase === "main"
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-10 opacity-0"
          }`}
          style={{ transitionDelay: phase === "main" ? "90ms" : "0ms" }}
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-worthiq-panel/75 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-9">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-worthiq-cyan/50 to-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-worthiq-cyan/5 blur-3xl"
              aria-hidden
            />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
