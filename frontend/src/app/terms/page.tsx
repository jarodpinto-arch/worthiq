import { TransitionLink } from "../../components/PageTransitionProvider";
import { Footer } from "../../components/Footer";

export const metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using the WorthIQ personal finance platform.",
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

export default function TermsOfService() {
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
          <h1 className="mt-2 text-4xl font-black tracking-tight text-white">Terms of Service</h1>
          <p className="mt-3 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
        </div>

        <p className="text-sm leading-relaxed text-slate-400">
          Please read these Terms of Service ("Terms") carefully before using WorthIQ (the "Service") operated by WorthIQ, Inc. By accessing or using the Service, you agree to be bound by these Terms.
        </p>

        <Section title="1. Acceptance of Terms">
          <p>
            By creating an account or using WorthIQ, you agree to these Terms and our{" "}
            <TransitionLink href="/privacy" className="text-[#46c2e9] hover:underline">Privacy Policy</TransitionLink>.
            If you do not agree, you may not use the Service. You must be at least 18 years old to use WorthIQ.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            WorthIQ is a personal finance intelligence platform that allows users to connect financial accounts, view aggregated financial data, and receive AI-powered insights. The Service is intended for personal, non-commercial use.
          </p>
          <p className="rounded-xl border border-yellow-500/15 bg-yellow-500/[0.05] px-4 py-3 text-yellow-200/80">
            WorthIQ is not a bank, broker-dealer, or investment advisor. Financial insights provided by Sage AI are for informational purposes only and do not constitute financial, investment, tax, or legal advice. Always consult a qualified professional before making financial decisions.
          </p>
        </Section>

        <Section title="3. Account Registration">
          <p>
            You must provide accurate and complete information when registering. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately at{" "}
            <a href="mailto:worthiq2026@gmail.com" className="text-[#46c2e9] hover:underline">worthiq2026@gmail.com</a>{" "}
            if you suspect unauthorized access to your account.
          </p>
        </Section>

        <Section title="4. Financial Account Connections">
          <p>
            WorthIQ uses Plaid Technologies, Inc. to connect to your financial accounts. By connecting accounts, you authorize WorthIQ and Plaid to access your financial data in accordance with Plaid's End User Privacy Policy. This access is read-only — WorthIQ cannot move money, make payments, or initiate any transactions on your behalf.
          </p>
          <p>
            You may disconnect any linked account at any time through the app. Disconnecting an account revokes WorthIQ's access to future data from that institution.
          </p>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="mt-2 space-y-1.5 pl-4">
            {[
              "Use the Service for any unlawful purpose",
              "Attempt to gain unauthorized access to any part of the Service",
              "Transmit any harmful, offensive, or disruptive content",
              "Reverse engineer, decompile, or disassemble the Service",
              "Use automated means (bots, scrapers) to access the Service without written permission",
              "Resell or sublicense access to the Service",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#46c2e9]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="6. Intellectual Property">
          <p>
            The Service, including all software, design, trademarks, and content, is owned by WorthIQ, Inc. and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission.
          </p>
          <p>
            You retain ownership of your financial data. By using the Service, you grant WorthIQ a limited license to process and display your data solely for the purpose of providing the Service to you.
          </p>
        </Section>

        <Section title="7. Disclaimer of Warranties">
          <p className="font-mono text-xs text-slate-500 leading-relaxed">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WORTHIQ DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT FINANCIAL DATA WILL ALWAYS BE ACCURATE OR UP-TO-DATE.
          </p>
          <p>
            Financial data displayed in WorthIQ is sourced from your financial institutions via Plaid and may not reflect real-time balances. WorthIQ is not responsible for inaccuracies in data provided by third-party financial institutions.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p className="font-mono text-xs text-slate-500 leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WORTHIQ SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE. IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
          </p>
        </Section>

        <Section title="9. Indemnification">
          <p>
            You agree to indemnify and hold harmless WorthIQ, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, or expenses arising from your use of the Service or violation of these Terms.
          </p>
        </Section>

        <Section title="10. Termination">
          <p>
            We may suspend or terminate your account at any time for violation of these Terms or for any other reason at our discretion. You may delete your account at any time from the Settings page. Upon termination, your right to use the Service ceases immediately.
          </p>
        </Section>

        <Section title="11. Changes to Terms">
          <p>
            We may update these Terms from time to time. We will notify you of material changes via email or in-app notification. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="12. Governing Law">
          <p>
            These Terms are governed by the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Any dispute arising from these Terms shall be resolved in the courts of Delaware.
          </p>
        </Section>

        <Section title="13. Contact">
          <p>
            Questions about these Terms? Contact us at{" "}
            <a href="mailto:worthiq2026@gmail.com" className="text-[#46c2e9] hover:underline">worthiq2026@gmail.com</a>.
          </p>
        </Section>
      </main>

      <Footer variant="app" />
    </div>
  );
}
