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
  description: "Master Your Capital with AI — personal finance intelligence powered by Sage AI.",
  openGraph: {
    title: "WorthIQ™",
    description: "Master Your Capital with AI — personal finance intelligence powered by Sage AI.",
  },
  twitter: {
    title: "WorthIQ™",
    description: "Master Your Capital with AI — personal finance intelligence powered by Sage AI.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WorthIQ™",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="theme-color" content="#0A0C10" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-16.png" />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }
        `}} />
      </head>
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
