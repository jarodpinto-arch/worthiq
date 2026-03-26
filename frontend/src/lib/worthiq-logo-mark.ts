/**
 * Shared Tailwind classes for the WorthIQ mark site-wide.
 * Height-led + w-auto + object-contain keeps aspect ratio sharp at any breakpoint.
 */
export const markSidebar =
  "h-11 w-auto max-w-[3rem] shrink-0 object-contain lg:h-[3.75rem] lg:max-w-[min(100%,13.5rem)]";

export const markAppHeader =
  "h-[4.5rem] w-auto max-w-[min(100%,18rem)] object-contain sm:h-[5rem] sm:max-w-[20rem] md:h-[5.5rem] md:max-w-[22rem]";

/** Login / signup (AuthBrandScreen burst — large) */
export const markAuthBurst =
  "h-[7.5rem] w-auto max-w-[min(92vw,20rem)] object-contain sm:h-[9rem] sm:max-w-[22rem] md:h-[10rem] md:max-w-[24rem]";

/** Forgot password, reset, legacy LoginForm / RegisterForm headers */
export const markAuthStandalone =
  "h-[5.75rem] w-auto max-w-[17rem] object-contain sm:h-28 sm:max-w-[19rem]";

export const markConnect =
  "h-12 w-auto min-h-[3rem] shrink-0 object-contain sm:h-16 sm:min-h-[4rem] sm:max-w-[18rem]";

export const markGuest =
  "h-[5.5rem] w-auto max-w-[17rem] object-contain sm:h-28 sm:max-w-[19rem]";

export const ringOffsetApp = "focus-visible:ring-offset-[#0A0C10]";
export const ringOffsetBlack = "focus-visible:ring-offset-black";

/** Landing hero (used with variant="hero") */
export const markHomeHero =
  "w-full min-w-0 max-w-[min(92vw,24rem)] h-auto sm:max-w-[min(90vw,30rem)] md:max-w-[min(88vw,36rem)]";
