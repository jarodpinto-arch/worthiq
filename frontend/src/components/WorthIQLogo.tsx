/**
 * WorthIQ shared logo component backed by static brand SVG assets.
 * Uses the stacked logo for hero moments and a horizontal wordmark elsewhere.
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

  const alt = variant === "hero" ? "WorthIQ logo" : "WorthIQ wordmark";

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
      <div className="relative mx-auto flex max-w-[min(92vw,32rem)] justify-center sm:max-w-[min(90vw,40rem)] md:max-w-[min(88vw,44rem)]">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[210%] w-[125%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.18)_0%,rgba(34,211,238,0.12)_34%,rgba(8,47,73,0)_72%)] blur-3xl"
          aria-hidden
        />
        <div className="relative drop-shadow-[0_0_38px_rgba(45,212,191,0.28)]">{mark}</div>
      </div>
    );
  }

  return mark;
}
