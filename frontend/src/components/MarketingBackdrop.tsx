/**
 * Shared gradient + grid + vignette for landing / marketing-style pages.
 * Features a constantly pulsating core glow that's ambient but defined.
 */
export function MarketingBackdrop() {
  return (
    <>
      {/* Static deep glow base */}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(70,194,233,0.22)_0%,transparent_60%)]"
        aria-hidden
      />
      {/* Pulsating core orb — slow, ambient, non-distracting */}
      <div
        className="pointer-events-none fixed inset-0 backdrop-glow-pulse"
        aria-hidden
      />
      {/* Secondary green accent at bottom */}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_100%,rgba(82,183,136,0.09)_0%,transparent_55%)]"
        aria-hidden
      />
      {/* Subtle grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }}
        aria-hidden
      />
      {/* Vignette */}
      <div
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/80"
        aria-hidden
      />
    </>
  );
}
