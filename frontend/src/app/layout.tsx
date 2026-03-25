import "./globals.css";
import type { Metadata } from "next";
import SageChat from "../components/SageChat";

export const metadata: Metadata = {
  title: "WorthIQ™",
  description: "See the Risk. Own the Reward.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <SageChat />
      </body>
    </html>
  );
}
