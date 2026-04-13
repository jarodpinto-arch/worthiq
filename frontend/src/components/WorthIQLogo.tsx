/**
 * WorthIQ SVG wordmark — transparent background, no image dependency, crisp at any size.
 * Mark: rising stock chart that resolves into an electric lightning bolt.
 */

import { useId } from "react";

export type WorthIQLogoProps = {
  /** Tailwind sizing classes, e.g. "h-12 w-auto" */
  className?: string;
  priority?: boolean;
  variant?: "default" | "hero";
};

function BoltChartMark({
  glowId,
  strikeGradientId,
  sparkGradientId,
}: {
  glowId: string;
  strikeGradientId: string;
  sparkGradientId: string;
}) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <circle cx="31" cy="35" r="24" fill="url(#markAura)" opacity="0.8" />

      <g opacity="0.22">
        <path d="M8 53H39" stroke="#0F766E" strokeWidth="1.5" />
        <path d="M8 44H39" stroke="#0F766E" strokeWidth="1.5" />
        <path d="M8 35H39" stroke="#0F766E" strokeWidth="1.5" />
      </g>

      <g filter={`url(#${glowId})`}>
        <line x1="12" y1="32" x2="12" y2="47" stroke="#79F5E3" strokeWidth="2.2" />
        <rect x="8.8" y="36" width="6.4" height="8.6" rx="1.2" fill="#0F766E" />

        <line x1="22" y1="24" x2="22" y2="39" stroke="#79F5E3" strokeWidth="2.2" />
        <rect x="18.8" y="28" width="6.4" height="8.8" rx="1.2" fill="#14B8A6" />

        <line x1="32" y1="18" x2="32" y2="31" stroke="#A7FFF1" strokeWidth="2.2" />
        <rect x="28.8" y="21.5" width="6.4" height="8.2" rx="1.2" fill="#22D3EE" />

        <path
          d="M11 44.5 L18 36 L26 38.5 L33 27.5 L39 29.5 L44.5 19"
          stroke={`url(#${strikeGradientId})`}
          strokeWidth="4"
          fill="none"
        />

        <path
          d="M42 15 L35.5 28.5 L42.5 29 L36 43 L52 24.5 L44.5 23.5 L49.5 15 Z"
          fill={`url(#${strikeGradientId})`}
        />
      </g>

      <path
        d="M11 44.5 L18 36 L26 38.5 L33 27.5 L39 29.5 L44.5 19"
        stroke={`url(#${strikeGradientId})`}
        strokeWidth="3"
        fill="none"
      />

      <path
        d="M42 15 L35.5 28.5 L42.5 29 L36 43 L52 24.5 L44.5 23.5 L49.5 15 Z"
        fill={`url(#${strikeGradientId})`}
      />

      <g stroke={`url(#${sparkGradientId})`} strokeWidth="2">
        <path d="M49 8V12" />
        <path d="M53.5 10.5H57.5" />
        <path d="M45.5 11.5L43 9" />
        <path d="M53.5 15L56.2 17.5" />
        <path d="M18 17V20" opacity="0.8" />
      </g>

      <circle cx="49" cy="12" r="1.6" fill="#D9FFFB" />
      <circle cx="18" cy="16" r="1.2" fill="#79F5E3" opacity="0.9" />
    </g>
  );
}

export function WorthIQLogo({ className = "h-12 w-auto", variant = "default" }: WorthIQLogoProps) {
  const reactId = useId().replace(/:/g, "");
  const glowId = `worthiq-electric-glow-${reactId}`;
  const strikeGradientId = `worthiq-strike-gradient-${reactId}`;
  const sparkGradientId = `worthiq-spark-gradient-${reactId}`;
  const iqGradientId = `worthiq-iq-gradient-${reactId}`;

  const mark = (
    <svg
      viewBox="0 0 272 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`block ${className}`.trim()}
      aria-label="WorthIQ™"
      role="img"
    >
      <defs>
        <radialGradient id="markAura" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(31 34) rotate(90) scale(28 28)">
          <stop stopColor="#22D3EE" stopOpacity="0.26" />
          <stop offset="0.6" stopColor="#14B8A6" stopOpacity="0.14" />
          <stop offset="1" stopColor="#14B8A6" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={strikeGradientId} x1="12" y1="48" x2="53" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14B8A6" />
          <stop offset="0.5" stopColor="#42E8D2" />
          <stop offset="1" stopColor="#7DD3FC" />
        </linearGradient>

        <linearGradient id={sparkGradientId} x1="43" y1="18" x2="58" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5EEAD4" />
          <stop offset="1" stopColor="#D9FFFB" />
        </linearGradient>

        <linearGradient id={iqGradientId} x1="162" y1="19" x2="220" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#99F6E4" />
          <stop offset="0.45" stopColor="#42E8D2" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>

        <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="blur" />
        </filter>
      </defs>

      <BoltChartMark
        glowId={glowId}
        strikeGradientId={strikeGradientId}
        sparkGradientId={sparkGradientId}
      />

      <text
        x="67"
        y="49"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Avenir Next', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif"
        fontSize="42"
        letterSpacing="-2.2"
      >
        <tspan fill="#F8FAFC" fontWeight="700">
          Worth
        </tspan>
        <tspan fill={`url(#${iqGradientId})`} fontWeight="800">
          IQ
        </tspan>
        <tspan fill="#7DD3FC" fontSize="15" fontWeight="700" baselineShift="super">
          ™
        </tspan>
      </text>
    </svg>
  );

  if (variant === "hero") {
    return (
      <div className="relative mx-auto flex max-w-[min(92vw,32rem)] justify-center sm:max-w-[min(90vw,40rem)] md:max-w-[min(88vw,44rem)]">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[210%] w-[125%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.22)_0%,rgba(34,211,238,0.14)_34%,rgba(8,47,73,0)_72%)] blur-3xl"
          aria-hidden
        />
        <div className="relative drop-shadow-[0_0_38px_rgba(45,212,191,0.32)]">{mark}</div>
      </div>
    );
  }

  return mark;
}
