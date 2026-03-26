"use client";
export const dynamic = "force-dynamic";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet, CreditCard, TrendingUp, BarChart2,
  Settings, LayoutDashboard, Link, Plus, AlertCircle, Building2, LineChart, Receipt,
  Sparkles, Loader2, X, ChevronDown,
} from 'lucide-react';
import WidgetCard from '../../components/WidgetCard';
import { WorthIQLogoNav } from '../../components/WorthIQLogoNav';
import { markAppHeader, markSidebar, ringOffsetApp } from '../../lib/worthiq-logo-mark';
import { getApiBase } from '../../lib/api-base';
const PINNED_KEY = 'worthiq_pinned_tabs';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const FIXED_TABS = ['overview', 'cash', 'credit', 'investments', 'options'] as const;
type FixedTab = typeof FIXED_TABS[number];

const TAB_META: Record<FixedTab, { label: string; icon: React.ReactNode }> = {
  overview:    { label: 'Overview',     icon: <LayoutDashboard size={13} /> },
  cash:        { label: 'Cash',         icon: <Wallet size={13} /> },
  credit:      { label: 'Credit',       icon: <CreditCard size={13} /> },
  investments: { label: 'Investments',  icon: <TrendingUp size={13} /> },
  options:     { label: 'Options',      icon: <BarChart2 size={13} /> },
};

