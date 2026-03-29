"use client";

import React, { createContext, useContext, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

// ── Context ─────────────────────────────────────────────────────────────────

type NavFn = (href: string) => void;
const Ctx = createContext<{ navigate: NavFn }>({ navigate: () => {} });

export function usePageTransition() {
  return useContext(Ctx);
}

// ── TransitionLink — drop-in replacement for <Link> ─────────────────────────

export function TransitionLink({
  href,
  children,
  className,
  style,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { navigate } = usePageTransition();
  return (
    <a
      href={href}
      className={className}
      style={style}
      onClick={(e) => {
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}

// ── Animation phases ─────────────────────────────────────────────────────────
//
//  idle  →  ring (spin starts, tiny circle appears)
//       →  cover (circle expands to fill screen, ring fades)
//       →  [navigate happens]
//       →  reveal (overlay fades out, new page visible)
//       →  idle

type Phase = "idle" | "ring" | "cover" | "reveal";

// ── Provider ─────────────────────────────────────────────────────────────────

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");

  const navigate = useCallback(
    (href: string) => {
      // Don't stack transitions
      if (phase !== "idle") {
        router.push(href);
        return;
      }

      setPhase("ring");

      // Expand circle to cover screen
      const t1 = setTimeout(() => setPhase("cover"), 170);

      // Navigate while covered — new page renders under overlay
      const t2 = setTimeout(() => router.push(href), 510);

      // Fade the overlay out
      const t3 = setTimeout(() => setPhase("reveal"), 540);

      // Reset
      const t4 = setTimeout(() => setPhase("idle"), 860);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    },
    [phase, router],
  );

  // Overlay clip-path — shrinks initially, then expands on "cover"
  const getOverlayStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "fixed",
      inset: 0,
      zIndex: 9998,
      background: "#0A0C10",
      pointerEvents: "none",
    };

    if (phase === "ring") {
      return { ...base, clipPath: "circle(2% at 50% 50%)", opacity: 1, transition: "none" };
    }
    if (phase === "cover") {
      return {
        ...base,
        clipPath: "circle(150% at 50% 50%)",
        opacity: 1,
        transition: "clip-path 0.38s cubic-bezier(0.76, 0, 0.24, 1)",
      };
    }
    if (phase === "reveal") {
      return {
        ...base,
        clipPath: "circle(150% at 50% 50%)",
        opacity: 0,
        transition: "opacity 0.32s ease",
      };
    }
    return base;
  };

  // Spinning ring — cyan arc that rotates
  const getRingStyle = (): React.CSSProperties => ({
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 72,
    height: 72,
    borderRadius: "50%",
    border: "2.5px solid transparent",
    borderTopColor: "#46C2E9",
    borderRightColor: "rgba(70, 194, 233, 0.22)",
    animation: "page-transition-spin 0.62s linear infinite",
    zIndex: 9999,
    opacity: phase === "ring" ? 1 : 0,
    transition: "opacity 0.15s ease",
    pointerEvents: "none",
  });

  return (
    <Ctx.Provider value={{ navigate }}>
      {children}

      {phase !== "idle" && (
        <>
          {/* Dark expanding circle */}
          <div aria-hidden style={getOverlayStyle()} />
          {/* Spinning cyan ring */}
          <div aria-hidden style={getRingStyle()} />
        </>
      )}
    </Ctx.Provider>
  );
}
