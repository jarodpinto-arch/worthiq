import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import SageChat from "../components/SageChat";
import { PageTransitionProvider } from "../components/PageTransitionProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "WorthIQ™",
  description: "See the Risk. Own the Reward.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-worthiq-surface text-slate-200 font-[family-name:var(--font-inter)]">
        <PageTransitionProvider>
          {children}
          <SageChat />
        </PageTransitionProvider>
        <Analytics />
      </body>
    </html>
  );
}
