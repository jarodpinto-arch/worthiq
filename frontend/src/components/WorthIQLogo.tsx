import Image from "next/image";

const LOGO_SRC = "/brand/worthiq-logo.png";

export type WorthIQLogoProps = {
  /** Tailwind width classes, e.g. `w-10 lg:w-32` */
  className?: string;
  priority?: boolean;
  /**
   * `hero` — large soft glow + drop shadow; no frame/box (full-bleed mark).
   * `default` — image only (sidebars, compact headers).
   */
  variant?: "default" | "hero";
};

export function WorthIQLogo({
  className = "w-36",
  priority,
  variant = "default",
}: WorthIQLogoProps) {
  const quality = variant === "hero" ? 100 : 90;
  const sizes =
    variant === "hero"
      ? "(max-width: 640px) 92vw, (max-width: 1024px) 56vw, 420px"
      : "(max-width: 1024px) 128px, 160px";

  const img = (
    <Image
      src={LOGO_SRC}
      alt="WorthIQ"
      width={1024}
      height={1024}
      quality={quality}
      sizes={sizes}
      priority={priority}
      className={`h-auto max-w-full select-none ${className}`.trim()}
      draggable={false}
    />
  );

  if (variant === "hero") {
    return (
      <div className="relative mx-auto flex max-w-[min(92vw,28rem)] justify-center sm:max-w-[min(88vw,36rem)]">
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