export default function Dashboard() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [investmentTx, setInvestmentTx] = useState<any[]>([]);
  const [securities, setSecurities] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [pinnedWidgetIds, setPinnedWidgetIds] = useState<string[]>([]);
  const [showPinMenu, setShowPinMenu] = useState(false);
  const pinMenuRef = useRef<HTMLDivElement>(null);

  // Widget canvas state
  const [widgets, setWidgets] = useState<any[]>([]);
  const [widgetPrompt, setWidgetPrompt] = useState('');
  const [widgetCreating, setWidgetCreating] = useState(false);
  const [widgetPreview, setWidgetPreview] = useState<any | null>(null);
  const [widgetDragId, setWidgetDragId] = useState<string | null>(null);
  const widgetDragTarget = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const pinned = localStorage.getItem(PINNED_KEY);
      if (pinned) setPinnedWidgetIds(JSON.parse(pinned));
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

  // Close pin menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pinMenuRef.current && !pinMenuRef.current.contains(e.target as Node)) {
        setShowPinMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const togglePin = (widgetId: string) => {
    setPinnedWidgetIds(prev => {
      const next = prev.includes(widgetId) ? prev.filter(id => id !== widgetId) : [...prev, widgetId];
      localStorage.setItem(PINNED_KEY, JSON.stringify(next));
      return next;
    });
  };

  const finData = { accounts, transactions, investmentTx, securities, classifications };

  const askSageWidget = async () => {
    if (!widgetPrompt.trim()) return;
    const authToken = localStorage.getItem('authToken');
    setWidgetCreating(true);
    setWidgetPreview(null);
    try {
      const context = {
        netWorth: accounts.filter(a => a.type !== 'credit').reduce((s, a) => s + (a.balances.current ?? 0), 0)
                - accounts.filter(a => a.type === 'credit').reduce((s, a) => s + (a.balances.current ?? 0), 0),
        accountSummary: accounts.map(a => ({ name: a.name, type: a.type, balance: a.balances.current })),
        recentTxSample: transactions.slice(0, 10).map(t => ({ name: t.merchant_name || t.name, amount: t.amount, date: t.date })),
        investmentTxCount: investmentTx.length,
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

  const saveWidget = async (preview: any) => {
    const authToken = localStorage.getItem('authToken');
    try {
      const res = await fetch(`${getApiBase()}/widgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ type: preview.type, title: preview.title, config: preview.config }),
      });
      if (res.ok) {
        const data = await res.json();
        setWidgets(prev => [...prev, data.widget]);
        setWidgetPreview(null);
      }
    } catch {}
  };

  const deleteWidget = async (id: string) => {
    const authToken = localStorage.getItem('authToken');
    try {
      await fetch(`${getApiBase()}/widgets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setWidgets(prev => prev.filter(w => w.id !== id));
      setPinnedWidgetIds(prev => {
        const next = prev.filter(pid => pid !== id);
        localStorage.setItem(PINNED_KEY, JSON.stringify(next));
        if (activeTab === id) setActiveTab('overview');
        return next;
      });
    } catch {}
  };

  const onWidgetDragStart = (id: string) => { setWidgetDragId(id); };
  const onWidgetDragOver  = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    widgetDragTarget.current = id;
  };
  const onWidgetDragEnd = async () => {
    if (!widgetDragId || !widgetDragTarget.current || widgetDragId === widgetDragTarget.current) {
      setWidgetDragId(null);
      return;
    }
    const newOrder = [...widgets];
    const fromIdx = newOrder.findIndex(w => w.id === widgetDragId);
    const toIdx   = newOrder.findIndex(w => w.id === widgetDragTarget.current);
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);
    const withPositions = newOrder.map((w, i) => ({ ...w, position: i }));
    setWidgets(withPositions);
    setWidgetDragId(null);
    widgetDragTarget.current = null;
    const authToken = localStorage.getItem('authToken');
    try {
      await fetch(`${getApiBase()}/widgets/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ order: withPositions.map(w => ({ id: w.id, position: w.position })) }),
      });
    } catch {}
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

  const pinnedWidgets = widgets.filter(w => pinnedWidgetIds.includes(w.id));
  const unpinnedWidgets = widgets.filter(w => !pinnedWidgetIds.includes(w.id));

  // All visible tabs: fixed + pinned widget tabs
  const visibleFixedTabs = FIXED_TABS.filter(key => {
    if (key === 'cash' && cashAccounts.length === 0) return false;
    if (key === 'credit' && creditAccounts.length === 0) return false;
    if (key === 'investments' && investmentAccounts.length === 0) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0A0C10] text-slate-300 flex">
      {/* ── SIDEBAR ── */}
      <aside className="w-20 lg:w-64 border-r border-slate-800 flex flex-col items-center lg:items-start p-6 gap-8 shrink-0">
        <WorthIQLogoNav className={markSidebar} wrapperClassName={ringOffsetApp} />

        <nav className="flex-1 w-full space-y-1">
          <NavItem icon={<LayoutDashboard size={19} />} label="Dashboard" active />
          <NavItem icon={<LineChart size={19} />}       label="Views"        onClick={() => router.push('/views')} />
          <NavItem icon={<Receipt size={19} />}         label="Transactions" onClick={() => router.push('/transactions')} />
          <NavItem
            icon={<Link size={19} />}
            label={hasAccounts ? 'Manage Accounts' : 'Connect Bank'}
            onClick={() => router.push('/connect')}
          />
          <NavItem icon={<Settings size={19} />} label="Settings" />
        </nav>

        <div className="w-full space-y-1">
          <p className="hidden lg:block text-[10px] text-slate-700 font-mono uppercase tracking-widest truncate px-3">
            {userEmail}
          </p>
          <div
            onClick={() => { localStorage.removeItem('authToken'); router.push('/login'); }}
            className="flex items-center gap-3 text-slate-700 hover:text-red-400 px-3 py-2 rounded-xl cursor-pointer transition-colors text-xs font-mono"
          >
            <span className="hidden lg:block">[LOGOUT]</span>
          </div>
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
          <EmptyState onConnect={() => router.push('/connect')} />
        ) : (
          <>
            {/* ── TAB BAR ── */}
            <div className="flex items-center gap-1 mb-8 border-b border-slate-800 pb-0 overflow-x-auto">
              {/* Fixed tabs */}
              {visibleFixedTabs.map(key => (
                <TabButton
                  key={key}
                  label={TAB_META[key].label}
                  icon={TAB_META[key].icon}
                  active={activeTab === key}
                  onClick={() => setActiveTab(key)}
                />
              ))}

              {/* Pinned widget tabs */}
              {pinnedWidgets.map(w => (
                <TabButton
                  key={w.id}
                  label={w.title}
                  icon={<Sparkles size={12} />}
                  active={activeTab === w.id}
                  onClick={() => setActiveTab(w.id)}
                  onClose={() => {
                    togglePin(w.id);
                    if (activeTab === w.id) setActiveTab('overview');
                  }}
                />
              ))}

              {/* + button to pin widgets as tabs */}
              <div className="relative ml-1 shrink-0" ref={pinMenuRef}>
                <button
                  onClick={() => setShowPinMenu(v => !v)}
                  className="flex items-center gap-1 px-3 py-2.5 text-slate-600 hover:text-white transition-colors rounded-t-lg text-sm mb-[-1px]"
                  title="Add custom tab"
                >
                  <Plus size={15} />
                </button>

                {showPinMenu && (
                  <div className="absolute left-0 top-10 z-50 bg-[#11141B] border border-slate-700 rounded-xl p-2 w-60 shadow-2xl">
                    <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest px-2 py-1.5">
                      Pin widget as tab
                    </p>
                    {widgets.length === 0 ? (
                      <p className="text-slate-500 text-xs px-2 py-2">
                        No widgets yet — ask Sage to create one below.
                      </p>
                    ) : (
                      <div className="space-y-0.5">
                        {widgets.map(w => (
                          <button
                            key={w.id}
                            onClick={() => {
                              togglePin(w.id);
                              if (!pinnedWidgetIds.includes(w.id)) setActiveTab(w.id);
                              setShowPinMenu(false);
                            }}
                            className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-slate-800 text-sm text-slate-300 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Sparkles size={12} className="text-purple-400 shrink-0" />
                              <span className="truncate">{w.title}</span>
                            </div>
                            <span className={`text-[10px] font-bold ml-2 shrink-0 ${pinnedWidgetIds.includes(w.id) ? 'text-blue-400' : 'text-slate-600'}`}>
                              {pinnedWidgetIds.includes(w.id) ? 'pinned' : 'pin'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── TAB CONTENT ── */}
            <div className="mb-12">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      label="Cash & Savings"
                      value={fmt(totalCash)}
                      sub={`${cashAccounts.length} account${cashAccounts.length !== 1 ? 's' : ''}`}
                      color="green"
                      onClick={() => setActiveTab('cash')}
                      clickable={cashAccounts.length > 0}
                    />
                    <StatCard
                      label="Outstanding Credit"
                      value={fmt(totalCredit)}
                      sub={`${creditAccounts.length} card${creditAccounts.length !== 1 ? 's' : ''}`}
                      color="red"
                      onClick={() => setActiveTab('credit')}
                      clickable={creditAccounts.length > 0}
                    />
                    <StatCard
                      label="Investments"
                      value={fmt(totalInvestments)}
                      sub={`${investmentAccounts.length} account${investmentAccounts.length !== 1 ? 's' : ''}`}
                      color="purple"
                      onClick={() => setActiveTab('investments')}
                      clickable={investmentAccounts.length > 0}
                    />
                    <StatCard
                      label="Net Worth"
                      value={fmt(netWorth)}
                      sub="Total"
                      color={netWorth >= 0 ? 'blue' : 'red'}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'cash' && cashAccounts.length > 0 && (
                <Section title="Cash & Checking" icon={<Wallet size={15} />} color="green">
                  <AccountGrid accounts={cashAccounts} />
                </Section>
              )}

              {activeTab === 'credit' && creditAccounts.length > 0 && (
                <Section title="Credit Cards" icon={<CreditCard size={15} />} color="red">
                  <AccountGrid accounts={creditAccounts} showUtilization />
                </Section>
              )}

              {activeTab === 'investments' && investmentAccounts.length > 0 && (
                <Section title="Investments" icon={<TrendingUp size={15} />} color="purple">
                  <AccountGrid accounts={investmentAccounts} />
                </Section>
              )}

              {activeTab === 'options' && (
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
                      <OptionsInsightsPanel transactions={investmentTx} securities={securities} />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                          Recent activity
                        </p>
                        <InvestmentTxTable transactions={investmentTx} securities={securities} />
                      </div>
                    </div>
                  )}
                </Section>
              )}

              {/* Pinned widget tab content */}
              {pinnedWidgets.map(w => activeTab === w.id && (
                <div key={w.id} className="max-w-2xl">
                  <WidgetCard
                    widget={w}
                    data={finData}
                    onDelete={deleteWidget}
                  />
                </div>
              ))}
            </div>

            {/* ── MY WIDGETS CANVAS ── */}
            <div className="border-t border-slate-800 pt-8">
              <div className="flex items-center gap-2 mb-4 text-purple-400">
                <Sparkles size={15} />
                <h2 className="text-[11px] font-bold uppercase tracking-widest">My Widgets</h2>
                <span className="text-slate-700 text-[10px] font-mono ml-1">· ask Sage to build custom charts</span>
              </div>

              {/* Sage prompt */}
              <div className="flex gap-2 mb-5">
                <input
                  value={widgetPrompt}
                  onChange={e => setWidgetPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !widgetCreating && askSageWidget()}
                  placeholder='e.g. "bar chart of spending by category" or "options P&L by ticker"'
                  className="input-auth flex-1 min-w-0 py-2.5 text-sm focus:border-purple-500 focus:ring-purple-500/35"
                />
                <button
                  onClick={askSageWidget}
                  disabled={widgetCreating || !widgetPrompt.trim()}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all"
                >
                  {widgetCreating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  {widgetCreating ? 'Building...' : 'Build'}
                </button>
              </div>

              {/* Widget preview */}
              {widgetPreview && (
                <div className="mb-5 border border-purple-500/40 rounded-2xl p-4 bg-purple-500/5">
                  <p className="text-[11px] text-purple-400 font-bold uppercase tracking-widest mb-3">Preview — does this look right?</p>
                  <div className="max-w-sm">
                    <WidgetCard widget={{ id: 'preview', ...widgetPreview }} data={finData} />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => saveWidget(widgetPreview)}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
                    >
                      Add to Dashboard
                    </button>
                    <button
                      onClick={() => setWidgetPreview(null)}
                      className="text-slate-500 hover:text-white text-sm px-4 py-2 rounded-xl transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}

              {/* Saved widgets grid */}
              {widgets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {widgets.map(w => (
                    <div key={w.id} className="relative group">
                      <WidgetCard
                        widget={w}
                        data={finData}
                        onDelete={deleteWidget}
                        dragging={widgetDragId === w.id}
                        onDragStart={() => onWidgetDragStart(w.id)}
                        onDragOver={e => onWidgetDragOver(e, w.id)}
                        onDragEnd={onWidgetDragEnd}
                      />
                      <button
                        onClick={() => {
                          togglePin(w.id);
                          if (!pinnedWidgetIds.includes(w.id)) setActiveTab(w.id);
                        }}
                        title={pinnedWidgetIds.includes(w.id) ? 'Unpin tab' : 'Pin as tab'}
                        className={`absolute top-3 right-8 text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-all opacity-0 group-hover:opacity-100 ${
                          pinnedWidgetIds.includes(w.id)
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-slate-700 text-slate-400 hover:text-white border border-slate-600'
                        }`}
                      >
                        {pinnedWidgetIds.includes(w.id) ? 'pinned' : 'pin tab'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : !widgetPreview && (
                <div className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-800 rounded-2xl text-slate-600 text-sm">
                  <Sparkles size={20} className="mb-2 text-slate-700" />
                  Ask Sage above to create your first custom widget
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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
  label, value, sub, color, onClick, clickable,
}: {
  label: string; value: string; sub?: string; color: 'blue' | 'green' | 'red' | 'purple';
  onClick?: () => void; clickable?: boolean;
}) {
  const colors = { blue: 'text-blue-400', green: 'text-green-400', red: 'text-red-400', purple: 'text-purple-400' };
  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`bg-[#11141B] border border-slate-800 rounded-xl p-5 transition-all ${
        clickable ? 'cursor-pointer hover:border-slate-600 hover:bg-[#151920] group' : ''
      }`}
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
    const st = (tx.subtype || '').toLowerCase();
    const isOption =
      sec?.type === 'derivative' || st.includes('option') || (sec?.name || '').toLowerCase().includes('option');
    if (isOption) optionTrades += 1;
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
              const isOption = sec?.type === 'derivative' || tx.subtype?.toLowerCase().includes('option');
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
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOption ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'}`}>
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
      <button type="button" onClick={onConnect} className="btn-on-dark-inline">
        <Plus size={16} />
        Connect Bank Account
      </button>
    </div>
  );
}
