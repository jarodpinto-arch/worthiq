"use client";
export const dynamic = "force-dynamic";
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Wallet, CreditCard, TrendingUp, BarChart2,
  Plus, AlertCircle, Building2, LineChart, Receipt,
  Sparkles, Loader2, X, LayoutGrid, LayoutDashboard, Menu, SlidersHorizontal,
  ArrowUpRight, ArrowDownRight, RefreshCw, GripVertical, ChevronUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import WidgetCard from '../../components/WidgetCard';
import { getApiBase } from '../../lib/api-base';
import { computeNetWorthFromAccounts } from '@worthiq/core';
import { filterInvestmentTxByInstrumentKind, isOptionsLeg } from '../../lib/investment-instrument';
import { usePageTransition } from '../../components/PageTransitionProvider';
import { NavDrawer } from '../../components/NavDrawer';
import { NetWorthChart, type NetWorthBarDrillPayload } from '../../components/NetWorthChart';
import { ManageViewsModal } from '../../components/ManageViewsModal';
import { WorthIQLogoNav } from '../../components/WorthIQLogoNav';
import { ringOffsetApp } from '../../lib/worthiq-logo-mark';

const DASHBOARD_TABS_KEY = 'worthiq_dashboard_tabs_v3';
const DASHBOARD_TABS_LEGACY_V2 = 'worthiq_dashboard_tabs_v2';
const DASHBOARD_DEFAULT_TAB_KEY = 'worthiq_dashboard_default_tab_v1';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

type AccountDetail = 'cash' | 'credit' | 'investments' | 'options' | null;

type DashboardTabVariant = 'overview' | 'example' | 'sage_widget' | 'manual' | 'cashflow';

type PivotZone = 'filters' | 'rows' | 'columns' | 'values';

interface ManualPivotLayout {
  filters: string[];
  rows: string[];
  columns: string[];
  values: string[];
}

const EMPTY_MANUAL_LAYOUT: ManualPivotLayout = {
  filters: [],
  rows: [],
  columns: [],
  values: [],
};

interface DashboardTab {
  id: string;
  title: string;
  variant: DashboardTabVariant;
  hidden?: boolean;
  exampleKey?: 'spending' | 'investments';
  widgetId?: string;
  manualLayout?: ManualPivotLayout;
}

const DEFAULT_DASHBOARD_TABS: DashboardTab[] = [
  { id: 'builtin-overview', title: 'Overview', variant: 'overview' },
  { id: 'builtin-cashflow', title: 'Cashflow', variant: 'cashflow' },
  { id: 'ex-spending', title: 'Spending', variant: 'example', exampleKey: 'spending' },
  { id: 'ex-investments', title: 'Investments', variant: 'example', exampleKey: 'investments' },
];

function mergeDashboardTabsWithDefaults(parsed: DashboardTab[] | null): DashboardTab[] {
  const defaults = DEFAULT_DASHBOARD_TABS;
  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
    return defaults.map((t) => ({ ...t }));
  }

  const defaultIds = new Set(defaults.map((d) => d.id));
  const byId = new Map(parsed.map((t) => [t.id, t]));
  const merged: DashboardTab[] = [];

  for (const d of defaults) {
    const ex = byId.get(d.id);
    if (ex) {
      merged.push({
        ...d,
        ...ex,
        variant: ex.variant,
        manualLayout: ex.manualLayout ?? d.manualLayout,
      });
    } else {
      merged.push({ ...d });
    }
  }

  for (const t of parsed) {
    if (!defaultIds.has(t.id)) merged.push(t);
  }

  if (!merged.some((t) => !t.hidden)) {
    return merged.map((t) => (defaultIds.has(t.id) ? { ...t, hidden: false } : t));
  }

  return merged;
}

/** Reorder visible tabs only; hidden tabs keep their slots in the full array. */
function reorderVisibleDashboardTabs(
  full: DashboardTab[],
  draggedId: string,
  targetId: string,
): DashboardTab[] {
  const visible = full.filter((t) => !t.hidden);
  const fromIdx = visible.findIndex((t) => t.id === draggedId);
  const toIdx = visible.findIndex((t) => t.id === targetId);
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return full;

  const nextVisible = [...visible];
  const [removed] = nextVisible.splice(fromIdx, 1);
  nextVisible.splice(toIdx, 0, removed);

  let vi = 0;
  return full.map((t) => (t.hidden ? t : nextVisible[vi++]));
}

const EXAMPLE_SPENDING_WIDGET = {
  id: 'inline-example-spending',
  type: 'bar' as const,
  title: 'Spending by category',
  config: { dataSource: 'transactions' as const, groupBy: 'category', limit: 8 },
};

function buildSageFinancialContext(
  accounts: any[],
  transactions: any[],
  investmentTx: any[],
  securities: any[],
  classifications: Record<string, any>,
) {
  const secMapCtx = new Map(securities.map((s) => [s.security_id, s]));
  let investmentOptionLegs = 0;
  let investmentNonOptionLegs = 0;
  for (const t of investmentTx) {
    if (isOptionsLeg(t, secMapCtx.get(t.security_id))) investmentOptionLegs += 1;
    else investmentNonOptionLegs += 1;
  }
  const spendCats: Record<string, number> = {};
  for (const t of transactions) {
    if (t.amount <= 0) continue;
    const cl = classifications[t.transaction_id];
    const c = cl?.userCategory || cl?.aiCategory || t.category?.[0] || 'Uncategorized';
    spendCats[c] = (spendCats[c] ?? 0) + 1;
  }
  const topSpendingSageCategories = Object.entries(spendCats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));
  const invSageCats: Record<string, number> = {};
  for (const t of investmentTx) {
    const cl = classifications[t.investment_transaction_id];
    const c = cl?.userCategory || cl?.aiCategory || 'Unclassified';
    invSageCats[c] = (invSageCats[c] ?? 0) + 1;
  }
  const topInvestmentSageCategories = Object.entries(invSageCats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  return {
    netWorth: computeNetWorthFromAccounts(accounts),
    accountSummary: accounts.map((a) => ({
      name: a.name,
      institution: a.institution ?? null,
      type: a.type,
      balance: a.balances.current,
    })),
    recentTxSample: transactions.slice(0, 15).map((t) => ({
      name: t.merchant_name || t.name,
      amount: t.amount,
      date: t.date,
      sageCategory:
        classifications[t.transaction_id]?.userCategory ||
        classifications[t.transaction_id]?.aiCategory ||
        null,
    })),
    investmentTxCount: investmentTx.length,
    investmentTxByInstrumentKind: { optionLegs: investmentOptionLegs, nonOptionLegs: investmentNonOptionLegs },
    topSpendingSageCategories,
    topInvestmentSageCategories,
  };
}

