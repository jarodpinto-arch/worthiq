/**
 * Logo mark. Uses a native <img> so transparency isn’t flattened by the image optimizer
 * and edges stay clean on dark UI.
 *
 * For a true “no square” look on colored pages, use a source file with a transparent
 * background (PNG/SVG). The current `/public/brand/worthiq-logo.png` includes an opaque
 * black matte; a designer export without that matte is ideal.
 */
const LOGO_SRC = "/brand/worthiq-logo.png";

export type WorthIQLogoProps = {
  /** Tailwind width/height classes, e.g. `w-10 lg:w-32` or `h-12 w-auto` */
  className?: string;
  priority?: boolean;
  /**
   * `hero` — large soft glow + drop shadow; no UI frame/box.
   * `default` — image only (headers, sidebars).
   */
  variant?: "default" | "hero";
};

export function WorthIQLogo({
  className = "w-36",
  priority,
  variant = "default",
}: WorthIQLogoProps) {
  const img = (
    // Native img: preserves alpha, avoids Next/Image layout box quirks on transparent PNGs.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="WorthIQ"
      width={1024}
      height={1024}
      className={`block h-auto max-w-full bg-transparent object-contain object-center select-none ${className}`.trim()}
      draggable={false}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
    />
  );

  if (variant === "hero") {
    return (
      <div className="relative mx-auto flex max-w-[min(92vw,30rem)] justify-center sm:max-w-[min(90vw,38rem)] md:max-w-[min(88vw,42rem)]">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[min(120%,520px)] w-[min(120%,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-worthiq-cyan/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[min(90%,380px)] w-[min(90%,380px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-worthiq-cyan/10 blur-2xl"
          aria-hidden
        />
        <div className="relative drop-shadow-[0_0_50px_rgba(70,194,233,0.45)]">{img}</div>
      </div>
    );
  }

  return img;
}
