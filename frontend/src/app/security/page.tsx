import { TransitionLink } from "../../components/PageTransitionProvider";
import { Footer } from "../../components/Footer";

export const metadata = {
  title: "Security | WorthIQ",
  description: "How WorthIQ protects your financial data with bank-level encryption, read-only Plaid access, and secure infrastructure.",
};

const SECURITY_PILLARS = [
  {
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "256-bit Encryption",
    desc: "All data is encrypted in transit using TLS 1.2+ and encrypted at rest using AES-256. The same standard used by financial institutions and government agencies.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Plaid-Powered Connections",
    desc: "We never see or store your banking credentials. Plaid — trusted by thousands of apps and millions of users — handles all authentication directly with your bank.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    title: "Read-Only Access",
    desc: "WorthIQ has read-only access to your accounts. We can see balances and transactions — we cannot move money, make payments, or initiate any transactions whatsoever.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: "No Credential Storage",
    desc: "Your bank username and password never touch WorthIQ's servers. Authentication happens entirely within Plaid's secure infrastructure.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: "Secure Infrastructure",
    desc: "WorthIQ runs on Railway's managed cloud infrastructure. Production database access requires multi-factor authentication and is restricted to authorized personnel only.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: "Revoke Anytime",
    desc: "You can disconnect any linked financial account at any time from the app. Disconnecting immediately revokes WorthIQ's access to that account's data.",
  },
];

const FAQ = [
  {
    q: "Can WorthIQ make transactions on my behalf?",
    a: "No. WorthIQ has strictly read-only access to your accounts. We can view balances and transaction history, but we cannot move money, make purchases, or initiate any transactions of any kind.",
  },
  {
    q: "Does WorthIQ store my bank login credentials?",
    a: "Never. Your banking username and password are only ever entered into Plaid's secure interface. They never pass through WorthIQ's servers or get stored in our database.",
  },
  {
    q: "What happens to my data if I delete my account?",
    a: "When you delete your account, all your personal data — including linked account data and transaction history — is permanently deleted from our systems within 30 days.",
  },
  {
    q: "Who at WorthIQ can access my financial data?",
    a: "Access to production data is restricted to a small number of authorized engineers and requires multi-factor authentication. We do not sell, share, or monetize your financial data.",
  },
  {
    q: "Is WorthIQ safe to use with my primary bank account?",
    a: "Yes. Because access is read-only via Plaid, there is no mechanism for any party to initiate transactions. Your money is always safe. Millions of people use Plaid daily with their primary financial institutions.",
  },
  {
    q: "How is the Sage AI powered, and is my data safe with it?",
    a: "Sage is powered by Anthropic's Claude API. When you request insights, a summary of your financial context is sent to Anthropic. We do not send raw credentials or account numbers. Anthropic's API does not use your data to train their models.",
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-200">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4 sm:px-10">
        <TransitionLink href="/" className="text-xl font-black tracking-tight text-white hover:opacity-80">
          Worth<span className="text-[#46c2e9]">IQ</span>
          <sup className="ml-0.5 text-[10px] font-bold text-slate-500">™</sup>
        </TransitionLink>
        <TransitionLink href="/dashboard" className="text-sm font-semibold text-slate-400 transition hover:text-white">
          Dashboard →
        </TransitionLink>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/[0.07] bg-gradient-to-br from-[#0d1017] to-[#0a0c10]">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:px-10 sm:py-24">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#46c2e9]/25 bg-[#46c2e9]/[0.08] text-[#46c2e9]">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            Security at WorthIQ
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400">
            You're trusting us with your financial data. We take that seriously. Here's exactly how we protect it.
          </p>
        </div>
      </div>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY_PILLARS.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-white/[0.06] bg-[#11141b] p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#46c2e9]/20 bg-[#46c2e9]/[0.07] text-[#46c2e9]">
                {p.icon}
              </div>
              <h3 className="font-bold text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plaid section */}
      <section className="border-y border-white/[0.05] bg-[#0d1017]">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
          <div className="grid items-center gap-10 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#46c2e9]">Powered by Plaid</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Your credentials stay with your bank
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                WorthIQ uses Plaid, the industry standard for financial data connectivity. Plaid is trusted by thousands of apps — including Venmo, Robinhood, and Coinbase — and connects to over 12,000 financial institutions.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                When you link an account, you authenticate directly with your bank through Plaid's secure interface. WorthIQ only receives a read-only access token — never your credentials.
              </p>
              <a
                href="https://plaid.com/safety/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#46c2e9] transition hover:opacity-80"
              >
                Learn about Plaid's security →
              </a>
            </div>
            <div className="space-y-3">
              {[
                "12,000+ supported financial institutions",
                "Read-only access tokens — no write permissions",
                "Direct bank authentication — WorthIQ never sees your password",
                "Trusted by millions of users across thousands of apps",
              ].map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-[#11141b] px-4 py-3.5">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#46c2e9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-slate-300">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20 sm:px-10">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-black tracking-tight text-white">Common questions</h2>
        </div>
        <div className="space-y-4">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-2xl border border-white/[0.06] bg-[#11141b] p-6">
              <h3 className="font-bold text-white">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-3xl px-6 pb-20 text-center sm:px-10">
        <div className="rounded-2xl border border-[#46c2e9]/15 bg-[#11141b] p-10">
          <h2 className="text-2xl font-black text-white">Found a security issue?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
            We take security reports seriously. If you've discovered a vulnerability, please disclose it responsibly by emailing us directly.
          </p>
          <a
            href="mailto:worthiq2026@gmail.com"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#46c2e9]/25 bg-[#46c2e9]/[0.08] px-6 py-3 text-sm font-semibold text-[#46c2e9] transition hover:bg-[#46c2e9]/[0.14]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            worthiq2026@gmail.com
          </a>
        </div>
      </section>

      <Footer variant="app" />
    </div>
  );
}