export default function Dashboard() {
  const router = useRouter();
  const { navigate } = usePageTransition();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [investmentTx, setInvestmentTx] = useState<any[]>([]);
  const [securities, setSecurities] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const [dashboardTabs, setDashboardTabs] = useState<DashboardTab[]>(DEFAULT_DASHBOARD_TABS);
  const [activeTab, setActiveTab] = useState<string>('builtin-overview');
  const [preferredLandingTabId, setPreferredLandingTabId] = useState<string | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<AccountDetail>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [manageViewsOpen, setManageViewsOpen] = useState(false);
  const [newTabModal, setNewTabModal] = useState<'closed' | 'choose' | 'sage' | 'manual'>('closed');
  const [manualTabTitle, setManualTabTitle] = useState('');
  const newTabModalRef = useRef<HTMLDivElement>(null);
  const accountsSectionRef = useRef<HTMLDivElement>(null);

  const [widgets, setWidgets] = useState<any[]>([]);
  const [widgetPrompt, setWidgetPrompt] = useState('');
  const [widgetCreating, setWidgetCreating] = useState(false);
  const [widgetPreview, setWidgetPreview] = useState<any | null>(null);
  const [optionsInstrumentFilter, setOptionsInstrumentFilter] = useState<'all' | 'options_only' | 'non_options'>('all');
  const [sageInsights, setSageInsights] = useState<string[] | null>(null);
  const [sageInsightsLoading, setSageInsightsLoading] = useState(false);
  const [sageInsightsError, setSageInsightsError] = useState<string | null>(null);
  const [sageInsightsExpanded, setSageInsightsExpanded] = useState(false);
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [chartFocus, setChartFocus] = useState<{ accountId?: string; institution?: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const preferredRaw = localStorage.getItem(DASHBOARD_DEFAULT_TAB_KEY);
      setPreferredLandingTabId(preferredRaw);
      const rawV3 = localStorage.getItem(DASHBOARD_TABS_KEY);
      const rawV2 = localStorage.getItem(DASHBOARD_TABS_LEGACY_V2);
      const raw = rawV3 ?? rawV2;
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          const merged = mergeDashboardTabsWithDefaults(parsed as DashboardTab[]);
          const tabs = merged.map((t) =>
            t.variant === 'manual'
              ? { ...t, manualLayout: t.manualLayout ?? { ...EMPTY_MANUAL_LAYOUT } }
              : t,
          );
          setDashboardTabs(tabs);
          const visible = tabs.filter((t) => !t.hidden);
          const pick =
            preferredRaw && visible.some((t) => t.id === preferredRaw)
              ? preferredRaw
              : (visible[0]?.id ?? tabs[0]?.id);
          if (pick) setActiveTab(pick);
        }
      } else if (preferredRaw) {
        setActiveTab(preferredRaw);
      }
    } catch {}

    const authToken = localStorage.getItem('authToken');
    if (!authToken) { router.push('/login'); return; }

    const init = async () => {
      try {
        const profileRes = await fetch(`${getApiBase()}/auth/me`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!profileRes.ok) {
          localStorage.removeItem('authToken');
          router.push('/login');
          return;
        }
        const profile = await profileRes.json();
        setUserEmail(profile.email);

        const [accountsRes, invRes, txRes, classRes, widgetsRes] = await Promise.all([
          fetch(`${getApiBase()}/plaid/accounts`, { headers: { Authorization: `Bearer ${authToken}` } }),
          fetch(`${getApiBase()}/plaid/investment-transactions`, { headers: { Authorization: `Bearer ${authToken}` } }),
          fetch(`${getApiBase()}/plaid/transactions`, { headers: { Authorization: `Bearer ${authToken}` } }),
          fetch(`${getApiBase()}/sage/classifications`, { headers: { Authorization: `Bearer ${authToken}` } }),
          fetch(`${getApiBase()}/widgets`, { headers: { Authorization: `Bearer ${authToken}` } }),
        ]);

        const accData = await accountsRes.json();
        setAccounts(accData.accounts || []);

        if (invRes.ok) {
          const invData = await invRes.json();
          setInvestmentTx(invData.investmentTransactions || []);
          setSecurities(invData.securities || []);
        }
        if (txRes.ok) {
          const txData = await txRes.json();
          setTransactions(txData.transactions || []);
        }
        if (classRes.ok) {
          const classData = await classRes.json();
          setClassifications(classData.classifications || {});
        }
        if (widgetsRes.ok) {
          const wData = await widgetsRes.json();
          setWidgets(wData.widgets || []);
        }
      } catch (err) {
        console.error('Dashboard init error:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  useEffect(() => {
    if (!mounted) return;
    try {
      if (dashboardTabs.length === 0) localStorage.removeItem(DASHBOARD_TABS_KEY);
      else localStorage.setItem(DASHBOARD_TABS_KEY, JSON.stringify(dashboardTabs));
    } catch {}
  }, [dashboardTabs, mounted]);

  useEffect(() => {
    if (newTabModal === 'closed') return;
    const handler = (e: MouseEvent) => {
      if (newTabModalRef.current && !newTabModalRef.current.contains(e.target as Node)) {
        setNewTabModal('closed');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [newTabModal]);

  const finData = { accounts, transactions, investmentTx, securities, classifications };

  const filteredOptionsTx = useMemo(
    () => filterInvestmentTxByInstrumentKind(investmentTx, securities, optionsInstrumentFilter),
    [investmentTx, securities, optionsInstrumentFilter],
  );

  const fetchSageInsights = useCallback(
    async () => {
      const authToken = localStorage.getItem('authToken');
      if (!authToken || accounts.length === 0) return;
      setSageInsightsLoading(true);
      setSageInsightsError(null);
      try {
        const context = buildSageFinancialContext(
          accounts,
          transactions,
          investmentTx,
          securities,
          classifications,
        );
        const res = await fetch(`${getApiBase()}/sage/dashboard-insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ context }),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || res.statusText);
        }
        const data = await res.json();
        setSageInsights(Array.isArray(data.insights) ? data.insights : []);
      } catch (e: unknown) {
        console.error('Sage insights error:', e);
        setSageInsightsError(e instanceof Error ? e.message : 'Could not load insights');
        setSageInsights(null);
      } finally {
        setSageInsightsLoading(false);
      }
    },
    [accounts, transactions, investmentTx, securities, classifications],
  );

  const askSageWidget = async () => {
    if (!widgetPrompt.trim()) return;
    const authToken = localStorage.getItem('authToken');
    setWidgetCreating(true);
    setWidgetPreview(null);
    try {
      const context = buildSageFinancialContext(
        accounts,
        transactions,
        investmentTx,
        securities,
        classifications,
      );
      const res = await fetch(`${getApiBase()}/sage/create-widget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ prompt: widgetPrompt, context }),
      });
      if (res.ok) {
        const data = await res.json();
        setWidgetPreview(data.widget);
        setWidgetPrompt('');
      }
    } catch (err) {
      console.error('Widget creation error:', err);
    } finally {
      setWidgetCreating(false);
    }
  };

  const saveWidgetAsNewTab = async (preview: any) => {
    const authToken = localStorage.getItem('authToken');
    try {
      const res = await fetch(`${getApiBase()}/widgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ type: preview.type, title: preview.title, config: preview.config }),
      });
      if (res.ok) {
        const data = await res.json();
        const w = data.widget;
        setWidgets((prev) => [...prev, w]);
        const newTab: DashboardTab = {
          id: `tab-w-${w.id}`,
          title: w.title,
          variant: 'sage_widget',
          widgetId: w.id,
        };
        setDashboardTabs((prev) => [...prev, newTab]);
        setActiveTab(newTab.id);
        setWidgetPreview(null);
        setWidgetPrompt('');
        setNewTabModal('closed');
      }
    } catch {}
  };

  const removeTab = async (tabId: string) => {
    if (tabId === 'builtin-overview' || tabId === 'builtin-cashflow') return;
    const tab = dashboardTabs.find((t) => t.id === tabId);
    const nextTabs = dashboardTabs.filter((t) => t.id !== tabId);
    if (tab?.variant === 'sage_widget' && tab.widgetId) {
      const authToken = localStorage.getItem('authToken');
      try {
        await fetch(`${getApiBase()}/widgets/${tab.widgetId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setWidgets((prev) => prev.filter((w) => w.id !== tab.widgetId));
      } catch {}
    }
    setDashboardTabs(nextTabs);
    if (activeTab === tabId) {
      setActiveTab(nextTabs.find((t) => !t.hidden)?.id ?? nextTabs[0]?.id ?? '');
    }
  };

  const addManualTab = () => {
    const title = manualTabTitle.trim() || 'Custom view';
    const id = `tab-manual-${Date.now()}`;
    setDashboardTabs((prev) => [
      ...prev,
      { id, title, variant: 'manual', manualLayout: { ...EMPTY_MANUAL_LAYOUT } },
    ]);
    setActiveTab(id);
    setManualTabTitle('');
    setNewTabModal('closed');
  };

  const updateManualLayout = (tabId: string, layout: ManualPivotLayout) => {
    setDashboardTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, manualLayout: layout } : t)),
    );
  };

  const toggleExpanded = (key: Exclude<AccountDetail, null>) => {
    setChartFocus(null);
    setExpandedDetail((d) => (d === key ? null : key));
  };

  if (!mounted) return null;

  const cashAccounts       = accounts.filter(a => a.type === 'depository');
  const creditAccounts     = accounts.filter(a => a.type === 'credit');
  const investmentAccounts = accounts.filter(a => a.type === 'investment');

  const totalCash        = cashAccounts.reduce((s, a) => s + (a.balances.current ?? 0), 0);
  const totalCredit      = creditAccounts.reduce((s, a) => s + (a.balances.current ?? 0), 0);
  const totalInvestments = investmentAccounts.reduce((s, a) => s + (a.balances.current ?? 0), 0);
  const netWorth         = totalCash + totalInvestments - totalCredit;
  const hasAccounts      = accounts.length > 0;

  const activeDashboardTab = dashboardTabs.find((t) => t.id === activeTab);

  const onChartBarDrillDown = (payload: NetWorthBarDrillPayload) => {
    const acc = accounts.find((a) => a.account_id === payload.accountId);
    setChartFocus({ accountId: payload.accountId });
    if (acc?.type === 'depository') setExpandedDetail('cash');
    else if (acc?.type === 'credit') setExpandedDetail('credit');
    else if (acc?.type === 'investment') setExpandedDetail('investments');
    requestAnimationFrame(() => {
      accountsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="relative min-h-screen bg-[#0A0C10] text-slate-300 overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div
          className="absolute left-1/2 top-[8%] h-[min(52vh,520px)] w-[min(96vw,780px)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(70,194,233,0.11)_0%,rgba(82,183,136,0.06)_40%,transparent_68%)] blur-3xl motion-reduce:animate-none animate-worthiq-glow-pulse"
        />
        <div
          className="absolute right-[-8%] top-[38%] h-[min(42vh,400px)] w-[min(70vw,480px)] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(82,183,136,0.08)_0%,transparent_62%)] blur-3xl motion-reduce:opacity-40 animate-worthiq-glow-pulse [animation-delay:2.75s]"
        />
      </div>

      <div className="relative z-10">
      {/* ── NAV DRAWER ── */}
      <NavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userEmail={userEmail}
        hasAccounts={hasAccounts}
        activePath="/dashboard"
      />

      {/* ── MANAGE VIEWS MODAL ── */}
      <ManageViewsModal
        open={manageViewsOpen}
        onClose={() => setManageViewsOpen(false)}
        tabs={dashboardTabs}
        defaultLandingTabId={preferredLandingTabId}
        onDefaultLandingTabSave={(id) => {
          try {
            localStorage.setItem(DASHBOARD_DEFAULT_TAB_KEY, id);
          } catch {
            /* ignore */
          }
          setPreferredLandingTabId(id);
        }}
        onChange={(updated) => {
          setDashboardTabs(updated as DashboardTab[]);
          const firstVisible = updated.find((t) => !t.hidden);
          if (firstVisible && (!activeTab || updated.find((t) => t.id === activeTab)?.hidden)) {
            setActiveTab(firstVisible.id);
          }
        }}
      />

      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-30 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-slate-800/90 bg-[#0A0C10]/88 backdrop-blur-md px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-1 justify-self-start">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-slate-400">Menu</span>
        </div>

        <div className="flex flex-col items-center justify-center text-center min-w-0 px-2">
          <WorthIQLogoNav
            className="h-8 w-auto sm:h-9 md:h-10"
            wrapperClassName={ringOffsetApp}
          />
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 sm:text-[11px] sm:tracking-[0.22em]">
            Master your capital with AI
          </p>
        </div>

        <div className="flex justify-end min-w-0 justify-self-end">
          {userEmail && (
            <span className="hidden sm:block text-[11px] font-semibold text-slate-600 truncate max-w-[min(200px,28vw)] text-right">
              {userEmail}
            </span>
          )}
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="mx-auto max-w-5xl px-4 py-6 lg:px-8 lg:py-10">

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-slate-600 font-mono text-sm animate-pulse">Loading financial data...</p>
          </div>
        ) : !hasAccounts ? (
          <EmptyState onConnect={() => navigate('/connect')} />
        ) : (
          <>
            {/* ── Dashboard views (tabs) — same row for Overview + all other views ── */}
            <div className="mb-6">
              <div className="mb-3 space-y-1">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">WorthIQ™ dashboard</h2>
                <p className="text-sm text-slate-500 max-w-2xl">
                  Overview is your default home (net worth, Sage, accounts). Switch tabs for Cashflow, Spending, Investments, or custom views. Drag to reorder; use Manage Views to hide tabs or choose which view opens first when you sign in.
                </p>
              </div>
              <div className="flex items-center gap-1 mb-0 border-b border-slate-800 pb-0 overflow-x-auto">
                {dashboardTabs.filter((t) => !t.hidden).map((tab) => (
                  <div
                    key={tab.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', tab.id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggingTabId(tab.id);
                    }}
                    onDragEnd={() => setDraggingTabId(null)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fromId = e.dataTransfer.getData('text/plain');
                      if (!fromId || fromId === tab.id) return;
                      setDashboardTabs((prev) => reorderVisibleDashboardTabs(prev, fromId, tab.id));
                    }}
                    className={`flex items-end shrink-0 mb-[-1px] rounded-t-lg transition-opacity ${
                      draggingTabId === tab.id ? 'opacity-45' : ''
                    }`}
                  >
                    <span
                      className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 p-1 pb-2.5 border-b-2 border-transparent select-none"
                      title="Drag to reorder"
                      aria-hidden
                    >
                      <GripVertical size={14} />
                    </span>
                    <TabButton
                      label={tab.title}
                      icon={
                        tab.variant === 'overview' ? (
                          <LayoutDashboard size={12} />
                        ) : tab.variant === 'cashflow' ? (
                          <BarChart2 size={12} />
                        ) : tab.variant === 'sage_widget' ? (
                          <Sparkles size={12} />
                        ) : tab.variant === 'manual' ? (
                          <LayoutGrid size={12} />
                        ) : tab.exampleKey === 'spending' ? (
                          <Receipt size={12} />
                        ) : (
                          <TrendingUp size={12} />
                        )
                      }
                      active={activeTab === tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      onClose={
                        tab.variant === 'cashflow' || tab.variant === 'overview'
                          ? undefined
                          : () => void removeTab(tab.id)
                      }
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setWidgetPreview(null);
                    setWidgetPrompt('');
                    setNewTabModal('choose');
                  }}
                  className="flex items-center gap-1 px-3 py-2.5 text-slate-600 hover:text-white transition-colors text-sm mb-[-1px] shrink-0"
                  title="New view tab"
                >
                  <Plus size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setManageViewsOpen(true)}
                  className="ml-auto flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:text-worthiq-cyan transition-colors shrink-0"
                >
                  <SlidersHorizontal size={13} />
                  <span className="hidden sm:inline">Manage Views</span>
                </button>
              </div>
            </div>

            {/* ── Overview: net worth, Sage, account tiles ── */}
            {activeDashboardTab?.variant === 'overview' && (
              <>
                <div className="mb-8">
                  <NetWorthChart
                    accounts={accounts}
                    transactions={transactions}
                    onBarSegmentClick={onChartBarDrillDown}
                  />
                </div>

                <SageDashboardInsights
                  insights={sageInsights}
                  loading={sageInsightsLoading}
                  error={sageInsightsError}
                  expanded={sageInsightsExpanded}
                  onExpand={() => setSageInsightsExpanded(true)}
                  onCollapse={() => setSageInsightsExpanded(false)}
                  onRequest={() => {
                    setSageInsightsExpanded(true);
                    void fetchSageInsights();
                  }}
                  onRefresh={() => void fetchSageInsights()}
                />

                <div ref={accountsSectionRef} className="scroll-mt-28 space-y-6 mb-10">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                <StatCard
                  label="Cash & Savings"
                  value={fmt(totalCash)}
                  sub={`${cashAccounts.length} account${cashAccounts.length !== 1 ? 's' : ''}`}
                  color="green"
                  onClick={() => toggleExpanded('cash')}
                  clickable={cashAccounts.length > 0}
                  expanded={expandedDetail === 'cash'}
                />
                <StatCard
                  label="Outstanding Credit"
                  value={fmt(totalCredit)}
                  sub={`${creditAccounts.length} card${creditAccounts.length !== 1 ? 's' : ''}`}
                  color="red"
                  onClick={() => toggleExpanded('credit')}
                  clickable={creditAccounts.length > 0}
                  expanded={expandedDetail === 'credit'}
                />
                <StatCard
                  label="Investments"
                  value={fmt(totalInvestments)}
                  sub={`${investmentAccounts.length} account${investmentAccounts.length !== 1 ? 's' : ''}`}
                  color="purple"
                  onClick={() => toggleExpanded('investments')}
                  clickable={investmentAccounts.length > 0}
                  expanded={expandedDetail === 'investments'}
                />
                <StatCard
                  label="Net Worth"
                  value={fmt(netWorth)}
                  sub="All linked depository, credit & investment"
                  color={netWorth >= 0 ? 'blue' : 'red'}
                />
                {investmentAccounts.length > 0 && (
                  <StatCard
                    label="Options & trades"
                    value={investmentTx.length.toLocaleString()}
                    sub="Brokerage legs (est.)"
                    color="yellow"
                    onClick={() => toggleExpanded('options')}
                    clickable
                    expanded={expandedDetail === 'options'}
                  />
                )}
              </div>

              {expandedDetail === 'cash' && cashAccounts.length > 0 && (
                <Section title="Cash & Checking" icon={<Wallet size={15} />} color="green">
                  <AccountGrid
                    accounts={cashAccounts}
                    highlightAccountId={chartFocus?.accountId}
                    highlightInstitution={chartFocus?.institution}
                  />
                </Section>
              )}
              {expandedDetail === 'credit' && creditAccounts.length > 0 && (
                <Section title="Credit Cards" icon={<CreditCard size={15} />} color="red">
                  <AccountGrid
                    accounts={creditAccounts}
                    showUtilization
                    highlightAccountId={chartFocus?.accountId}
                    highlightInstitution={chartFocus?.institution}
                  />
                </Section>
              )}
              {expandedDetail === 'investments' && investmentAccounts.length > 0 && (
                <Section title="Investments" icon={<TrendingUp size={15} />} color="purple">
                  <AccountGrid
                    accounts={investmentAccounts}
                    highlightAccountId={chartFocus?.accountId}
                    highlightInstitution={chartFocus?.institution}
                  />
                </Section>
              )}
              {expandedDetail === 'options' && (
                <Section title="Options & Trades" icon={<BarChart2 size={15} />} color="yellow">
                  {investmentAccounts.length === 0 ? (
                    <InfoBanner color="yellow">
                      Connect a brokerage account (e.g. Robinhood, TD Ameritrade) to track your options positions and trade history.
                    </InfoBanner>
                  ) : investmentTx.length === 0 ? (
                    <InfoBanner color="blue">
                      No investment transactions found for the past year. Options and trade activity will appear here once available.
                    </InfoBanner>
                  ) : (
                    <div className="space-y-8">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mr-1">Show</span>
                        {([
                          ['all', 'All trades'] as const,
                          ['options_only', 'Options only'] as const,
                          ['non_options', 'Stocks & other'] as const,
                        ]).map(([k, label]) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setOptionsInstrumentFilter(k)}
                            className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-colors ${
                              optionsInstrumentFilter === k
                                ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400'
                                : 'border-slate-700 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {filteredOptionsTx.length === 0 ? (
                        <InfoBanner color="blue">
                          No trades match this filter. Try &ldquo;All trades&rdquo; or connect more accounts.
                        </InfoBanner>
                      ) : (
                        <>
                          <OptionsInsightsPanel transactions={filteredOptionsTx} securities={securities} />
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                              Recent activity
                            </p>
                            <InvestmentTxTable transactions={filteredOptionsTx} securities={securities} />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </Section>
              )}
            </div>
              </>
            )}

            {/* ── Other views (not Overview) ── */}
            {activeDashboardTab?.variant !== 'overview' && (
            <div className="border-t border-slate-800 pt-8">
              {/* Cashflow tab */}
              {activeDashboardTab?.variant === 'cashflow' && (
                <div>
                  <CashflowView transactions={transactions} classifications={classifications} />
                </div>
              )}

              {dashboardTabs.length === 0 && (
                <div className="mb-8 rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center text-slate-500 text-sm">
                  No view tabs yet. Use <span className="text-slate-400">+</span> to build one with Sage or the manual pivot builder.
                </div>
              )}

              {activeDashboardTab?.variant === 'example' && activeDashboardTab.exampleKey === 'spending' && (
                <div className="max-w-xl mb-8">
                  <p className="text-sm text-slate-500 mb-4 max-w-2xl">
                    Example: spending rolled up by category (Sage labels when available). Delete this tab anytime or add your own chart via{' '}
                    <span className="text-purple-400">+</span>.
                  </p>
                  <WidgetCard widget={EXAMPLE_SPENDING_WIDGET} data={finData} />
                </div>
              )}

              {activeDashboardTab?.variant === 'example' && activeDashboardTab.exampleKey === 'investments' && (
                <div className="mb-8 space-y-6">
                  <p className="text-sm text-slate-500 max-w-2xl">
                    Example: brokerage activity, options vs stock legs, and recent trades — same data as the &ldquo;Options & trades&rdquo; section on the Overview tab.
                  </p>
                  {investmentAccounts.length === 0 ? (
                    <InfoBanner color="yellow">Connect a brokerage to see investment activity here.</InfoBanner>
                  ) : investmentTx.length === 0 ? (
                    <InfoBanner color="blue">No investment transactions in range yet.</InfoBanner>
                  ) : (
                    <div className="space-y-8">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mr-1">Show</span>
                        {([
                          ['all', 'All trades'] as const,
                          ['options_only', 'Options only'] as const,
                          ['non_options', 'Stocks & other'] as const,
                        ]).map(([k, label]) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setOptionsInstrumentFilter(k)}
                            className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-colors ${
                              optionsInstrumentFilter === k
                                ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400'
                                : 'border-slate-700 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {filteredOptionsTx.length === 0 ? (
                        <InfoBanner color="blue">No trades match this filter.</InfoBanner>
                      ) : (
                        <>
                          <OptionsInsightsPanel transactions={filteredOptionsTx} securities={securities} />
                          <InvestmentTxTable transactions={filteredOptionsTx} securities={securities} />
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeDashboardTab?.variant === 'sage_widget' && activeDashboardTab.widgetId && (
                <div className="max-w-xl mb-8">
                  {(() => {
                    const w = widgets.find((x) => x.id === activeDashboardTab.widgetId);
                    if (!w) {
                      return (
                        <InfoBanner color="blue">
                          This chart is no longer available. Remove the tab or build a new one with Sage.
                        </InfoBanner>
                      );
                    }
                    return (
                      <WidgetCard
                        widget={w}
                        data={finData}
                        onDelete={() => void removeTab(activeDashboardTab.id)}
                      />
                    );
                  })()}
                </div>
              )}

              {activeDashboardTab?.variant === 'manual' && (
                <ManualTabBuilder
                  tabTitle={activeDashboardTab.title}
                  layout={activeDashboardTab.manualLayout ?? EMPTY_MANUAL_LAYOUT}
                  onLayoutChange={(layout) => updateManualLayout(activeDashboardTab.id, layout)}
                />
              )}
            </div>
            )}

            {/* New tab: Sage vs manual — portal to body so fixed overlay isn’t tied to <main overflow-auto> */}
            {mounted &&
              newTabModal !== 'closed' &&
              createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                  <div
                    ref={newTabModalRef}
                    className="w-full max-w-lg max-h-[min(90vh,880px)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-700 bg-[#11141B] shadow-2xl p-6 space-y-5"
                  >
                  {newTabModal === 'choose' && (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-bold text-white">New view tab</h3>
                        <button
                          type="button"
                          onClick={() => setNewTabModal('closed')}
                          className="text-slate-500 hover:text-white p-1"
                          aria-label="Close"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <p className="text-sm text-slate-400">
                        How do you want to build this view? Sage turns a short description into a chart; manual gives you a pivot-style layout to arrange yourself.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setNewTabModal('sage')}
                          className="flex flex-col items-start gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 p-4 text-left hover:bg-purple-500/15 transition-colors"
                        >
                          <Sparkles size={20} className="text-purple-400" />
                          <span className="font-bold text-white">Build with Sage</span>
                          <span className="text-xs text-slate-400">Describe the chart; we generate it and attach it to this tab.</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewTabModal('manual')}
                          className="flex flex-col items-start gap-2 rounded-xl border border-slate-600 bg-slate-800/40 p-4 text-left hover:bg-slate-800/70 transition-colors"
                        >
                          <LayoutGrid size={20} className="text-slate-300" />
                          <span className="font-bold text-white">Build manually</span>
                          <span className="text-xs text-slate-400">Drag fields into rows, columns, and values to create pivots (early preview).</span>
                        </button>
                      </div>
                    </>
                  )}

                  {newTabModal === 'sage' && (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Sparkles size={18} className="text-purple-400" /> Sage
                        </h3>
                        <button
                          type="button"
                          onClick={() => setNewTabModal('choose')}
                          className="text-xs text-slate-500 hover:text-slate-300"
                        >
                          Back
                        </button>
                      </div>
                      <p className="text-sm text-slate-400">Describe what you want on this tab. We will save it as its own chart when you confirm.</p>
                      <div className="flex gap-2">
                        <input
                          value={widgetPrompt}
                          onChange={(e) => setWidgetPrompt(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !widgetCreating && askSageWidget()}
                          placeholder='e.g. "pie of spending by Sage category last 90d"'
                          className="input-auth flex-1 min-w-0 py-2.5 text-sm focus:border-purple-500 focus:ring-purple-500/35"
                        />
                        <button
                          type="button"
                          onClick={() => askSageWidget()}
                          disabled={widgetCreating || !widgetPrompt.trim()}
                          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shrink-0"
                        >
                          {widgetCreating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                          {widgetCreating ? 'Building...' : 'Build'}
                        </button>
                      </div>
                      {widgetPreview && (
                        <div className="border border-purple-500/40 rounded-xl p-4 bg-purple-500/5 space-y-3">
                          <p className="text-[11px] text-purple-400 font-bold uppercase tracking-widest">Preview</p>
                          <div className="max-w-sm">
                            <WidgetCard widget={{ id: 'preview', ...widgetPreview }} data={finData} />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => saveWidgetAsNewTab(widgetPreview)}
                              className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-xl"
                            >
                              Add as new tab
                            </button>
                            <button
                              type="button"
                              onClick={() => setWidgetPreview(null)}
                              className="text-slate-500 hover:text-white text-sm px-4 py-2"
                            >
                              Discard
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {newTabModal === 'manual' && (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <LayoutGrid size={18} className="text-slate-300" /> Manual tab
                        </h3>
                        <button
                          type="button"
                          onClick={() => setNewTabModal('choose')}
                          className="text-xs text-slate-500 hover:text-slate-300"
                        >
                          Back
                        </button>
                      </div>
                      <p className="text-sm text-slate-400">Name your tab, then arrange dimensions and measures in the builder.</p>
                      <input
                        value={manualTabTitle}
                        onChange={(e) => setManualTabTitle(e.target.value)}
                        placeholder="Tab name (e.g. Q1 cash flow)"
                        className="input-auth w-full py-2.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => addManualTab()}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold py-2.5 rounded-xl"
                      >
                        Create tab
                      </button>
                    </>
                  )}
                  </div>
                </div>,
                document.body,
              )}
          </>
        )}
      </main>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const PIVOT_DND_PREFIX = 'worthiq:pivot:';
const PALETTE_FIELDS = ['Date', 'Merchant', 'Category', 'Amount', 'Account', 'Ticker'] as const;

type PivotDragPayload = { field: string; from?: { zone: PivotZone; index: number } };

function encodePivotDrag(p: PivotDragPayload): string {
  return PIVOT_DND_PREFIX + JSON.stringify(p);
}

function decodePivotDrag(dt: DataTransfer): PivotDragPayload | null {
  const text = dt.getData('text/plain');
  if (!text.startsWith(PIVOT_DND_PREFIX)) return null;
  try {
    const o = JSON.parse(text.slice(PIVOT_DND_PREFIX.length)) as PivotDragPayload;
    if (typeof o.field === 'string') return o;
  } catch {
    return null;
  }
  return null;
}

function applyPivotDrop(
  layout: ManualPivotLayout,
  target: PivotZone,
  field: string,
  from: { zone: PivotZone; index: number } | null,
): ManualPivotLayout {
  const next: ManualPivotLayout = {
    filters: [...layout.filters],
    rows: [...layout.rows],
    columns: [...layout.columns],
    values: [...layout.values],
  };

  if (from) {
    const src = next[from.zone];
    if (from.index < 0 || from.index >= src.length || src[from.index] !== field) return layout;
    src.splice(from.index, 1);
  }

  if (next[target].includes(field)) return layout;

  next[target].push(field);
  return next;
}

function removePivotField(layout: ManualPivotLayout, zone: PivotZone, index: number): ManualPivotLayout {
  const next: ManualPivotLayout = {
    filters: [...layout.filters],
    rows: [...layout.rows],
    columns: [...layout.columns],
    values: [...layout.values],
  };
  next[zone].splice(index, 1);
  return next;
}

function ManualTabBuilder({
  tabTitle,
  layout,
  onLayoutChange,
}: {
  tabTitle: string;
  layout: ManualPivotLayout;
  onLayoutChange: (layout: ManualPivotLayout) => void;
}) {
  const [overZone, setOverZone] = useState<PivotZone | null>(null);

  const onDragOverZone = (e: React.DragEvent, zone: PivotZone) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = decodePivotDrag(e.dataTransfer)?.from ? 'move' : 'copy';
    setOverZone(zone);
  };

  const onDragLeaveZone = (e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    const rel = e.relatedTarget as Node | null;
    if (rel && el.contains(rel)) return;
    setOverZone(null);
  };

  const onDropZone = (e: React.DragEvent, zone: PivotZone) => {
    e.preventDefault();
    setOverZone(null);
    const payload = decodePivotDrag(e.dataTransfer);
    if (!payload) return;
    const from = payload.from ?? null;
    const next = applyPivotDrop(layout, zone, payload.field, from);
    onLayoutChange(next);
  };

  const startPaletteDrag = (e: React.DragEvent, field: string) => {
    e.dataTransfer.setData('text/plain', encodePivotDrag({ field }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const startShelfDrag = (e: React.DragEvent, field: string, zone: PivotZone, index: number) => {
    e.dataTransfer.setData('text/plain', encodePivotDrag({ field, from: { zone, index } }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const zoneMeta: { zone: PivotZone; label: string; hint: string }[] = [
    { zone: 'filters', label: 'Filters', hint: 'Narrow the dataset (e.g. Category, Account).' },
    { zone: 'rows', label: 'Rows', hint: 'Down the left side of the pivot.' },
    { zone: 'columns', label: 'Columns', hint: 'Across the top.' },
    { zone: 'values', label: 'Values', hint: 'What to aggregate (e.g. Amount).' },
  ];

  return (
    <div className="space-y-6 mb-8 max-w-4xl" onDragEnd={() => setOverZone(null)}>
      <p className="text-sm text-slate-400">
        Manual builder for <span className="text-white font-semibold">{tabTitle}</span>. Drag fields into Filters, Rows, Columns, or Values. Layout is saved on this tab. Remove a chip with × or drag it to another zone.
      </p>

      <div className="rounded-xl border border-slate-800 bg-[#11141B] p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Field list</p>
        <div className="flex flex-wrap gap-2">
          {PALETTE_FIELDS.map((f) => (
            <span
              key={f}
              draggable
              onDragStart={(e) => startPaletteDrag(e, f)}
              className="cursor-grab active:cursor-grabbing text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500 select-none"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {zoneMeta.map(({ zone, label, hint }) => (
          <div
            key={zone}
            onDragOver={(e) => onDragOverZone(e, zone)}
            onDragLeave={onDragLeaveZone}
            onDrop={(e) => onDropZone(e, zone)}
            className={`rounded-xl border border-dashed p-4 min-h-[88px] transition-colors ${
              overZone === zone
                ? 'border-cyan-500/70 bg-cyan-500/10'
                : 'border-slate-600 bg-[#0D1117]/80 hover:border-slate-500'
            }`}
          >
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
              <p className="text-[11px] text-slate-600 text-right">{hint}</p>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[36px]">
              {layout[zone].length === 0 ? (
                <span className="text-xs text-slate-600 italic">Drop fields here</span>
              ) : (
                layout[zone].map((field, index) => (
                  <span
                    key={`${zone}-${field}-${index}`}
                    draggable
                    onDragStart={(e) => startShelfDrag(e, field, zone, index)}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-600 cursor-grab active:cursor-grabbing select-none"
                  >
                    {field}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLayoutChange(removePivotField(layout, zone, index));
                      }}
                      className="ml-0.5 text-slate-500 hover:text-red-400 p-0.5 rounded"
                      aria-label={`Remove ${field}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Cashflow View ─────────────────────────────────────────────────────────────

function CashflowView({ transactions, classifications }: { transactions: any[]; classifications: Record<string, any> }) {
  const fmtC = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n));

  const monthlyData = useMemo(() => {
    const map = new Map<string, { income: number; expenses: number }>();
    for (const tx of transactions) {
      if (!tx.date) continue;
      const key = tx.date.slice(0, 7); // "YYYY-MM"
      if (!map.has(key)) map.set(key, { income: 0, expenses: 0 });
      const bucket = map.get(key)!;
      // Plaid: negative = inflow (income/deposit), positive = outflow (expense)
      if (tx.amount < 0) bucket.income += Math.abs(tx.amount);
      else bucket.expenses += tx.amount;
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // last 12 months
      .map(([key, val]) => ({
        month: new Date(key + '-02').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        income: Math.round(val.income),
        expenses: Math.round(val.expenses),
        net: Math.round(val.income - val.expenses),
      }));
  }, [transactions]);

  const totals = monthlyData.reduce(
    (acc, m) => ({ income: acc.income + m.income, expenses: acc.expenses + m.expenses }),
    { income: 0, expenses: 0 },
  );
  const netCashflow = totals.income - totals.expenses;

  if (monthlyData.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-500 text-sm">
        Connect a bank account with transaction history to see your cashflow.
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#11141B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Income</p>
          <p className="text-2xl font-black text-emerald-400">{fmtC(totals.income)}</p>
          <p className="text-xs text-slate-600 mt-1">Last 12 months</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#11141B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Expenses</p>
          <p className="text-2xl font-black text-red-400">{fmtC(totals.expenses)}</p>
          <p className="text-xs text-slate-600 mt-1">Last 12 months</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#11141B] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Net Cashflow</p>
          <div className="flex items-center gap-1.5">
            {netCashflow >= 0
              ? <ArrowUpRight size={16} className="text-emerald-400" />
              : <ArrowDownRight size={16} className="text-red-400" />}
            <p className={`text-2xl font-black ${netCashflow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {fmtC(netCashflow)}
            </p>
          </div>
          <p className="text-xs text-slate-600 mt-1">Last 12 months</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="rounded-2xl border border-slate-800 bg-[#0D1017] p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Monthly Income vs Expenses</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#475569', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                width={44}
              />
              <RechartTooltip
                contentStyle={{ background: '#0D1017', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8', fontWeight: 700 }}
                formatter={(value, name) => [
                  fmtC(typeof value === 'number' ? value : 0),
                  name === 'income' ? 'Income' : 'Expenses',
                ]}
              />
              <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v === 'income' ? 'Income' : 'Expenses'}</span>} />
              <Bar dataKey="income" fill="#4ade80" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="expenses" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function SageDashboardInsights({
  insights,
  loading,
  error,
  expanded,
  onExpand,
  onCollapse,
  onRequest,
  onRefresh,
}: {
  insights: string[] | null;
  loading: boolean;
  error: string | null;
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onRequest: () => void;
  onRefresh: () => void;
}) {
  const hasInsights = insights && insights.length > 0;

  return (
    <div className="mb-8 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/[0.05] to-transparent p-4 sm:p-5">
      {!expanded && !hasInsights && !loading && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <Sparkles size={18} className="text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-200">Sage AI insights</p>
              <p className="text-[12px] text-slate-500 mt-0.5 max-w-xl">
                Optional: generate a short, personalized read on your balances and activity. Nothing is sent until you ask.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRequest}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600/90 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-500 sm:shrink-0"
          >
            <Sparkles size={16} />
            Get Sage insights
          </button>
        </div>
      )}

      {!expanded && hasInsights && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">
            Sage insights ready ({insights!.length} notes).{' '}
            <button
              type="button"
              onClick={onExpand}
              className="font-semibold text-purple-400 hover:text-purple-300"
            >
              Show
            </button>
          </p>
          <button
            type="button"
            onClick={() => void onRefresh()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 transition hover:border-purple-500/40 hover:text-purple-300 disabled:opacity-40"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      )}

      {expanded && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-purple-400 shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-white">Sage insights</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Generated from your linked data when you request it
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void onRefresh()}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 transition hover:border-purple-500/40 hover:text-purple-300 disabled:opacity-40"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                type="button"
                onClick={onCollapse}
                className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 transition hover:border-slate-600 hover:text-white"
              >
                <ChevronUp size={14} />
                Collapse
              </button>
            </div>
          </div>

          {loading && !insights?.length && (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
              <Loader2 size={16} className="animate-spin text-purple-400" />
              Generating insights…
            </div>
          )}

          {error && <p className="text-sm text-amber-400/90 py-2">{error}</p>}

          {!loading && !error && insights && insights.length === 0 && (
            <p className="text-sm text-slate-500 py-2">No insights returned. Try Refresh.</p>
          )}

          {insights && insights.length > 0 && (
            <ul className="space-y-3 pt-1">
              {insights.map((line, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-sm text-slate-300 leading-relaxed border-l-2 border-purple-500/35 pl-4"
                >
                  <span className="text-purple-400/80 font-mono text-xs shrink-0 w-5 pt-0.5">{i + 1}</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function TabButton({
  label, icon, active, onClick, onClose,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  onClose?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 cursor-pointer whitespace-nowrap transition-all shrink-0 mb-[-1px] ${
        active
          ? 'border-worthiq-cyan text-white'
          : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'
      }`}
    >
      <span className={active ? 'text-worthiq-cyan' : 'text-slate-600 group-hover:text-slate-400'}>{icon}</span>
      {label}
      {onClose && (
        <button
          onClick={e => { e.stopPropagation(); onClose(); }}
          className="ml-0.5 text-slate-700 hover:text-red-400 transition-colors"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}

function NavItem({
  icon, label, active, onClick,
}: {
  icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
        active ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-white'
      }`}
    >
      {icon}
      <span className="hidden lg:block font-semibold text-sm">{label}</span>
    </div>
  );
}

function Section({
  title, icon, color, children,
}: {
  title: string; icon: React.ReactNode; color: 'blue' | 'green' | 'red' | 'purple' | 'yellow'; children: React.ReactNode;
}) {
  const colors = { blue: 'text-blue-400', green: 'text-green-400', red: 'text-red-400', purple: 'text-purple-400', yellow: 'text-yellow-400' };
  return (
    <div>
      <div className={`flex items-center gap-2 mb-4 ${colors[color]}`}>
        {icon}
        <h2 className="text-[11px] font-bold uppercase tracking-widest">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatCard({
  label, value, sub, color, onClick, clickable, expanded,
}: {
  label: string; value: string; sub?: string; color: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
  onClick?: () => void; clickable?: boolean; expanded?: boolean;
}) {
  const colors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
    yellow: 'text-yellow-400',
  };
  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`bg-[#11141B] border rounded-xl p-5 transition-all ${
        expanded ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-slate-800'
      } ${clickable ? 'cursor-pointer hover:border-slate-600 hover:bg-[#151920] group' : ''}`}
    >
      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-2xl font-black tabular-nums ${colors[color]}`}>{value}</p>
      {sub && (
        <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
          {sub}
          {clickable && <span className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-700">→</span>}
        </p>
      )}
    </div>
  );
}

function AccountGrid({
  accounts,
  showUtilization,
  highlightAccountId,
  highlightInstitution,
}: {
  accounts: any[];
  showUtilization?: boolean;
  highlightAccountId?: string;
  highlightInstitution?: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {accounts.map((acc, i) => {
        const current = acc.balances.current ?? 0;
        const limit   = acc.balances.limit ?? 0;
        const utilPct = showUtilization && limit > 0 ? Math.min(Math.round((current / limit) * 100), 100) : null;
        const instKey = acc.institution?.trim() || 'Other';
        const highlighted =
          (highlightAccountId && acc.account_id === highlightAccountId) ||
          (!!highlightInstitution && instKey === highlightInstitution);
        return (
          <div
            key={acc.account_id ?? i}
            className={`bg-[#11141B] border rounded-xl p-5 transition-shadow ${
              highlighted
                ? 'border-worthiq-cyan/70 ring-2 ring-worthiq-cyan/35 shadow-[0_0_24px_-4px_rgba(70,194,233,0.35)]'
                : 'border-slate-800'
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider truncate">
                  {acc.institution ?? acc.subtype}
                </p>
                <p className="font-bold text-white text-sm mt-0.5 truncate">{acc.name}</p>
                {acc.mask && <p className="text-[11px] text-slate-600">•••• {acc.mask}</p>}
              </div>
              <p className="font-mono font-black text-white text-lg shrink-0">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(current)}
              </p>
            </div>
            {utilPct !== null && (
              <div className="mt-3">
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${utilPct > 80 ? 'bg-red-500' : utilPct > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${utilPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-600 mt-1.5">
                  {utilPct}% of {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(limit)} limit
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function OptionsInsightsPanel({
  transactions,
  securities,
}: {
  transactions: any[];
  securities: any[];
}) {
  const secMap = new Map(securities.map((s) => [s.security_id, s]));
  const fmtN = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  let optionTrades = 0;
  let stockEtfTrades = 0;
  let buyCount = 0;
  let sellCount = 0;
  const tickerAgg = new Map<string, { trades: number; notional: number }>();
  let netCash = 0;

  for (const tx of transactions) {
    const sec = secMap.get(tx.security_id);
    const t = (tx.type || '').toLowerCase();
    const opt = isOptionsLeg(tx, sec);
    if (opt) optionTrades += 1;
    else stockEtfTrades += 1;
    if (t === 'buy') buyCount += 1;
    if (t === 'sell') sellCount += 1;
    netCash += Number(tx.amount) || 0;
    const sym = sec?.ticker_symbol || 'Other';
    const cur = tickerAgg.get(sym) || { trades: 0, notional: 0 };
    cur.trades += 1;
    cur.notional += Math.abs(Number(tx.amount) || 0);
    tickerAgg.set(sym, cur);
  }

  const topTickers = Array.from(tickerAgg.entries())
    .sort((a, b) => b[1].trades - a[1].trades)
    .slice(0, 6);

  const uniqueTickers = tickerAgg.size;

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
        Snapshot of your linked brokerage activity (last year). Options-heavy flows are highlighted; figures are from
        Plaid and are informational only — not tax or investment advice.
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#11141B] border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Total trades</p>
          <p className="text-2xl font-black text-white tabular-nums">{transactions.length}</p>
          <p className="text-[11px] text-slate-600 mt-1">{uniqueTickers} symbols touched</p>
        </div>
        <div className="bg-[#11141B] border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Options vs other</p>
          <p className="text-2xl font-black text-yellow-400 tabular-nums">{optionTrades}</p>
          <p className="text-[11px] text-slate-600 mt-1">{stockEtfTrades} stock / ETF legs</p>
        </div>
        <div className="bg-[#11141B] border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Buys · sells</p>
          <p className="text-lg font-black text-white tabular-nums">
            <span className="text-green-400">{buyCount}</span>
            <span className="text-slate-600 mx-1">/</span>
            <span className="text-red-400">{sellCount}</span>
          </p>
          <p className="text-[11px] text-slate-600 mt-1">By Plaid type field</p>
        </div>
        <div className="bg-[#11141B] border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Net cash flow</p>
          <p
            className={`text-2xl font-black tabular-nums ${
              netCash < 0 ? 'text-green-400' : netCash > 0 ? 'text-red-300' : 'text-slate-400'
            }`}
          >
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
              netCash,
            )}
          </p>
          <p className="text-[11px] text-slate-600 mt-1">Sum of signed Plaid amounts</p>
        </div>
      </div>
      {topTickers.length > 0 && (
        <div className="bg-[#11141B] border border-slate-800 rounded-xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Most active symbols</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topTickers.map(([sym, v]) => (
              <div key={sym} className="flex items-center justify-between gap-3 rounded-lg bg-[#0D1117] border border-slate-800/80 px-3 py-2.5">
                <span className="font-mono font-bold text-white text-sm">{sym}</span>
                <div className="text-right text-[11px] text-slate-500">
                  <span className="text-slate-300 font-mono">{v.trades}</span> trades
                  <span className="text-slate-600 mx-1">·</span>
                  <span className="text-slate-400 font-mono">{fmtN(v.notional)}</span> notional
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBanner({ color, children }: { color: 'blue' | 'yellow'; children: React.ReactNode }) {
  const styles = { blue: 'bg-blue-500/5 border-blue-500/20 text-blue-400', yellow: 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400' };
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${styles[color]}`}>
      <AlertCircle size={15} className="shrink-0 mt-0.5" />
      <p className="text-sm text-slate-400">{children}</p>
    </div>
  );
}

function InvestmentTxTable({ transactions, securities }: { transactions: any[]; securities: any[] }) {
  const secMap = new Map(securities.map(s => [s.security_id, s]));
  const fmt2 = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(n));
  return (
    <div className="bg-[#0D1117] border border-slate-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              {['Date', 'Security', 'Type', 'Quantity', 'Price', 'Amount', 'Institution'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {transactions.slice(0, 50).map((tx, i) => {
              const sec = secMap.get(tx.security_id);
              const opt = isOptionsLeg(tx, sec);
              return (
                <tr key={tx.investment_transaction_id ?? i} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">{tx.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <p className="text-white font-medium text-sm">{sec?.ticker_symbol || sec?.name || '—'}</p>
                      {sec?.name && sec?.ticker_symbol && <p className="text-slate-600 text-[11px] truncate max-w-[140px]">{sec.name}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opt ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {tx.subtype || tx.type || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-xs">{tx.quantity ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-xs">{tx.price != null ? fmt2(tx.price) : '—'}</td>
                  <td className="px-4 py-3 font-mono font-bold text-xs whitespace-nowrap">
                    <span className={tx.amount < 0 ? 'text-green-400' : 'text-white'}>
                      {tx.amount < 0 ? '+' : '-'}{fmt2(tx.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{tx.institution || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {transactions.length > 50 && (
        <p className="text-center text-[11px] text-slate-600 py-3 border-t border-slate-800">
          Showing 50 of {transactions.length} — view all in Transactions
        </p>
      )}
    </div>
  );
}

function EmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-72 border-2 border-dashed border-slate-800 rounded-2xl">
      <Building2 size={40} className="text-slate-700 mb-4" />
      <p className="text-slate-400 font-bold mb-1">No accounts connected</p>
      <p className="text-slate-600 text-sm mb-6">Link your bank, credit card, or brokerage to get started.</p>
      <button type="button" onClick={() => onConnect()} className="btn-on-dark-inline">
        <Plus size={16} />
        Connect Bank Account
      </button>
    </div>
  );
}
