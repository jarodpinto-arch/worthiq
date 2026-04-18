import { MarketingBackdrop } from "../components/MarketingBackdrop";
import { TransitionLink } from "../components/PageTransitionProvider";
import { Footer } from "../components/Footer";
import { WorthIQLogo } from "../components/WorthIQLogo";

// ─── Data ─────────────────────────────────────────────────────────────────────

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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
    problem: "Scattered across 5 apps",
    solution: "Everything in one dashboard",
    desc: "Checking, savings, credit cards, brokerage, 401k — all disconnected. You never see the full picture.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    problem: "No idea where money goes",
    solution: "Sage AI tells you exactly",
    desc: "You know you spent too much — but where? Traditional apps give you categories. Sage gives you answers.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: "Real-Time Net Worth",
    description: "Connect every bank, brokerage, and credit card. Watch your net worth update live as transactions come in — no manual entry.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Sage AI Insights",
    description: "Your personal finance AI. Sage analyzes spending patterns, flags anomalies, and surfaces actionable insights in plain English.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Cashflow Dashboard",
    description: "Monthly income vs. expenses by category. Understand exactly where your money flows and where to optimize.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Investment Tracking",
    description: "Link your brokerage and see all holdings, trades, and portfolio activity alongside everyday spending — one place.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    title: "Customizable Views",
    description: "Build the dashboard you actually want. Reorder tabs, pin views, and set your default landing page.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Bank-Level Security",
    description: "256-bit TLS + AES-256 at rest. We use Plaid — your credentials never touch our servers. Read-only access only.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Create your account",
    desc: "Sign up in under 60 seconds with email or Google. No credit card required.",
  },
  {
    num: "02",
    title: "Connect your accounts",
    desc: "Securely link banks, credit cards, and brokerages via Plaid. Completely read-only.",
  },
  {
    num: "03",
    title: "Master your capital",
    desc: "Watch Sage AI surface insights, track net worth live, and finally take control.",
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="relative overflow-hidden bg-black text-slate-200">
      <MarketingBackdrop />

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-10">
        <WorthIQLogo className="h-9 w-auto sm:h-10" />
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
      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-16 text-center sm:px-10 sm:pt-24">
        <WorthIQLogo
          variant="hero"
          className="h-auto w-[min(78vw,18rem)] sm:w-[min(56vw,20rem)]"
        />

        <div className="backdrop-glow-pulse mb-6 inline-flex items-center gap-2 rounded-full border border-[#46c2e9]/25 bg-[#46c2e9]/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#46c2e9]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#46c2e9]" />
          Now in beta — free for early users
        </div>

        <h1 className="animate-logo-settle mt-4 text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
          Most people have<br />
          no idea what<br />
          <span className="text-[#46c2e9]">they're worth.</span>
        </h1>

        <p className="animate-fade-up-delay-1 mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
          WorthIQ connects all your accounts, applies AI, and gives you a single command center for your financial life. Real-time net worth, Sage AI insights, cashflow breakdowns — finally all in one place.
        </p>

        <div className="animate-fade-up-delay-2 mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <TransitionLink
            href="/signup"
            className="btn-on-dark-primary btn-on-dark-primary--offset-black w-full sm:w-auto sm:px-12"
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
          No credit card · Read-only bank access · Cancel anytime
        </p>

        {/* Dashboard preview */}
        <div className="animate-fade-up-delay-3 relative mt-16 w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11141b] shadow-[0_32px_80px_rgba(0,0,0,0.7)]">
          {/* Browser chrome */}
          <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-[#0a0c10]/80 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 flex items-center gap-1.5 rounded-md bg-white/[0.05] px-3 py-1 text-xs font-medium text-slate-500">
              <svg className="h-3 w-3 text-[#46c2e9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              app.worthiq.io/dashboard
            </span>
          </div>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-px bg-white/[0.04] sm:grid-cols-4">
            {[
              { label: "Net Worth", value: "$284,920", color: "text-[#46c2e9]", delta: "+$4,210 this month" },
              { label: "Cash & Savings", value: "$48,310", color: "text-[#52b788]", delta: "3 accounts" },
              { label: "Investments", value: "$241,200", color: "text-[#a78bfa]", delta: "Brokerage + 401k" },
              { label: "Credit", value: "$4,590", color: "text-[#e63946]", delta: "2 cards" },
            ].map((tile) => (
              <div key={tile.label} className="bg-[#11141b] px-4 py-4 sm:px-5 sm:py-5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{tile.label}</p>
                <p className={`mt-2 text-lg font-black sm:text-xl ${tile.color}`}>{tile.value}</p>
                <p className="mt-1 text-[10px] text-slate-600">{tile.delta}</p>
              </div>
            ))}
          </div>
          {/* Chart area */}
          <div className="relative h-28 overflow-hidden bg-[#0e1118] sm:h-36">
            <svg className="h-full w-full opacity-70" viewBox="0 0 800 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#46c2e9" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#46c2e9" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,75 C60,72 120,65 180,58 C240,51 300,54 360,44 C420,34 480,26 540,22 C600,18 660,28 720,18 L800,10 L800,100 L0,100 Z" fill="url(#sparkGrad)" />
              <path d="M0,75 C60,72 120,65 180,58 C240,51 300,54 360,44 C420,34 480,26 540,22 C600,18 660,28 720,18 L800,10" fill="none" stroke="#46c2e9" strokeWidth="2.5" />
              {/* Data points */}
              {[[180,58],[360,44],[540,22],[720,18],[800,10]].map(([x,y], i) => (
                <circle key={i} cx={x} cy={y} r="3.5" fill="#46c2e9" opacity="0.8" />
              ))}
            </svg>
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#11141b] to-transparent" />
            {/* Sage insight badge */}
            <div className="absolute right-4 top-4 hidden items-center gap-2 rounded-xl border border-[#46c2e9]/20 bg-[#11141b]/90 px-3 py-2 backdrop-blur-sm sm:flex">
              <div className="h-2 w-2 rounded-full bg-[#46c2e9]" />
              <span className="text-xs font-semibold text-slate-300">Sage: Net worth up 12% YTD</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-white/[0.05] bg-[#0a0c10]/70 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
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

      {/* ── Problem → Solution ──────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 sm:px-10">
        <div className="mb-14 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#46c2e9]">Why WorthIQ exists</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Personal finance is broken.<br />We're fixing it.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400">
            Banks design apps to show your balance — not your financial health. WorthIQ is built from the ground up to give you intelligence, not just data.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {PAIN_POINTS.map((p) => (
            <div key={p.problem} className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#11141b]">
              {/* Problem header */}
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
              {/* Solution body */}
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
      </section>

      {/* ── Features grid ───────────────────────────────────────────────────── */}
      <section className="relative z-10 border-t border-white/[0.05] bg-[#0a0c10]/50">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-10">
          <div className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#46c2e9]">Everything in one place</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Your finances. Finally intelligent.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-white/[0.06] bg-[#11141b] p-6 transition hover:border-[#46c2e9]/20 hover:bg-[#141820]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#46c2e9]/20 bg-[#46c2e9]/[0.08] text-[#46c2e9] transition group-hover:bg-[#46c2e9]/[0.14]">
                  {f.icon}
                </div>
                <h3 className="font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-white/[0.05] bg-[#0d1017]">
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

      {/* ── Security trust ──────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-24 sm:px-10">
        <div className="overflow-hidden rounded-2xl border border-[#46c2e9]/15 bg-gradient-to-br from-[#11141b] to-[#0d1017]">
          <div className="grid gap-8 p-8 sm:grid-cols-2 sm:p-12">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#46c2e9]/20 bg-[#46c2e9]/[0.07] px-3 py-1 text-xs font-semibold text-[#46c2e9]">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Security first
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Your data is yours.<br />We just make it useful.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                WorthIQ uses Plaid for all bank connections — your credentials never touch our servers. Everything is encrypted in transit and at rest.
              </p>
              <TransitionLink
                href="/security"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#46c2e9] transition hover:opacity-80"
              >
                Learn about our security →
              </TransitionLink>
            </div>

            <div className="grid grid-cols-2 gap-3 self-center">
              {[
                { title: "256-bit TLS", sub: "Encrypted in transit" },
                { title: "AES-256", sub: "Encrypted at rest" },
                { title: "Plaid-powered", sub: "Read-only bank access" },
                { title: "No stored creds", sub: "Your passwords stay yours" },
              ].map((b) => (
                <div key={b.title} className="rounded-xl border border-white/[0.06] bg-[#0a0c10]/60 p-4">
                  <p className="text-sm font-black text-white">{b.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-28 text-center sm:px-10">
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Ready to know your number?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-400">
          Join thousands getting smarter about their money. Free while in beta.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <TransitionLink
            href="/signup"
            className="btn-on-dark-primary btn-on-dark-primary--offset-black w-full sm:w-auto sm:px-12"
          >
            Get Started Free
          </TransitionLink>
          <TransitionLink
            href="/login"
            className="w-full py-2 text-center text-sm font-semibold text-slate-400 underline decoration-slate-600 underline-offset-4 transition hover:text-white sm:w-auto"
          >
            Already have an account? Sign in
          </TransitionLink>
        </div>
      </section>

      <Footer variant="marketing" />
    </div>
  );
}
