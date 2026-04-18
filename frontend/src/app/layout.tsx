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

const BASE_URL = "https://worthiq.io";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "WorthIQ™ — Master Your Capital with AI",
    template: "%s | WorthIQ™",
  },
  description:
    "Real-time bank-linked insights, Sage AI, and customizable dashboards built for your financial life. Connect all your accounts and master your capital.",
  keywords: [
    "personal finance",
    "net worth tracker",
    "AI financial insights",
    "budget tracker",
    "investment tracker",
    "Plaid",
    "Sage AI",
    "WorthIQ",
  ],
  authors: [{ name: "WorthIQ, Inc.", url: BASE_URL }],
  creator: "WorthIQ, Inc.",
  publisher: "WorthIQ, Inc.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "WorthIQ™",
    title: "WorthIQ™ — Master Your Capital with AI",
    description:
      "Real-time bank-linked insights, Sage AI, and customizable dashboards. Connect all your accounts and master your capital.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "WorthIQ — Personal Finance Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@worthiq",
    creator: "@worthiq",
    title: "WorthIQ™ — Master Your Capital with AI",
    description:
      "Real-time bank-linked insights, Sage AI, and customizable dashboards built for your financial life.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
        <link rel="icon" type="image/svg+xml" href="/logos/worthiq-mark.svg?v=2" />
        <link rel="shortcut icon" href="/logos/worthiq-mark.svg?v=2" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png" />
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
