export type WorthIQLogoProps = {
  className?: string;
  priority?: boolean;
  variant?: "mark" | "full";
  decorative?: boolean;
};

/**
 * Shared SVG-backed WorthIQ logo so the mark stays crisp in the navbar, hero, auth,
 * and favicon-driven surfaces.
 */
export function WorthIQLogo({
  className = "h-12 w-auto",
  variant = "full",
  decorative = false,
}: WorthIQLogoProps) {
  const src = variant === "mark" ? "/logos/worthiq-mark.svg" : "/logos/worthiq-logo-provided.png";

  return (
    <img
      src={src}
      alt={decorative ? "" : variant === "mark" ? "WorthIQ mark" : "WorthIQ logo"}
      aria-label={decorative ? undefined : variant === "mark" ? "WorthIQ mark" : "WorthIQ logo"}
      aria-hidden={decorative}
      className={`block ${className}`.trim()}
      draggable={false}
    />
  );
}
