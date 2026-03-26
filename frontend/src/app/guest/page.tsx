"use client";
import Link from 'next/link';
import { WorthIQLogo } from '../../components/WorthIQLogo';

export default function GuestPage() {
  return (
    <main className="min-h-screen bg-worthiq-surface p-8 pt-16 text-slate-300">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <WorthIQLogo className="w-40" priority />
            <p className="mt-3 text-sm text-slate-500">Guest intelligence portal</p>
          </div>
          <Link
            href="/"
            className="text-sm font-semibold text-worthiq-cyan hover:text-white"
          >
            ← Home
          </Link>
        </div>

        <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-slate-800 bg-worthiq-panel p-10 text-center font-medium text-slate-500 shadow-xl">
          AI dashboard will appear here after your first query.
        </div>
      </div>
    </main>
  );
}
