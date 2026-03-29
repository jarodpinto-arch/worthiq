"use client";
export const dynamic = "force-dynamic";
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet, CreditCard, TrendingUp, BarChart2,
  Settings, LayoutDashboard, Link, Plus, AlertCircle, Building2, LineChart, Receipt,
  Sparkles, Loader2, X, LogOut, LayoutGrid,
} from 'lucide-react';
import WidgetCard from '../../components/WidgetCard';
import { WorthIQLogoNav } from '../../components/WorthIQLogoNav';
import { markAppHeader, markSidebar, ringOffsetApp } from '../../lib/worthiq-logo-mark';
import { getApiBase } from '../../lib/api-base';
import { filterInvestmentTxByInstrumentKind, isOptionsLeg } from '../../lib/investment-instrument';
import { usePageTransition } from '../../components/PageTransitionProvider';

const DASHBOARD_TABS_KEY = 'worthiq_dashboard_tabs_v2';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

type AccountDetail = 'cash' | 'credit' | 'investments' | 'options' | null;

type DashboardTabVariant = 'example' | 'sage_widget' | 'manual';

interface DashboardTab {
  id: string;
  title: string;
  variant: DashboardTabVariant;
  exampleKey?: 'spending' | 'investments';
  widgetId?: string;
}

const DEFAULT_DASHBOARD_TABS: DashboardTab[] = [
  { id: 'ex-spending', title: 'Spending', variant: 'example', exampleKey: 'spending' },
  { id: 'ex-investments', title: 'Investments', variant: 'example', exampleKey: 'investments' },
];

