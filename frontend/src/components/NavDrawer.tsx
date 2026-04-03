"use client";
import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, LayoutDashboard, LineChart, Receipt, Link as LinkIcon,
  Settings, LogOut, ChevronRight,
} from 'lucide-react';
import { WorthIQLogoNav } from './WorthIQLogoNav';
import { markSidebar, ringOffsetApp } from '../lib/worthiq-logo-mark';
import { usePageTransition } from './PageTransitionProvider';

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
  userEmail: string;
  hasAccounts: boolean;
  activePath?: string;
}

interface NavRowProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  destructive?: boolean;
}

function NavRow({ icon, label, onClick, active, destructive }: NavRowProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150
        ${active
          ? 'bg-worthiq-cyan/10 text-worthiq-cyan'
          : destructive
          ? 'text-slate-500 hover:bg-red-500/10 hover:text-red-400'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {!destructive && <ChevronRight size={14} className="opacity-30" />}
    </button>
  );
}

export function NavDrawer({ open, onClose, userEmail, hasAccounts, activePath }: NavDrawerProps) {
  const router = useRouter();
  const { navigate } = usePageTransition();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const go = (path: string) => { onClose(); navigate(path); };

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-[#0D1017] border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
          <WorthIQLogoNav className={markSidebar} wrapperClassName={ringOffsetApp} />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <NavRow
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            onClick={() => go('/dashboard')}
            active={activePath === '/dashboard'}
          />
          <NavRow
            icon={<Receipt size={18} />}
            label="Transactions"
            onClick={() => go('/transactions')}
            active={activePath === '/transactions'}
          />
          <NavRow
            icon={<LinkIcon size={18} />}
            label={hasAccounts ? 'Manage Accounts' : 'Connect Bank'}
            onClick={() => go('/connect')}
            active={activePath === '/connect'}
          />
          <NavRow
            icon={<Settings size={18} />}
            label="Settings"
            onClick={() => go('/settings')}
            active={activePath === '/settings'}
          />
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-slate-800 space-y-2">
          {userEmail && (
            <p className="px-4 text-[10px] font-semibold uppercase tracking-widest text-slate-600 truncate">
              {userEmail}
            </p>
          )}
          <NavRow
            icon={<LogOut size={18} />}
            label="Log Out"
            destructive
            onClick={() => {
              localStorage.removeItem('authToken');
              onClose();
              router.push('/login');
            }}
          />
        </div>
      </div>
    </>
  );
}
