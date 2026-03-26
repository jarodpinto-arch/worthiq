import Link from "next/link";
import { WorthIQLogo } from "../components/WorthIQLogo";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
      <div className="mb-10 flex flex-col items-center gap-6">
        <WorthIQLogo className="w-48 sm:w-56" priority />
        <p className="max-w-md text-sm font-medium tracking-wide text-slate-400">
          See the Risk. Own the Reward.
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link
          href="/login"
          className="rounded-2xl bg-worthiq-cyan py-4 font-bold text-black shadow-lg shadow-worthiq-cyan/20 transition hover:brightness-110"
        >
          Log In
        </Link>
        <Link
          href="/signup"
          className="rounded-2xl border border-slate-800 py-4 font-bold text-white transition hover:border-slate-600 hover:bg-white/5"
        >
          Create Account
        </Link>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black px-4 font-bold tracking-widest text-slate-600">
              Experience the AI
            </span>
          </div>
        </div>

        <Link
          href="/guest"
          className="text-base font-semibold text-worthiq-cyan transition hover:text-white"
        >
          Continue as Guest →
        </Link>
      </div>
    </div>
  );
}