const EXAMPLE_SPENDING_WIDGET = {
  id: 'inline-example-spending',
  type: 'bar' as const,
  title: 'Spending by category',
  config: { dataSource: 'transactions' as const, groupBy: 'category', limit: 8 },
};

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
  const [activeTab, setActiveTab] = useState<string>(DEFAULT_DASHBOARD_TABS[0].id);
  const [expandedDetail, setExpandedDetail] = useState<AccountDetail>(null);
  const [newTabModal, setNewTabModal] = useState<'closed' | 'choose' | 'sage' | 'manual'>('closed');
  const [manualTabTitle, setManualTabTitle] = useState('');
  const newTabModalRef = useRef<HTMLDivElement>(null);

  const [widgets, setWidgets] = useState<any[]>([]);
  const [widgetPrompt, setWidgetPrompt] = useState('');
  const [widgetCreating, setWidgetCreating] = useState(false);
  const [widgetPreview, setWidgetPreview] = useState<any | null>(null);
  const [optionsInstrumentFilter, setOptionsInstrumentFilter] = useState<'all' | 'options_only' | 'non_options'>('all');

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(DASHBOARD_TABS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDashboardTabs(parsed as DashboardTab[]);
          setActiveTab((parsed as DashboardTab[])[0].id);
        }
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

  const askSageWidget = async () => {
    if (!widgetPrompt.trim()) return;
    const authToken = localStorage.getItem('authToken');
    setWidgetCreating(true);
    setWidgetPreview(null);
    try {
      const secMapCtx = new Map(securities.map(s => [s.security_id, s]));
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

      const context = {
        netWorth: accounts.filter(a => a.type !== 'credit').reduce((s, a) => s + (a.balances.current ?? 0), 0)
                - accounts.filter(a => a.type === 'credit').reduce((s, a) => s + (a.balances.current ?? 0), 0),
        accountSummary: accounts.map(a => ({ name: a.name, type: a.type, balance: a.balances.current })),
        recentTxSample: transactions.slice(0, 10).map(t => ({
          name: t.merchant_name || t.name,
          amount: t.amount,
          date: t.date,
          sageCategory: classifications[t.transaction_id]?.userCategory || classifications[t.transaction_id]?.aiCategory || null,
        })),
        investmentTxCount: investmentTx.length,
        investmentTxByInstrumentKind: { optionLegs: investmentOptionLegs, nonOptionLegs: investmentNonOptionLegs },
        topSpendingSageCategories,
        topInvestmentSageCategories,
      };
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
    if (activeTab === tabId) setActiveTab(nextTabs[0]?.id ?? '');
  };

  const addManualTab = () => {
    const title = manualTabTitle.trim() || 'Custom view';
    const id = `tab-manual-${Date.now()}`;
    setDashboardTabs((prev) => [...prev, { id, title, variant: 'manual' }]);
    setActiveTab(id);
    setManualTabTitle('');
    setNewTabModal('closed');
  };

  const toggleExpanded = (key: Exclude<AccountDetail, null>) => {
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

  return (
    <div className="min-h-screen bg-[#0A0C10] text-slate-300 flex">
      {/* ── SIDEBAR ── */}
      <aside className="w-20 lg:w-64 border-r border-slate-800 flex flex-col items-center lg:items-start p-6 gap-8 shrink-0">
        <WorthIQLogoNav className={markSidebar} wrapperClassName={ringOffsetApp} />

        <nav className="flex-1 w-full space-y-1">
          <NavItem icon={<LayoutDashboard size={19} />} label="Dashboard" active />
          <NavItem icon={<LineChart size={19} />}       label="Views"        onClick={() => navigate('/views')} />
          <NavItem icon={<Receipt size={19} />}         label="Transactions" onClick={() => navigate('/transactions')} />
          <NavItem
            icon={<Link size={19} />}
            label={hasAccounts ? 'Manage Accounts' : 'Connect Bank'}
            onClick={() => navigate('/connect')}
          />
          <NavItem icon={<Settings size={19} />} label="Settings" onClick={() => navigate('/settings')} />
        </nav>

        <div className="w-full space-y-2">
          <p className="hidden lg:block text-[10px] text-slate-500 font-semibold uppercase tracking-widest truncate px-3">
            {userEmail}
          </p>
          <button
            onClick={() => { localStorage.removeItem('authToken'); router.push('/login'); }}
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-slate-500 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 hover:shadow-[0_0_16px_rgba(230,57,70,0.2)] active:scale-[0.98]"
          >
            <LogOut size={18} className="shrink-0" />
            <span className="hidden lg:block text-sm font-semibold">Log Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 p-6 lg:p-10 overflow-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <WorthIQLogoNav className={markAppHeader} wrapperClassName={ringOffsetApp} />
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-worthiq-cyan">
              Financial Intelligence
            </p>
          </div>
          {!loading && hasAccounts && (
            <div className="text-right">
              <p className="text-slate-600 text-[10px] font-mono uppercase tracking-widest mb-1">Net Worth</p>
              <p className={`text-4xl font-black tabular-nums ${netWorth >= 0 ? 'text-white' : 'text-red-400'}`}>
                {fmt(netWorth)}
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-slate-600 font-mono text-sm animate-pulse">Loading financial data...</p>
          </div>
        ) : !hasAccounts ? (
          <EmptyState onConnect={() => navigate('/connect')} />
        ) : (
          <>
            {/* ── Summary + expandable account detail ── */}
            <div className="space-y-6 mb-10">
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
                  sub="Total"
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
                  <AccountGrid accounts={cashAccounts} />
                </Section>
              )}
              {expandedDetail === 'credit' && creditAccounts.length > 0 && (
                <Section title="Credit Cards" icon={<CreditCard size={15} />} color="red">
                  <AccountGrid accounts={creditAccounts} showUtilization />
                </Section>
              )}
              {expandedDetail === 'investments' && investmentAccounts.length > 0 && (
                <Section title="Investments" icon={<TrendingUp size={15} />} color="purple">
                  <AccountGrid accounts={investmentAccounts} />
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

            {/* ── Custom view tabs (examples + Sage / manual) ── */}
            <div className="border-t border-slate-800 pt-8">
              <div className="flex items-center gap-2 mb-4 text-slate-400">
                <LayoutDashboard size={15} className="text-blue-400" />
                <h2 className="text-[11px] font-bold uppercase tracking-widest">Views</h2>
                <span className="text-slate-700 text-[10px] font-mono ml-1">· example tabs you can delete; add your own with Sage or manual builder</span>
              </div>

              <div className="flex items-center gap-1 mb-6 border-b border-slate-800 pb-0 overflow-x-auto">
                {dashboardTabs.map((tab) => (
                  <TabButton
                    key={tab.id}
                    label={tab.title}
                    icon={
                      tab.variant === 'sage_widget' ? (
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
                    onClose={() => void removeTab(tab.id)}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setWidgetPreview(null);
                    setWidgetPrompt('');
                    setNewTabModal('choose');
                  }}
                  className="flex items-center gap-1 px-3 py-2.5 text-slate-600 hover:text-white transition-colors rounded-t-lg text-sm mb-[-1px] shrink-0"
                  title="New view tab"
                >
                  <Plus size={15} />
                </button>
              </div>

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
                    Example: brokerage activity, options vs stock legs, and recent trades — same data as the expandable &ldquo;Options & trades&rdquo; summary above.
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
                <ManualTabBuilder tabTitle={activeDashboardTab.title} />
              )}
            </div>

            {/* New tab: Sage vs manual */}
            {newTabModal !== 'closed' && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <div
                  ref={newTabModalRef}
                  className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#11141B] shadow-2xl p-6 space-y-5"
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
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ManualTabBuilder({ tabTitle }: { tabTitle: string }) {
  return (
    <div className="space-y-6 mb-8 max-w-4xl">
      <p className="text-sm text-slate-400">
        Manual builder for <span className="text-white font-semibold">{tabTitle}</span>. Drag fields into the areas below to shape a pivot-style view. Drop targets and persistence will evolve in future releases.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          ['Rows', 'Dimensions down the side (e.g. date, merchant, category)'],
          ['Columns', 'Split across columns'],
          ['Values', 'Sum, average, or count of amounts'],
        ].map(([title, hint]) => (
          <div
            key={title}
            className="rounded-xl border border-dashed border-slate-600 bg-[#0D1117]/80 p-4 min-h-[120px] hover:border-slate-500 transition-colors"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{title}</p>
            <p className="text-xs text-slate-600">{hint}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-800 bg-[#11141B] p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Fields</p>
        <div className="flex flex-wrap gap-2">
          {['Date', 'Merchant', 'Category', 'Amount', 'Account', 'Ticker'].map((f) => (
            <span
              key={f}
              draggable
              className="cursor-grab active:cursor-grabbing text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
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
          ? 'border-blue-500 text-white'
          : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'
      }`}
    >
      <span className={active ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}>{icon}</span>
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

function AccountGrid({ accounts, showUtilization }: { accounts: any[]; showUtilization?: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {accounts.map((acc, i) => {
        const current = acc.balances.current ?? 0;
        const limit   = acc.balances.limit ?? 0;
        const utilPct = showUtilization && limit > 0 ? Math.min(Math.round((current / limit) * 100), 100) : null;
        return (
          <div key={acc.account_id ?? i} className="bg-[#11141B] border border-slate-800 rounded-xl p-5">
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
