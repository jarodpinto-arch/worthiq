"use client";
import React, { useMemo, useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart2, LineChart as LineChartIcon } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Account {
  account_id: string;
  name: string;
  type: string;
  subtype: string;
  balances: { current: number | null };
  institution?: string;
}

interface Transaction {
  transaction_id: string;
  amount: number;
  date: string;
}

export type NetWorthBarDrillPayload =
  | { mode: 'account'; accountId: string }
  | { mode: 'institution'; institution: string };

interface NetWorthChartProps {
  accounts: Account[];
  transactions: Transaction[];
  onBarSegmentClick?: (payload: NetWorthBarDrillPayload) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TIMEFRAMES = [
  { label: '1W',  days: 7   },
  { label: '1M',  days: 30  },
  { label: '3M',  days: 90  },
  { label: '6M',  days: 180 },
  { label: '1Y',  days: 365 },
] as const;

const ACCOUNT_PALETTE = [
  '#46C2E9', '#52B788', '#A78BFA', '#FB923C',
  '#F472B6', '#34D399', '#60A5FA', '#FBBF24',
  '#E879F9', '#2DD4BF',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  const abs = Math.abs(n);
  const neg = n < 0;
  if (abs >= 1_000_000) return `${neg ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${neg ? '-' : ''}$${(abs / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T00:00:00');
  if (days <= 30)  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (days <= 180) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

/**
 * Reconstruct approximate net worth history from current balances + transactions.
 * We start with today's net worth and walk backwards, reversing each transaction's effect.
 * Plaid convention: positive amount = outflow (spending), negative = inflow (deposits).
 */
function buildNetWorthHistory(
  accounts: Account[],
  transactions: Transaction[],
  days: number,
): { date: string; value: number; formattedDate: string }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentNetWorth = accounts.reduce((sum, a) => {
    const bal = a.balances.current ?? 0;
    return a.type === 'credit' ? sum - bal : sum + bal;
  }, 0);

  // Group transactions by date string for fast lookup
  const txByDate = new Map<string, number>();
  for (const tx of transactions) {
    const cur = txByDate.get(tx.date) ?? 0;
    txByDate.set(tx.date, cur + tx.amount);
  }

  const points: { date: string; value: number; formattedDate: string }[] = [];
  let running = currentNetWorth;

  for (let d = 0; d <= days; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];

    if (d === 0) {
      points.push({ date: dateStr, value: running, formattedDate: fmtDate(dateStr, days) });
    } else {
      // Undo transactions that occurred on this date (d days ago)
      const dayNet = txByDate.get(dateStr) ?? 0;
      running += dayNet; // reverse: spending (positive) was added, so adding it back = higher past balance
      points.push({ date: dateStr, value: running, formattedDate: fmtDate(dateStr, days) });
    }
  }

  return points.reverse(); // oldest first
}

/**
 * For bar chart: breakdown of current net worth by account.
 * Each account gets a stack segment colored by accountColors.
 */
function buildAccountBreakdown(accounts: Account[]) {
  return [
    accounts.reduce(
      (obj, a) => {
        const val = a.balances.current ?? 0;
        obj[a.account_id] = a.type === 'credit' ? -val : val;
        return obj;
      },
      {} as Record<string, number>,
    ),
  ];
}

/** Stacked bar: one segment per institution (signed balance net of credit cards). */
function buildInstitutionBreakdown(accounts: Account[]) {
  const row: Record<string, number> = {};
  for (const a of accounts) {
    const key = a.institution?.trim() || 'Other';
    const val = a.balances.current ?? 0;
    const signed = a.type === 'credit' ? -val : val;
    row[key] = (row[key] ?? 0) + signed;
  }
  return [row];
}

function institutionKeys(accounts: Account[]) {
  const set = new Set<string>();
  for (const a of accounts) {
    set.add(a.institution?.trim() || 'Other');
  }
  return Array.from(set);
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="rounded-xl border border-slate-700 bg-[#0D1017] px-3 py-2 shadow-xl">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-black tabular-nums ${value >= 0 ? 'text-white' : 'text-red-400'}`}>
        {fmtCurrency(value)}
      </p>
    </div>
  );
}

function BarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-700 bg-[#0D1017] px-3 py-2 shadow-xl min-w-[160px]">
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: entry.fill }} />
          <span className="text-xs text-slate-400 truncate flex-1">{entry.name}</span>
          <span className={`text-xs font-bold tabular-nums ${entry.value >= 0 ? 'text-white' : 'text-red-400'}`}>
            {fmtCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function NetWorthChart({ accounts, transactions, onBarSegmentClick }: NetWorthChartProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<typeof TIMEFRAMES[number]>(TIMEFRAMES[1]);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [barStackBy, setBarStackBy] = useState<'account' | 'institution'>('account');
  const [accountColors, setAccountColors] = useState<Record<string, string>>({});
  const [institutionColors, setInstitutionColors] = useState<Record<string, string>>({});

  useEffect(() => {
    setAccountColors((prev) => {
      const next = { ...prev };
      accounts.forEach((a, i) => {
        if (next[a.account_id] == null) {
          next[a.account_id] = ACCOUNT_PALETTE[i % ACCOUNT_PALETTE.length];
        }
      });
      return next;
    });
  }, [accounts]);

  useEffect(() => {
    const keys = institutionKeys(accounts);
    setInstitutionColors((prev) => {
      const next = { ...prev };
      keys.forEach((k, i) => {
        if (next[k] == null) {
          next[k] = ACCOUNT_PALETTE[i % ACCOUNT_PALETTE.length];
        }
      });
      return next;
    });
  }, [accounts]);

  const history = useMemo(
    () => buildNetWorthHistory(accounts, transactions, activeTimeframe.days),
    [accounts, transactions, activeTimeframe.days],
  );

  const barData = useMemo(
    () =>
      barStackBy === 'account'
        ? buildAccountBreakdown(accounts)
        : buildInstitutionBreakdown(accounts),
    [accounts, barStackBy],
  );

  const barKeys =
    barStackBy === 'account'
      ? accounts.map((a) => a.account_id)
      : institutionKeys(accounts);

  const currentValue = history[history.length - 1]?.value ?? 0;
  const startValue   = history[0]?.value ?? 0;
  const change       = currentValue - startValue;
  const changePct    = startValue !== 0 ? (change / Math.abs(startValue)) * 100 : 0;
  const isPositive   = change >= 0;

  // Thin out data points for larger ranges to keep chart readable
  const displayHistory = useMemo(() => {
    if (history.length <= 60) return history;
    const step = Math.ceil(history.length / 60);
    return history.filter((_, i) => i % step === 0 || i === history.length - 1);
  }, [history]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0D1017] p-5 sm:p-6">
      {/* Net worth + change */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500 mb-1">Net Worth</p>
          <p className={`text-4xl sm:text-5xl font-black tabular-nums leading-none ${currentValue >= 0 ? 'text-white' : 'text-red-400'}`}>
            {fmtCurrency(currentValue)}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            {isPositive
              ? <TrendingUp size={14} className="text-emerald-400" />
              : <TrendingDown size={14} className="text-red-400" />}
            <span className={`text-sm font-bold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{fmtCurrency(change)}
            </span>
            <span className={`text-xs font-semibold ${isPositive ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
              ({isPositive ? '+' : ''}{changePct.toFixed(1)}%)
            </span>
            <span className="text-xs text-slate-600">vs {activeTimeframe.label} ago</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-800/60 p-1">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.label}
                onClick={() => setActiveTimeframe(tf)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                  activeTimeframe.label === tf.label
                    ? 'bg-worthiq-cyan text-black shadow'
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Chart type */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-800/60 p-1">
            <button
              onClick={() => setChartType('line')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                chartType === 'line' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              <LineChartIcon size={13} />
              Line
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                chartType === 'bar' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              <BarChart2 size={13} />
              Bars
            </button>
            {chartType === 'bar' && (
              <div className="flex items-center gap-0.5 pl-1 border-l border-slate-700 ml-0.5">
                <button
                  type="button"
                  onClick={() => setBarStackBy('account')}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    barStackBy === 'account' ? 'text-worthiq-cyan' : 'text-slate-600 hover:text-slate-400'
                  }`}
                >
                  Account
                </button>
                <button
                  type="button"
                  onClick={() => setBarStackBy('institution')}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    barStackBy === 'institution' ? 'text-worthiq-cyan' : 'text-slate-600 hover:text-slate-400'
                  }`}
                >
                  Institution
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {chartType === 'bar' && onBarSegmentClick && (
        <p className="text-[11px] text-slate-600 mb-3">
          Click a bar segment to jump to those accounts below.
        </p>
      )}

      {/* Chart */}
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <AreaChart data={displayHistory} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="worthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#46C2E9" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#46C2E9" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="formattedDate"
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#475569', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmtCurrency}
                width={60}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#46C2E9', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#46C2E9"
                strokeWidth={2}
                fill="url(#worthGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#46C2E9', strokeWidth: 0 }}
              />
            </AreaChart>
          ) : (
            <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis hide />
              <YAxis
                tick={{ fill: '#475569', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmtCurrency}
                width={60}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend
                formatter={(value) => {
                  if (barStackBy === 'account') {
                    const acc = accounts.find((a) => a.account_id === value);
                    return <span style={{ color: '#94a3b8', fontSize: 11 }}>{acc?.name ?? value}</span>;
                  }
                  return <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>;
                }}
                wrapperStyle={{ paddingTop: 8 }}
              />
              {barStackBy === 'account'
                ? accounts.map((a, i) => (
                    <Bar
                      key={a.account_id}
                      dataKey={a.account_id}
                      name={a.name}
                      stackId="accounts"
                      fill={accountColors[a.account_id] ?? ACCOUNT_PALETTE[i % ACCOUNT_PALETTE.length]}
                      radius={i === accounts.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                      cursor={onBarSegmentClick ? 'pointer' : 'default'}
                      onClick={
                        onBarSegmentClick
                          ? () => onBarSegmentClick({ mode: 'account', accountId: a.account_id })
                          : undefined
                      }
                    />
                  ))
                : barKeys.map((inst, i) => (
                    <Bar
                      key={inst}
                      dataKey={inst}
                      name={inst}
                      stackId="institutions"
                      fill={institutionColors[inst] ?? ACCOUNT_PALETTE[i % ACCOUNT_PALETTE.length]}
                      radius={i === barKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                      cursor={onBarSegmentClick ? 'pointer' : 'default'}
                      onClick={
                        onBarSegmentClick
                          ? () => onBarSegmentClick({ mode: 'institution', institution: inst })
                          : undefined
                      }
                    />
                  ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Segment color pickers (bar mode only) */}
      {chartType === 'bar' && barStackBy === 'account' && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Account colors</p>
          <div className="flex flex-wrap gap-2">
            {accounts.map((a, i) => (
              <label key={a.account_id} className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="color"
                    value={accountColors[a.account_id] ?? ACCOUNT_PALETTE[i % ACCOUNT_PALETTE.length]}
                    onChange={(e) =>
                      setAccountColors((prev) => ({ ...prev, [a.account_id]: e.target.value }))
                    }
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <div
                    className="h-4 w-4 rounded-full ring-2 ring-slate-700 transition group-hover:ring-white"
                    style={{ background: accountColors[a.account_id] ?? ACCOUNT_PALETTE[i % ACCOUNT_PALETTE.length] }}
                  />
                </div>
                <span className="text-xs text-slate-500 group-hover:text-slate-300 transition max-w-[120px] truncate">
                  {a.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
      {chartType === 'bar' && barStackBy === 'institution' && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Institution colors</p>
          <div className="flex flex-wrap gap-2">
            {barKeys.map((inst, i) => (
              <label key={inst} className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="color"
                    value={institutionColors[inst] ?? ACCOUNT_PALETTE[i % ACCOUNT_PALETTE.length]}
                    onChange={(e) =>
                      setInstitutionColors((prev) => ({ ...prev, [inst]: e.target.value }))
                    }
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <div
                    className="h-4 w-4 rounded-full ring-2 ring-slate-700 transition group-hover:ring-white"
                    style={{ background: institutionColors[inst] ?? ACCOUNT_PALETTE[i % ACCOUNT_PALETTE.length] }}
                  />
                </div>
                <span className="text-xs text-slate-500 group-hover:text-slate-300 transition max-w-[140px] truncate">
                  {inst}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
