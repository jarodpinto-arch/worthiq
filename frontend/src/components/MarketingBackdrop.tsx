/**
 * Shared gradient + grid + vignette for landing / marketing-style pages.
 * Matches the auth experience so the app feels one product, not random screens.
 */
export function MarketingBackdrop() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_32%,rgba(70,194,233,0.16)_0%,transparent_58%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_100%,rgba(82,183,136,0.08)_0%,transparent_52%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/85"
        aria-hidden
      />
    </>
  );
}
