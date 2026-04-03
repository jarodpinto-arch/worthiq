/**
 * WorthIQ SVG wordmark — transparent background, no image dependency, crisp at any size.
 * Mark: hybrid candlestick chart + lightning (cyan).
 */

import { useId } from "react";

export type WorthIQLogoProps = {
  /** Tailwind sizing classes, e.g. "h-12 w-auto" */
  className?: string;
  priority?: boolean;
  variant?: "default" | "hero";
};

/** Candlesticks + zigzag “strike” read as both chart volatility and a bolt. */
function BoltChartMark({ filterId }: { filterId: string }) {
  const cyan = "#46C2E9";
  const cyanHi = "#7dd8f5";
  const cyanDeep = "#2fa3c7";

  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* Glow duplicate */}
      <g opacity={0.38} filter={`url(#${filterId})`}>
        {/* Upper spike candle (volatile wick) */}
        <line x1="27" y1="5" x2="27" y2="9" stroke={cyan} strokeWidth={2} />
        <rect x="24" y="9" width="6" height="7" rx={0.85} fill={cyan} />
        <line x1="27" y1="16" x2="27" y2="18" stroke={cyan} strokeWidth={2} />
        {/* Main candle */}
        <line x1="14" y1="14" x2="14" y2="19" stroke={cyan} strokeWidth={2.25} />
        <rect x="10.5" y="19" width="7" height="12" rx={1} fill={cyan} />
        <line x1="14" y1="31" x2="14" y2="36" stroke={cyan} strokeWidth={2.25} />
        {/* Lightning / chart breakdown (filled) */}
        <path
          d="M 17.5 36.5 L 26.5 38.5 L 20.5 44.5 L 29 46.5 L 22 52 L 31 54 L 14.5 60.5 L 21 51 L 9.5 59 L 18.5 45 L 14 40 L 18.5 34 Z"
          fill={cyan}
        />
        {/* Inline micro-candle on the bolt */}
        <line x1="23" y1="42" x2="23" y2="44" stroke={cyanHi} strokeWidth={1.4} />
        <rect x="21.1" y="44" width="3.8" height="4.5" rx={0.45} fill={cyanDeep} />
        <line x1="23" y1="48.5" x2="23" y2="50" stroke={cyanHi} strokeWidth={1.4} />
      </g>
      {/* Crisp foreground */}
      <g>
        <line x1="27" y1="5" x2="27" y2="9" stroke={cyanHi} strokeWidth={1.75} />
        <rect x="24" y="9" width="6" height="7" rx={0.85} fill={cyan} />
        <line x1="27" y1="16" x2="27" y2="18" stroke={cyanHi} strokeWidth={1.75} />

        <line x1="14" y1="14" x2="14" y2="19" stroke={cyanHi} strokeWidth={2} />
        <rect x="10.5" y="19" width="7" height="12" rx={1} fill={cyan} />
        <line x1="14" y1="31" x2="14" y2="36" stroke={cyanHi} strokeWidth={2} />

        <path
          d="M 17.5 36.5 L 26.5 38.5 L 20.5 44.5 L 29 46.5 L 22 52 L 31 54 L 14.5 60.5 L 21 51 L 9.5 59 L 18.5 45 L 14 40 L 18.5 34 Z"
          fill={cyan}
        />

        <line x1="23" y1="42" x2="23" y2="44" stroke={cyanHi} strokeWidth={1.25} />
        <rect x="21.1" y="44" width="3.8" height="4.5" rx={0.45} fill={cyanDeep} />
        <line x1="23" y1="48.5" x2="23" y2="50" stroke={cyanHi} strokeWidth={1.25} />
      </g>
    </g>
  );
}

export function WorthIQLogo({ className = "h-12 w-auto", variant = "default" }: WorthIQLogoProps) {
  const reactId = useId().replace(/:/g, "");
  const filterId = `worthiq-bolt-glow-${reactId}`;

  const mark = (
    <svg
      viewBox="0 0 248 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`block ${className}`.trim()}
      aria-label="WorthIQ™"
      role="img"
    >
      <defs>
        <filter id={filterId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur" />
        </filter>
      </defs>

      <BoltChartMark filterId={filterId} />

      <text
        x="43"
        y="47"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif"
        fontSize="42"
        letterSpacing="-2"
      >
        <tspan fill="white" fontWeight="700">
          Worth
        </tspan>
        <tspan fill="#46C2E9" fontWeight="800">
          IQ
        </tspan>
        <tspan fill="#64748b" fontSize="16" fontWeight="700" baselineShift="super">
          ™
        </tspan>
      </text>
    </svg>
  );

  if (variant === "hero") {
    return (
      <div className="relative mx-auto flex max-w-[min(92vw,30rem)] justify-center sm:max-w-[min(90vw,38rem)] md:max-w-[min(88vw,42rem)]">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[200%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#46C2E9]/12 blur-3xl"
          aria-hidden
        />
        <div className="relative drop-shadow-[0_0_40px_rgba(70,194,233,0.4)]">{mark}</div>
      </div>
    );
  }

  return mark;
}
