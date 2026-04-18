/**
 * WorthIQ logo backed by the user-provided raster brand image.
 * Uses the exact uploaded PNG so the site matches the approved artwork.
 */

export type WorthIQLogoProps = {
  className?: string;
  priority?: boolean;
  variant?: "default" | "hero";
};

export function WorthIQLogo({ className = "h-12 w-auto" }: WorthIQLogoProps) {
  return (
    <img
      src="/brand/worthiq-logo.png"
      alt="WorthIQ logo"
      className={`block ${className}`.trim()}
      draggable={false}
    />
  );
}
