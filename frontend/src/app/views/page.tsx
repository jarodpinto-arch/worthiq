"use client";
export const dynamic = "force-dynamic";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, LineChart, Line, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import {
  LayoutDashboard, Link, Settings, BarChart2, TrendingUp, Building2, Plus, Receipt,
} from 'lucide-react';
import { WorthIQLogoNav } from '../../components/WorthIQLogoNav';
import { getApiBase } from '../../lib/api-base';

const RANGES = [
  { label: '30d',    days: 30 },
  { label: '90d',    days: 90 },
  { label: '6mo',    days: 180 },
  { label: '1yr',    days: 365 },
];

const CHART_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#f97316', '#ec4899',
];

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n);
}

function toDateStr(date: Date) {
  return date.toISOString().split('T')[0];
}

export default function ViewsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(90);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) { router.push('/login'); return; }

    fetch(`${getApiBase()}/auth/me`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then(r => { if (!r.ok) { localStorage.removeItem('authToken'); router.push('/login'); } })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (!mounted) return;
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    setLoading(true);
    const end   = toDateStr(new Date());
    const start = toDateStr(new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000));

    fetch(`${getApiBase()}/plaid/transactions?startDate=${start}&endDate=${end}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(r => r.json())
      .then(data => setTransactions(data.transactions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mounted, rangeDays]);

  if (!mounted) return null;

  // ── Data transforms ──────────────────────────────────────────────────────
  const spending = transactions.filter(t => t.amount > 0 && !t.pending);
  const income   = transactions.filter(t => t.amount < 0 && !t.pending);

  const totalSpent  = spending.reduce((s, t) => s + t.amount, 0);
  const totalIncome = income.reduce((s, t) => s + Math.abs(t.amount), 0);

  // Spending by category (top 8)
  const categoryMap: Record<string, number> = {};
  spending.forEach(t => {
    const cat = t.category?.[0] || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
  });
  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value: +value.toFixed(2) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Monthly spending trend
  const monthSpendMap: Record<string, number> = {};
  spending.forEach(t => {
    const m = t.date.slice(0, 7);
    monthSpendMap[m] = (monthSpendMap[m] || 0) + t.amount;
  });
  const monthlyData = Object.entries(monthSpendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, total]) => ({
      month: new Date(m + '-02').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      total: +total.toFixed(2),
    }));

  // Top merchants (top 8)
  const merchantMap: Record<string, number> = {};
  spending.forEach(t => {
    const name = t.merchant_name || t.name || 'Unknown';
    merchantMap[name] = (merchantMap[name] || 0) + t.amount;
  });
  const topMerchants = Object.entries(merchantMap)
    .map(([name, value]) => ({ name, value: +value.toFixed(2) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Income vs expenses by month
  const ivseMap: Record<string, { month: string; income: number; expenses: number }> = {};
  transactions.filter(t => !t.pending).forEach(t => {
    const m = t.date.slice(0, 7);
    if (!ivseMap[m]) {
      ivseMap[m] = {
        month: new Date(m + '-02').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        income: 0,
        expenses: 0,
      };
    }
    if (t.amount > 0) ivseMap[m].expenses += t.amount;
    else ivseMap[m].income += Math.abs(t.amount);
  });
  const ivseData = Object.values(ivseMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(d => ({ ...d, income: +d.income.toFixed(2), expenses: +d.expenses.toFixed(2) }));

  const hasAccounts = !loading && transactions.length === 0;

  const tooltipStyle = {
    contentStyle: { background: '#11141B', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 },
    formatter: (v: any) => [fmt(v)],
  };
  const axisStyle = { fill: '#475569', fontSize: 11 };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-slate-300 flex">
      {/* ── SIDEBAR ── */}
      <aside className="w-20 lg:w-64 border-r border-slate-800 flex flex-col items-center lg:items-start p-6 gap-8 shrink-0">
        <WorthIQLogoNav
          className="w-10 lg:w-32"
          wrapperClassName="rounded-lg p-1 focus-visible:ring-offset-[#0A0C10]"
        />

        <nav className="flex-1 w-full space-y-1">
          <NavItem icon={<LayoutDashboard size={19} />} label="Dashboard"      onClick={() => router.push('/dashboard')} />
          <NavItem icon={<BarChart2 size={19} />}       label="Views"         active />
          <NavItem icon={<Receipt size={19} />}         label="Transactions"  onClick={() => router.push('/transactions')} />
          <NavItem icon={<Link size={19} />}            label="Manage Accounts" onClick={() => router.push('/connect')} />
          <NavItem icon={<Settings size={19} />} label="Settings" />
        </nav>

        <div
          onClick={() => { localStorage.removeItem('authToken'); router.push('/login'); }}
          className="flex items-center gap-3 text-slate-700 hover:text-red-400 px-3 py-2 rounded-xl cursor-pointer transition-colors text-xs font-mono w-full"
        >
          <span className="hidden lg:block">[LOGOUT]</span>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 p-6 lg:p-10 overflow-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-white">Views</h1>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-worthiq-cyan">Spending Intelligence</p>
          </div>

          {/* Range selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-600 mr-1">Range</span>
            {RANGES.map(r => (
              <button
                key={r.days}
                onClick={() => setRangeDays(r.days)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                  rangeDays === r.days
                    ? 'border-white bg-white text-black'
                    : 'border-slate-700 bg-transparent text-slate-500 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-slate-600 font-mono text-sm animate-pulse">Fetching transactions...</p>
          </div>
        ) : hasAccounts ? (
          <EmptyState onConnect={() => router.push('/connect')} />
        ) : (
          <>
            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <StatCard label="Transactions"  value={spending.length.toString()} />
              <StatCard label="Total Spent"   value={fmt(totalSpent)}  color="red" />
              <StatCard label="Total Income"  value={fmt(totalIncome)} color="green" />
            </div>

            {/* Charts 2×2 grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Spending by Category */}
              <ChartCard title="Spending by Category" icon={<TrendingUp size={15} />}>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%" cy="50%"
                        outerRadius={95} innerRadius={52}
                        paddingAngle={2}
                      >
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                      <Legend
                        iconSize={8}
                        formatter={v => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <NoData />}
              </ChartCard>

              {/* Monthly Spending Trend */}
              <ChartCard title="Monthly Spending Trend" icon={<BarChart2 size={15} />}>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                      <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={40} />
                      <Tooltip {...tooltipStyle} />
                      <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <NoData />}
              </ChartCard>

              {/* Top Merchants */}
              <ChartCard title="Top Merchants" icon={<Building2 size={15} />}>
                {topMerchants.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={topMerchants} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                      <YAxis
                        type="category" dataKey="name"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={false} tickLine={false}
                        width={110}
                        tickFormatter={v => v.length > 14 ? v.slice(0, 14) + '…' : v}
                      />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <NoData />}
              </ChartCard>

              {/* Income vs Expenses */}
              <ChartCard title="Income vs Expenses" icon={<TrendingUp size={15} />}>
                {ivseData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={ivseData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                      <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={40} />
                      <Tooltip {...tooltipStyle} />
                      <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: 11, textTransform: 'capitalize' }}>{v}</span>} />
                      <Bar dataKey="income"   fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <NoData />}
              </ChartCard>

            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NavItem({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        active ? 'bg-white text-black' : 'text-slate-500 hover:text-white'
      }`}
    >
      {icon}
      <span className="hidden lg:block font-semibold text-sm">{label}</span>
    </div>
  );
}

function ChartCard({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-[#11141B] border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 text-blue-400 mb-5">
        {icon}
        <h3 className="text-[11px] font-bold uppercase tracking-widest">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: 'green' | 'red' }) {
  const c = color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-400' : 'text-white';
  return (
    <div className="bg-[#11141B] border border-slate-800 rounded-xl p-5">
      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-2xl font-black tabular-nums ${c}`}>{value}</p>
    </div>
  );
}

function NoData() {
  return (
    <div className="flex items-center justify-center h-48 text-slate-700 text-sm font-mono">
      No data for this period
    </div>
  );
}

function EmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-72 border-2 border-dashed border-slate-800 rounded-2xl">
      <BarChart2 size={40} className="text-slate-700 mb-4" />
      <p className="text-slate-400 font-bold mb-1">No transaction data yet</p>
      <p className="text-slate-600 text-sm mb-6">Connect a bank account to unlock spending analytics.</p>
      <button type="button" onClick={onConnect} className="btn-on-dark-inline">
        <Plus size={16} />
        Connect Bank Account
      </button>
    </div>
  );
}
