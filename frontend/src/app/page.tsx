import { MarketingBackdrop } from "../components/MarketingBackdrop";
import { WorthIQLogoNav } from "../components/WorthIQLogoNav";
import { TransitionLink } from "../components/PageTransitionProvider";
import { Footer } from "../components/Footer";

// ─── Feature data ──────────────────────────────────────────────────────────────

const STATS = [
  { value: "66%", label: "of Americans live paycheck to paycheck" },
  { value: "85%", label: "can't name their exact net worth" },
  { value: "5+", label: "financial accounts the average person ignores" },
  { value: "$500B", label: "lost annually to hidden fees & missed returns" },
];

const PAIN_POINTS = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
        />
      </svg>
    ),
    problem: "Scattered across 5 apps",
    solution: "Everything in one dashboard",
    desc: "Checking, savings, credit cards, brokerage, 401k — all disconnected. You never see the full picture.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    problem: "No idea where money goes",
    solution: "Sage AI tells you exactly",
    desc: "You know you spent too much — but where? Traditional apps give you categories. Sage gives you answers.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    problem: "Blindsided by fees & drift",
    solution: "Proactive alerts & insights",
    desc: "Subscription creep, underperforming accounts, rising credit utilization. WorthIQ surfaces it before it hurts.",
  },
];

const FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    title: "Real-Time Net Worth",
    description:
      "Connect every bank, brokerage, and credit card. Watch your net worth update live as transactions come in — no manual entry, ever.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Sage AI Insights",
    description:
      "Your personal finance AI. Sage analyzes your spending patterns, flags anomalies, and surfaces actionable insights — all in plain English.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Cashflow Dashboard",
    description:
      "Monthly income vs. expenses, by category. Understand exactly where your money flows and where to trim — without the spreadsheet.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    title: "Customizable Views",
    description:
      "Build the dashboard you actually want. Reorder tabs, pin favorite views, and set your default landing page to match how you think.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: "Investment Tracking",
    description:
      "Link your brokerage accounts and see all trades, holdings, and portfolio activity alongside your everyday spending in one place.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Bank-Level Security",
    description:
      "256-bit TLS encryption in transit, AES-256 at rest. We use Plaid — your credentials never touch our servers.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Create your account",
    desc: "Sign up in under 60 seconds. No credit card required.",
  },
  {
    num: "02",
    title: "Connect your accounts",
    desc: "Securely link banks, credit cards, and brokerages via Plaid. Read-only access.",
  },
  {
    num: "03",
    title: "Master your capital",
    desc: "Watch Sage AI surface insights, track net worth live, and take control.",
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="relative overflow-hidden bg-black text-slate-200">
      <MarketingBackdrop />

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-10">
        <WorthIQLogoNav className="h-9 w-auto sm:h-10" />
        <div className="flex items-center gap-3">
          <TransitionLink
            href="/login"
            className="text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            Log In
          </TransitionLink>
          <TransitionLink
            href="/signup"
            className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black shadow-lg transition hover:bg-slate-100 hover:shadow-[0_0_20px_rgba(70,194,233,0.4)]"
          >
            Get Started Free
          </TransitionLink>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pb-24 pt-16 text-center sm:px-10 sm:pt-24">
        <div className="backdrop-glow-pulse mb-6 inline-flex items-center gap-2 rounded-full border border-[#46c2e9]/25 bg-[#46c2e9]/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#46c2e9]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#46c2e9]" />
          Now in beta — free for early users
        </div>

        <h1 className="animate-logo-settle mt-4 text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
          Master Your Capital<br />
          <span className="text-[#46c2e9]">with AI</span>
        </h1>

        <p className="animate-fade-up-delay-1 mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
          Your own personal finance intelligence — real-time bank-linked insights, Sage AI, and customizable dashboards built for your wants and needs.
        </p>

        <div className="animate-fade-up-delay-2 mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <TransitionLink
            href="/signup"
            className="btn-on-dark-primary btn-on-dark-primary--offset-black w-full sm:w-auto sm:px-10"
          >
            Get Started Free
          </TransitionLink>
          <TransitionLink
            href="/guest"
            className="btn-on-dark-secondary w-full sm:w-auto sm:px-8"
          >
            Try the Demo →
          </TransitionLink>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          No credit card required · Read-only bank access · Cancel anytime
        </p>

        {/* Mock dashboard preview */}
        <div className="animate-fade-up-delay-3 relative mt-16 w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11141b] shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-[#0a0c10]/80 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 text-xs font-medium text-slate-500">app.worthiq.io/dashboard</span>
          </div>
          <div className="grid grid-cols-2 gap-px bg-white/[0.04] sm:grid-cols-4">
            {[
              { label: "Net Worth", value: "$284,920", color: "text-[#46c2e9]" },
              { label: "Cash & Savings", value: "$48,310", color: "text-[#52b788]" },
              { label: "Investments", value: "$241,200", color: "text-[#a78bfa]" },
              { label: "Credit", value: "$4,590", color: "text-[#e63946]" },
            ].map((tile) => (
              <div key={tile.label} className="bg-[#11141b] px-5 py-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{tile.label}</p>
                <p className={`mt-2 text-xl font-black ${tile.color}`}>{tile.value}</p>
              </div>
            ))}
          </div>
          <div className="relative h-32 overflow-hidden bg-[#0e1118] px-4 pt-4">
            <svg className="h-full w-full opacity-60" viewBox="0 0 400 80" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#46c2e9" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#46c2e9" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,60 C30,58 60,52 90,48 C120,44 150,46 180,38 C210,30 240,22 270,20 C300,18 330,24 360,16 L400,10 L400,80 L0,80 Z"
                fill="url(#sparkGrad)"
              />
              <path
                d="M0,60 C30,58 60,52 90,48 C120,44 150,46 180,38 C210,30 240,22 270,20 C300,18 330,24 360,16 L400,10"
                fill="none"
                stroke="#46c2e9"
                strokeWidth="2"
              />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#11141b] to-transparent" />
          </div>
        </div>
      </main>

      {/* ── Stats Bar ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-white/[0.05] bg-[#0a0c10]/70 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
          <p className="mb-8 text-center text-xs font-bold uppercase tracking-widest text-slate-600">
            The personal finance reality check
          </p>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.value} className="text-center">
                <p className="text-3xl font-black text-[#46c2e9] sm:text-4xl">{s.value}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem / Solution ─────────────────────────────────────────────── */}
      <section className="relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12),transparent_58%)]" aria-hidden />
        <div className="absolute inset-0 opacity-[0.06]" aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(rgba(70,194,233,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(70,194,233,0.22) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:px-10">
          <div className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#46c2e9]">Why WorthIQ exists</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Personal finance is broken.<br />We&apos;re fixing it.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
              Banks design apps to show your balance, not your financial health. WorthIQ is built from the ground up to give you intelligence, not just data.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {PAIN_POINTS.map((p) => (
              <div
                key={p.problem}
                className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#11141b]"
              >
                <div className="border-b border-white/[0.05] bg-[#0e1118] px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                      {p.icon}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-red-400/70">The problem</p>
                      <p className="text-sm font-bold text-slate-300">{p.problem}</p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-5">
                  <div className="mb-3 flex items-center gap-2">
                    <svg className="h-4 w-4 flex-shrink-0 text-[#46c2e9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm font-bold text-[#46c2e9]">{p.solution}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-400">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 sm:px-10">
        <div className="mb-14 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#46c2e9]">Everything in one place</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Your finances. Finally intelligent.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400">
            WorthIQ connects all your financial accounts and gives you an AI-powered command center to understand, plan, and grow your wealth.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-white/[0.06] bg-[#11141b] p-6 transition hover:border-[#46c2e9]/20 hover:bg-[#141820]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#46c2e9]/20 bg-[#46c2e9]/[0.08] text-[#46c2e9] transition group-hover:bg-[#46c2e9]/[0.12]">
                {f.icon}
              </div>
              <h3 className="font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-white/[0.05] bg-[#0a0c10]/60 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 py-24 sm:px-10">
          <div className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#46c2e9]">Get set up in minutes</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">How it works</h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.num} className="relative flex flex-col items-center text-center sm:items-start sm:text-left">
                {i < STEPS.length - 1 && (
                  <div className="absolute left-full top-6 hidden h-px w-full -translate-x-1/2 bg-gradient-to-r from-[#46c2e9]/30 to-transparent sm:block" />
                )}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#46c2e9]/30 bg-[#46c2e9]/[0.07] text-sm font-black text-[#46c2e9]">
                  {s.num}
                </div>
                <h3 className="mt-4 font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security / Trust ─────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-24 sm:px-10">
        <div className="overflow-hidden rounded-2xl border border-[#46c2e9]/15 bg-gradient-to-br from-[#11141b] to-[#0d1017]">
          <div className="grid gap-8 p-8 sm:grid-cols-2 sm:p-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#46c2e9]">Security first</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Your data is yours.<br />We just make it useful.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                We take financial data seriously. WorthIQ uses Plaid for all bank connections — meaning your credentials never touch our servers. Everything is encrypted in transit and at rest.
              </p>
              <TransitionLink
                href="/security"
                className="mt-6 inline-flex items-center text-sm font-semibold text-[#46c2e9] transition hover:text-[#7dd8f5]"
              >
                Learn more about security →
              </TransitionLink>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: "256-bit TLS", sub: "Encryption in transit" },
                { title: "AES-256", sub: "Encrypted at rest" },
                { title: "Plaid-powered", sub: "Read-only bank access" },
                { title: "No stored creds", sub: "Your passwords stay yours" },
              ].map((b) => (
                <div
                  key={b.title}
                  className="rounded-xl border border-white/[0.06] bg-[#0a0c10]/60 p-4"
                >
                  <p className="text-sm font-black text-white">{b.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 pb-24 text-center sm:px-10">
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Ready to know your number?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-400">
          Join the waitlist and get early access. Free while in beta.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <TransitionLink
            href="/signup"
            className="btn-on-dark-primary btn-on-dark-primary--offset-black w-full sm:w-auto sm:px-12"
          >
            Get Started Free
          </TransitionLink>
          <TransitionLink
            href="/guest"
            className="w-full py-2 text-center text-sm font-semibold text-slate-400 underline decoration-slate-600 underline-offset-4 transition hover:text-white sm:w-auto"
          >
            Try it without signing up
          </TransitionLink>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <Footer variant="marketing" />
    </div>
  );
}
