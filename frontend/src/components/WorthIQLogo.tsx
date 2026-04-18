/**
 * WorthIQ shared logo component backed by the brand SVG assets.
 * Uses the horizontal wordmark by default and the stacked logo for hero moments.
 */

export type WorthIQLogoProps = {
  /** Tailwind sizing classes, e.g. "h-12 w-auto" */
  className?: string;
  priority?: boolean;
  variant?: "default" | "hero";
};

export function WorthIQLogo({ className = "h-12 w-auto", variant = "default" }: WorthIQLogoProps) {
  const src =
    variant === "hero"
      ? "/brand/worthiq-logo-stacked.svg"
      : "/brand/worthiq-logo-horizontal.svg";
  const alt = variant === "hero" ? "WorthIQ stacked logo" : "WorthIQ logo";

  const mark = (
    <img
      src={src}
      alt={alt}
      className={`block ${className}`.trim()}
      draggable={false}
    />
  );

  if (variant === "hero") {
    return (
      <div className="relative mx-auto flex max-w-[min(92vw,22rem)] justify-center sm:max-w-[min(90vw,26rem)] md:max-w-[min(88vw,28rem)]">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[180%] w-[180%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,225,195,0.15)_0%,rgba(70,194,233,0.08)_40%,rgba(8,47,73,0)_70%)] blur-3xl"
          aria-hidden
        />
        <div className="relative drop-shadow-[0_0_48px_rgba(0,225,195,0.35)]">{mark}</div>
      </div>
    );
  }

  return mark;
}
