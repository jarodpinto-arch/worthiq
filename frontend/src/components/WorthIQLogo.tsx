/**
 * WorthIQ SVG wordmark — transparent background, no image dependency, crisp at any size.
 * Replaces the old PNG which had an opaque black matte.
 */

export type WorthIQLogoProps = {
  /** Tailwind sizing classes, e.g. "h-12 w-auto" */
  className?: string;
  priority?: boolean;
  variant?: "default" | "hero";
};

export function WorthIQLogo({ className = "h-12 w-auto", variant = "default" }: WorthIQLogoProps) {
  const mark = (
    <svg
      viewBox="0 0 248 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`block ${className}`.trim()}
      aria-label="WorthIQ"
      role="img"
    >
      <defs>
        <filter id="bolt-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="blur" />
        </filter>
      </defs>

      {/* Glow layer behind bolt */}
      <path
        d="M25 4 L13 32 L20 32 L10 60 L30 34 L23 34 L33 4 Z"
        fill="#46C2E9"
        opacity="0.35"
        filter="url(#bolt-glow)"
      />
      {/* Bolt fill */}
      <path
        d="M25 4 L13 32 L20 32 L10 60 L30 34 L23 34 L33 4 Z"
        fill="#46C2E9"
      />

      {/* "Worth" — white, bold */}
      <text
        x="43"
        y="47"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif"
        fontSize="42"
        fontWeight="700"
        fill="white"
        letterSpacing="-1.5"
      >
        Worth
      </text>

      {/* "IQ" — cyan, extra bold */}
      <text
        x="168"
        y="47"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif"
        fontSize="42"
        fontWeight="800"
        fill="#46C2E9"
        letterSpacing="-1"
      >
        IQ
      </text>
    </svg>
  );

  if (variant === "hero") {
    return (
      <div className="relative mx-auto flex max-w-[min(92vw,30rem)] justify-center sm:max-w-[min(90vw,38rem)] md:max-w-[min(88vw,42rem)]">
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[200%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#46C2E9]/12 blur-3xl"
          aria-hidden
        />
        <div className="relative drop-shadow-[0_0_40px_rgba(70,194,233,0.4)]">
          {mark}
        </div>
      </div>
    );
  }

  return mark;
}
