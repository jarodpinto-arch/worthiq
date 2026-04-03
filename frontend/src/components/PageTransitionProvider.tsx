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

// ── Provider — lightning sweep + dark veil (CSS: globals.css) ────────────────

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sessionKey, setSessionKey] = useState<number | null>(null);
  const busyRef = React.useRef(false);

  const navigate = useCallback(
    (href: string) => {
      if (busyRef.current) {
        router.push(href);
        return;
      }

      busyRef.current = true;
      const key = Date.now();
      setSessionKey(key);

      // Navigate while the veil is opaque (matches worthiq-route-veil keyframes)
      window.setTimeout(() => {
        router.push(href);
      }, 420);

      window.setTimeout(() => {
        setSessionKey(null);
        busyRef.current = false;
      }, 920);
    },
    [router],
  );

  return (
    <Ctx.Provider value={{ navigate }}>
      {children}

      {sessionKey != null && (
        <div
          key={sessionKey}
          className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden motion-reduce:overflow-visible"
          aria-hidden
        >
          <div className="worthiq-route-veil-el" />
          <div className="worthiq-lightning-sweep-el" />
          <div className="worthiq-lightning-fork-el" />
        </div>
      )}
    </Ctx.Provider>
  );
}
