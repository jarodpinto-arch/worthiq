import Link from "next/link";
import { MarketingBackdrop } from "../components/MarketingBackdrop";
import { WorthIQLogoNav } from "../components/WorthIQLogoNav";

export default function Home() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-black text-slate-200">
      <MarketingBackdrop />

      <main className="relative z-10 mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-6 pb-16 pt-[max(2.5rem,env(safe-area-inset-top))] sm:px-8">
        <div className="animate-logo-settle flex flex-col items-center">
          <WorthIQLogoNav
            className="w-full sm:w-[min(22rem,90vw)] md:w-[min(28rem,85vw)]"
            variant="hero"
            priority
            wrapperClassName="max-w-full focus-visible:ring-offset-black"
          />
          <p className="animate-fade-up-delay-1 mt-8 max-w-sm text-center text-[11px] font-bold uppercase tracking-[0.28em] text-worthiq-cyan">
            See the Risk. Own the Reward.
          </p>
          <p className="animate-fade-up-delay-1 mt-3 max-w-md text-center text-sm leading-relaxed text-slate-400">
            Personal finance intelligence — bank-linked insights, Sage AI, and a
            dashboard built for decisions.
          </p>
        </div>

        <div className="animate-fade-up-delay-2 mt-12 flex w-full flex-col gap-3">
          <Link
            href="/login"
            className="btn-on-dark-primary btn-on-dark-primary--offset-black"
          >
            Log In
          </Link>

          <Link
            href="/signup"
            className="btn-on-dark-secondary"
          >
            Create Account
          </Link>

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-600/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black/80 px-4 font-bold tracking-widest text-slate-400 backdrop-blur-sm">
                Experience the AI
              </span>
            </div>
          </div>

          <Link
            href="/guest"
            className="animate-fade-up-delay-3 py-2 text-center text-[15px] font-semibold text-white underline decoration-white/35 underline-offset-4 transition hover:text-slate-200 hover:decoration-white/55"
          >
            Continue as Guest →
          </Link>
        </div>
      </main>
    </div>
  );
}
