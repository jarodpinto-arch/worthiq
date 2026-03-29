"use client";
export const dynamic = "force-dynamic";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, User, Bell, Shield, CreditCard, LogOut, ChevronRight,
  Moon, Globe, Trash2,
} from "lucide-react";
import { WorthIQLogoNav } from "../../components/WorthIQLogoNav";
import { markSidebar, ringOffsetApp } from "../../lib/worthiq-logo-mark";
import { usePageTransition } from "../../components/PageTransitionProvider";

type Section = {
  label: string;
  icon: React.ReactNode;
  items: { label: string; description?: string; action?: () => void; destructive?: boolean }[];
};

export default function SettingsPage() {
  const router = useRouter();
  const { navigate } = usePageTransition();
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) { router.push("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserEmail(payload.email ?? payload.sub ?? "");
    } catch { /* ignore */ }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("authToken");
    router.push("/login");
  }

  const sections: Section[] = [
    {
      label: "Account",
      icon: <User size={15} />,
      items: [
        { label: "Email address", description: userEmail || "—" },
        { label: "Change password", description: "Update your login credentials" },
      ],
    },
    {
      label: "Notifications",
      icon: <Bell size={15} />,
      items: [
        { label: "Price alerts", description: "Get notified on large moves" },
        { label: "Weekly summary", description: "Receive your weekly net-worth digest" },
      ],
    },
    {
      label: "Privacy & Security",
      icon: <Shield size={15} />,
      items: [
        { label: "Two-factor authentication", description: "Add an extra layer of protection" },
        { label: "Connected apps", description: "Manage third-party access" },
      ],
    },
    {
      label: "Billing",
      icon: <CreditCard size={15} />,
      items: [
        { label: "Current plan", description: "Free tier" },
        { label: "Upgrade to Pro", description: "Unlock advanced analytics and unlimited accounts" },
      ],
    },
    {
      label: "Danger Zone",
      icon: <Trash2 size={15} />,
      items: [
        {
          label: "Delete account",
          description: "Permanently remove your data",
          destructive: true,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0C10] text-slate-300 flex">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 border-r border-slate-800 flex flex-col items-center lg:items-start p-6 gap-8 shrink-0">
        <WorthIQLogoNav className={markSidebar} wrapperClassName={ringOffsetApp} />
        <nav className="flex-1 w-full" />
        <div className="w-full space-y-2">
          <p className="hidden lg:block text-[10px] text-slate-500 font-semibold uppercase tracking-widest truncate px-3">
            {userEmail}
          </p>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-slate-500 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 hover:shadow-[0_0_16px_rgba(230,57,70,0.2)] active:scale-[0.98]"
          >
            <LogOut size={18} className="shrink-0" />
            <span className="hidden lg:block text-sm font-semibold">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 lg:p-10 overflow-auto">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-6 mb-10">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:block">Dashboard</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.2em] text-worthiq-cyan">
              Account &amp; Preferences
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="max-w-2xl space-y-8">
          {sections.map((section) => (
            <div key={section.label}>
              <div className="flex items-center gap-2 mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                {section.icon}
                {section.label}
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#11141B] divide-y divide-slate-800 overflow-hidden">
                {section.items.map((item) => (
                  <div
                    key={item.label}
                    onClick={item.action}
                    className={`flex items-center justify-between px-5 py-4 transition-colors ${
                      item.action ? "cursor-pointer hover:bg-slate-800/50" : ""
                    } ${item.destructive ? "text-red-400 hover:bg-red-500/10" : ""}`}
                  >
                    <div>
                      <p className={`text-sm font-semibold ${item.destructive ? "text-red-400" : "text-slate-200"}`}>
                        {item.label}
                      </p>
                      {item.description && (
                        <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                      )}
                    </div>
                    {item.action && (
                      <ChevronRight size={16} className="text-slate-600 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <p className="text-center text-xs text-slate-700 pt-4">
            WorthIQ™ · All rights reserved
          </p>
        </div>
      </main>
    </div>
  );
}
