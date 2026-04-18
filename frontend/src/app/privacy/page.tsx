import { TransitionLink } from "../../components/PageTransitionProvider";
import { Footer } from "../../components/Footer";

export const metadata = {
  title: "Privacy Policy",
  description: "How WorthIQ collects, uses, and protects your personal and financial data.",
};

const LAST_UPDATED = "April 1, 2025";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-black tracking-tight text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-400">{children}</div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="font-bold text-slate-200">{title}</h3>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-400">{children}</div>
    </div>
  );
}

function Ul({ items }: { items: { label: string; desc: string }[] }) {
  return (
    <ul className="mt-2 space-y-1.5 pl-4">
      {items.map((i) => (
        <li key={i.label} className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#46c2e9]" />
          <span>
            <strong className="text-slate-200">{i.label}:</strong> {i.desc}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function PrivacyPolicy() {
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

      <main className="mx-auto max-w-3xl px-6 py-16 sm:px-10">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-[#46c2e9]">Legal</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-white">Privacy Policy</h1>
          <p className="mt-3 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
        </div>

        <p className="text-sm leading-relaxed text-slate-400">
          WorthIQ, Inc. ("WorthIQ," "we," "us," or "our") operates the WorthIQ personal finance platform at{" "}
          <a href="https://worthiq.io" className="text-[#46c2e9] hover:underline">worthiq.io</a>. This Privacy Policy explains how we collect, use, disclose, and safeguard your information. By using WorthIQ, you agree to this policy.
        </p>

        <Section title="1. Information We Collect">
          <Sub title="1.1 Information You Provide">
            <Ul items={[
              { label: "Account information", desc: "Name, email address, and password (stored as a secure hash) when you register." },
              { label: "Profile data", desc: "Any optional preferences or settings you configure in the app." },
            ]} />
          </Sub>
          <Sub title="1.2 Financial Data via Plaid">
            <p>
              WorthIQ integrates with Plaid Technologies, Inc. to connect your financial accounts. When you link a bank or brokerage, Plaid handles authentication directly with your financial institution.{" "}
              <strong className="text-slate-200">Your banking credentials are never transmitted to or stored by WorthIQ.</strong>
            </p>
            <p>
              Through Plaid, we receive and store: account names and balances, transaction history, account types and institutions, and investment holdings and transactions. This data is used solely to provide the WorthIQ service to you.
            </p>
          </Sub>
          <Sub title="1.3 Usage Data">
            <p>
              We may collect information about how you interact with our service, including pages visited, features used, and device/browser information. This helps us improve WorthIQ.
            </p>
          </Sub>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul className="mt-2 space-y-1.5 pl-4">
            {[
              "Provide, operate, and maintain the WorthIQ service",
              "Display your financial accounts, balances, and transaction history",
              "Generate AI-powered insights via Sage (processed using Anthropic's API)",
              "Authenticate you and keep your account secure",
              "Send transactional emails (e.g., password resets)",
              "Improve and develop new features",
              "Comply with legal obligations",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#46c2e9]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-xl border border-[#46c2e9]/15 bg-[#46c2e9]/[0.05] px-4 py-3 font-semibold text-slate-300">
            We do not sell your personal or financial data to third parties. We do not use your financial data for advertising.
          </p>
        </Section>

        <Section title="3. Data Storage and Security">
          <p>
            Your data is encrypted in transit using TLS 1.2+ and encrypted at rest using AES-256. We store your data on secure cloud infrastructure (Railway). Access to production databases is restricted to authorized personnel and requires multi-factor authentication.
          </p>
          <p>
            No method of transmission over the Internet is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
          </p>
        </Section>

        <Section title="4. Third-Party Services">
          <p>WorthIQ uses the following third-party services:</p>
          <Ul items={[
            { label: "Plaid", desc: "Bank account connection and financial data retrieval." },
            { label: "Anthropic (Claude API)", desc: "AI-powered financial insights via Sage. Financial data sent to Anthropic is used only for generating your insights and is not used to train their models." },
            { label: "Railway", desc: "Backend hosting and database infrastructure." },
            { label: "Vercel", desc: "Frontend hosting." },
          ]} />
        </Section>

        <Section title="5. Data Retention">
          <p>
            We retain your data for as long as your account is active or as needed to provide you the service. If you delete your account, we will delete your personal data within 30 days, except where required to retain it by law.
          </p>
        </Section>

        <Section title="6. Your Rights">
          <p>You have the right to:</p>
          <ul className="mt-2 space-y-1.5 pl-4">
            {[
              "Access the personal data we hold about you",
              "Request correction of inaccurate data",
              "Request deletion of your account and associated data",
              "Disconnect linked financial accounts at any time from within the app",
              "Export your transaction data",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#46c2e9]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            To exercise these rights, contact us at{" "}
            <a href="mailto:privacy@worthiq.io" className="text-[#46c2e9] hover:underline">privacy@worthiq.io</a>.
          </p>
        </Section>

        <Section title="7. Children's Privacy">
          <p>
            WorthIQ is not directed to individuals under 18 years of age. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact{" "}
            <a href="mailto:privacy@worthiq.io" className="text-[#46c2e9] hover:underline">privacy@worthiq.io</a>.
          </p>
        </Section>

        <Section title="8. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by placing a prominent notice on our website. Continued use of WorthIQ after changes are posted constitutes acceptance of the revised policy.
          </p>
        </Section>

        <Section title="9. Contact Us">
          <p>If you have questions about this Privacy Policy, please contact us:</p>
          <Ul items={[
            { label: "Email", desc: "privacy@worthiq.io" },
            { label: "Website", desc: "worthiq.io" },
          ]} />
        </Section>
      </main>

      <Footer variant="app" />
    </div>
  );
}
