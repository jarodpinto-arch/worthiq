"use client";
import Link from 'next/link';
import { WorthIQLogoNav } from '../../components/WorthIQLogoNav';

export default function GuestPage() {
  return (
    <main className="min-h-screen bg-worthiq-surface p-8 pt-16 text-slate-200">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <WorthIQLogoNav className="w-44 sm:w-52" priority />
            <p className="mt-3 text-sm text-slate-400">Guest intelligence portal</p>
          </div>
          <Link
            href="/"
            className="rounded-xl border-2 border-white/70 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white hover:bg-white/10"
          >
            ← Home
          </Link>
        </div>

        <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-slate-600/50 bg-worthiq-panel p-10 text-center text-[15px] font-medium leading-relaxed text-slate-400 shadow-xl shadow-black/30">
          AI dashboard will appear here after your first query.
        </div>
      </div>
    </main>
  );
}
