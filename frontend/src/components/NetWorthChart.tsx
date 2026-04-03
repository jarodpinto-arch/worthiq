"use client";
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart2, LineChart as LineChartIcon } from 'lucide-react';
import { computeNetWorthFromAccounts, accountsIncludedInNetWorth } from '../lib/net-worth';
import { timeBucketPlanForDays, buildTimeBucketFlowData } from '../lib/net-worth-chart-buckets';

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
  account_id?: string;
  amount: number;
  date: string;
  datetime?: string | null;
  authorized_datetime?: string | null;
}

export type NetWorthBarDrillPayload = { mode: 'account'; accountId: string };

interface NetWorthChartProps {
  accounts: Account[];
  transactions: Transaction[];
  onBarSegmentClick?: (payload: NetWorthBarDrillPayload) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TIMEFRAMES = [
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
] as const;

const ACCOUNT_PALETTE = [
  '#46C2E9', '#52B788', '#A78BFA', '#FB923C',
  '#F472B6', '#34D399', '#60A5FA', '#FBBF24',
  '#E879F9', '#2DD4BF',
];

const SELECTION_STORAGE_KEY = 'worthiq_nw_selected_accounts_v1';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  const abs = Math.abs(n);
  const neg = n < 0;
  if (abs >= 1_000_000) return `${neg ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${neg ? '-' : ''}$${(abs / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

/** X-axis tick text for the net-worth line (calendar points). */
function formatLineAxisDate(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T12:00:00');
  if (days <= 1) {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
  }
  if (days <= 7) {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  if (days <= 30) {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  if (days <= 180) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function formatLineTooltipDate(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T12:00:00');
  if (days <= 7) {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (days <= 180) {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Indices 0..length-1 spaced evenly for ~maxTicks labels (inclusive ends). */
function evenIntegerTicks(length: number, maxTicks: number): number[] {
  if (length <= 0) return [];
  if (length === 1) return [0];
  const cap = Math.min(Math.max(2, maxTicks), length);
  if (cap >= length) return Array.from({ length }, (_, i) => i);
  const out: number[] = [];
  for (let i = 0; i < cap; i++) {
    out.push(Math.round((i * (length - 1)) / (cap - 1)));
  }
  return Array.from(new Set(out)).sort((a, b) => a - b);
}

function buildNetWorthHistory(
  accounts: Account[],
  transactions: Transaction[],
  days: number,
): { date: string; value: number }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentNetWorth = computeNetWorthFromAccounts(accounts);
  const allowedIds = new Set(accounts.map((a) => a.account_id));

  const txByDate = new Map<string, number>();
  for (const tx of transactions) {
    if (!tx.account_id || !allowedIds.has(tx.account_id)) continue;
    const cur = txByDate.get(tx.date) ?? 0;
    txByDate.set(tx.date, cur + tx.amount);
  }

  const points: { date: string; value: number }[] = [];
  let running = currentNetWorth;

  for (let d = 0; d <= days; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];

    if (d === 0) {
      points.push({ date: dateStr, value: running });
    } else {
      const dayNet = txByDate.get(dateStr) ?? 0;
      running += dayNet;
      points.push({ date: dateStr, value: running });
    }
  }

  return points.reverse();
}

// ── Tooltips ──────────────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
  daysRange,
}: {
  active?: boolean;
  payload?: readonly any[] | any[];
  label?: string | number;
  daysRange: number;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  const dateStr = (payload[0]?.payload?.date as string) ?? (typeof label === 'string' ? label : '') ?? '';
  const title = dateStr ? formatLineTooltipDate(dateStr, daysRange) : label != null ? String(label) : '';
  return (
    <div className="rounded-xl border border-slate-700 bg-[#0D1017] px-3 py-2 shadow-xl">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{title}</p>
      <p className={`text-lg font-black tabular-nums ${value >= 0 ? 'text-white' : 'text-red-400'}`}>
        {fmtCurrency(value)}
      </p>
    </div>
  );
}

function FlowBarTooltip({
  active,
  payload,
  label,
  accountName,
}: {
  active?: boolean;
  payload?: readonly any[] | any[];
  label?: string;
  accountName: (id: string) => string;
}) {
  if (!active || !payload?.length) return null;
  const list = Array.from(payload);
  const rowPayload = list[0]?.payload as Record<string, unknown> | undefined;
  const header =
    (typeof rowPayload?.tooltipLabel === 'string' && rowPayload.tooltipLabel) || label || '';
  const rows = list.filter(
    (e) =>
      e &&
      e.dataKey &&
      typeof e.value === 'number' &&
      !['bucketIndex', 'bucketStart', 'bucketEnd', 'label'].includes(String(e.dataKey)),
  );
  const total = rows.reduce((s: number, e: any) => s + (e.value ?? 0), 0);
  return (
    <div className="rounded-xl border border-slate-700 bg-[#0D1017] px-3 py-2 shadow-xl min-w-[180px]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 leading-snug">{header}</p>
      <p className="text-[10px] text-slate-600 mb-2">Plaid: + outflow · − inflow</p>
      {rows.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: entry.fill }} />
          <span className="text-xs text-slate-400 truncate flex-1">{accountName(entry.dataKey)}</span>
          <span className={`text-xs font-bold tabular-nums ${entry.value >= 0 ? 'text-amber-200' : 'text-emerald-300'}`}>
            {fmtCurrency(entry.value)}
          </span>
        </div>
      ))}
      <div className="mt-2 border-t border-slate-800 pt-2 flex justify-between text-xs font-bold text-slate-300">
        <span>Net in bucket</span>
        <span className="tabular-nums">{fmtCurrency(total)}</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function NetWorthChart({ accounts, transactions, onBarSegmentClick }: NetWorthChartProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<typeof TIMEFRAMES[number]>(TIMEFRAMES[2]);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [accountColors, setAccountColors] = useState<Record<string, string>>({});
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());
  const selectionInitRef = useRef(false);

  const nwAccounts = useMemo(() => accountsIncludedInNetWorth(accounts), [accounts]);

  useEffect(() => {
    if (nwAccounts.length === 0) return;
    setSelectedAccountIds((prev) => {
      const allowed = new Set(nwAccounts.map((a) => a.account_id));
      if (!selectionInitRef.current) {
        selectionInitRef.current = true;
        try {
          const raw = localStorage.getItem(SELECTION_STORAGE_KEY);
          if (raw) {
            const arr: string[] = JSON.parse(raw);
            const next = new Set(arr.filter((id) => allowed.has(id)));
            if (next.size > 0) return next;
          }
        } catch { /* ignore */ }
        return allowed;
      }
      const next = new Set<string>();
      for (const id of Array.from(prev)) {
        if (allowed.has(id)) next.add(id);
      }
      for (const a of nwAccounts) {
        if (!prev.has(a.account_id)) next.add(a.account_id);
      }
      if (next.size === 0) return allowed;
      return next;
    });
  }, [nwAccounts]);

  useEffect(() => {
    if (!selectionInitRef.current || selectedAccountIds.size === 0) return;
    try {
      localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(Array.from(selectedAccountIds)));
    } catch { /* ignore */ }
  }, [selectedAccountIds]);

  const includedAccounts = useMemo(
    () => nwAccounts.filter((a) => selectedAccountIds.has(a.account_id)),
    [nwAccounts, selectedAccountIds],
  );

  const includedTx = useMemo(() => {
    const ids = new Set(includedAccounts.map((a) => a.account_id));
    return transactions.filter((t) => t.account_id && ids.has(t.account_id));
  }, [transactions, includedAccounts]);

  useEffect(() => {
    setAccountColors((prev) => {
      const next = { ...prev };
      nwAccounts.forEach((a, i) => {
        if (next[a.account_id] == null) {
          next[a.account_id] = ACCOUNT_PALETTE[i % ACCOUNT_PALETTE.length];
        }
      });
      return next;
    });
  }, [nwAccounts]);

  const history = useMemo(
    () => buildNetWorthHistory(includedAccounts, includedTx, activeTimeframe.days),
    [includedAccounts, includedTx, activeTimeframe.days],
  );

  const bucketPlan = useMemo(
    () => timeBucketPlanForDays(activeTimeframe.days),
    [activeTimeframe.days],
  );

  const { rows: barRows, accountIdsOrdered: barAccountIds } = useMemo(() => {
    if (includedAccounts.length === 0) {
      return { rows: [] as Record<string, number | string>[], accountIdsOrdered: [] as string[] };
    }
    return buildTimeBucketFlowData(
      includedTx,
      new Set(includedAccounts.map((a) => a.account_id)),
      bucketPlan,
    );
  }, [includedTx, includedAccounts, bucketPlan]);

  const headlineNetWorth = computeNetWorthFromAccounts(includedAccounts);
  const currentValue = headlineNetWorth;
  const startValue = history[0]?.value ?? 0;
  const change = currentValue - startValue;
  const changePct = startValue !== 0 ? (change / Math.abs(startValue)) * 100 : 0;
  const isPositive = change >= 0;

  const displayHistory = useMemo(() => {
    if (history.length <= 60) return history;
    const step = Math.ceil(history.length / 60);
    return history.filter((_, i) => i % step === 0 || i === history.length - 1);
  }, [history]);

  const lineXAxisTicks = useMemo(() => {
    const data = displayHistory;
    const idxs = evenIntegerTicks(data.length, 8);
    return idxs.map((i) => data[i]?.date).filter(Boolean) as string[];
  }, [displayHistory]);

  const barBucketTicks = useMemo(() => {
    const n = barRows.length;
    const maxTicks = n <= 15 ? n : n <= 24 ? 8 : 10;
    return evenIntegerTicks(n, maxTicks);
  }, [barRows]);

  const histMin = displayHistory.length ? Math.min(...displayHistory.map((p) => p.value)) : 0;
  const histMax = displayHistory.length ? Math.max(...displayHistory.map((p) => p.value)) : 0;
  const showLineZeroRef = chartType === 'line' && histMin < 0 && histMax > 0;

  const barTotals = barRows.map((row) =>
    barAccountIds.reduce((s, id) => s + (Number(row[id]) || 0), 0),
  );
  const barMin = barTotals.length ? Math.min(...barTotals) : 0;
  const barMax = barTotals.length ? Math.max(...barTotals) : 0;
  const showBarZeroRef = chartType === 'bar' && barMin < 0 && barMax > 0;

  const accountName = (id: string) => nwAccounts.find((a) => a.account_id === id)?.name ?? id;

  const toggleAccount = (id: string) => {
    setSelectedAccountIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 1) return next;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllAccounts = () => {
    setSelectedAccountIds(new Set(nwAccounts.map((a) => a.account_id)));
  };

  const partialSelection = includedAccounts.length < nwAccounts.length;

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-[#0D1017]/95 backdrop-blur-sm p-5 sm:p-6 shadow-[0_0_0_1px_rgba(70,194,233,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500 mb-1">Net Worth</p>
          <p className={`text-4xl sm:text-5xl font-black tabular-nums leading-none ${currentValue >= 0 ? 'text-white' : 'text-red-400'}`}>
            {fmtCurrency(currentValue)}
          </p>
          <p className="text-[11px] text-slate-600 mt-2 max-w-md leading-relaxed">
            Cash + investments − credit for accounts you include below
            {partialSelection ? ' (subset of all linked accounts).' : '.'} Loans and other Plaid types stay out of this total.
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

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-slate-800/60 p-1">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.label}
                type="button"
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

          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-800/60 p-1">
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                chartType === 'line' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              <LineChartIcon size={13} />
              Line
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                chartType === 'bar' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              <BarChart2 size={13} />
              Bars
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/40 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Accounts in this overview</p>
          {nwAccounts.length > 1 && (
            <button
              type="button"
              onClick={selectAllAccounts}
              className="text-[11px] font-semibold text-worthiq-cyan hover:text-worthiq-cyan/80"
            >
              Select all
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {nwAccounts.map((a) => {
            const on = selectedAccountIds.has(a.account_id);
            return (
              <label
                key={a.account_id}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                  on
                    ? 'border-worthiq-cyan/50 bg-worthiq-cyan/10 text-white'
                    : 'border-slate-700 bg-slate-800/40 text-slate-500 hover:border-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  className="rounded border-slate-600 text-worthiq-cyan focus:ring-worthiq-cyan/40"
                  checked={on}
                  onChange={() => toggleAccount(a.account_id)}
                />
                <span className="max-w-[140px] truncate">{a.name}</span>
                <span className="text-slate-600">({a.type})</span>
              </label>
            );
          })}
        </div>
      </div>

      {chartType === 'bar' && onBarSegmentClick && barAccountIds.length > 0 && (
        <p className="text-[11px] text-slate-600 mb-3">
          Bars = time buckets ({activeTimeframe.label === '1D' ? '24 hours' : activeTimeframe.label === '1W' ? '12 segments over the range' : activeTimeframe.label === '1M' ? '30 days' : '12 segments'}). Click a colored segment to open that account below.
        </p>
      )}

      <div className="h-[260px] sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <AreaChart data={displayHistory} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
              <defs>
                <linearGradient id="worthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#46C2E9" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#46C2E9" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={lineXAxisTicks}
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                minTickGap={8}
                tickFormatter={(iso) => formatLineAxisDate(iso, activeTimeframe.days)}
              />
              <YAxis
                tick={{ fill: '#475569', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmtCurrency}
                width={60}
              />
              <Tooltip
                content={(props) => (
                  <ChartTooltip {...props} daysRange={activeTimeframe.days} />
                )}
                cursor={{ stroke: '#46C2E9', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              {showLineZeroRef && (
                <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4" strokeOpacity={0.65} />
              )}
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
            <BarChart
              data={barRows}
              margin={{ top: 8, right: 8, bottom: 20, left: 0 }}
              barCategoryGap="10%"
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="bucketIndex"
                type="number"
                allowDecimals={false}
                ticks={barBucketTicks}
                domain={['dataMin', 'dataMax']}
                tick={{ fill: '#64748b', fontSize: 9, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => {
                  const row = barRows.find((r) => r.bucketIndex === v);
                  return typeof row?.axisLabel === 'string' ? row.axisLabel : '';
                }}
                height={28}
              />
              <YAxis
                tick={{ fill: '#475569', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmtCurrency}
                width={56}
              />
              <Tooltip
                content={(props: any) => (
                  <FlowBarTooltip
                    active={props.active}
                    payload={props.payload}
                    label={props.label}
                    accountName={accountName}
                  />
                )}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ color: '#94a3b8', fontSize: 11 }}>{accountName(value)}</span>
                )}
                wrapperStyle={{ paddingTop: 8 }}
              />
              {showBarZeroRef && (
                <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4" strokeOpacity={0.65} />
              )}
              {barAccountIds.map((aid, i) => (
                <Bar
                  key={aid}
                  dataKey={aid}
                  name={aid}
                  stackId="flow"
                  fill={accountColors[aid] ?? ACCOUNT_PALETTE[i % ACCOUNT_PALETTE.length]}
                  maxBarSize={activeTimeframe.days <= 1 ? 14 : 48}
                  radius={i === barAccountIds.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                  cursor={onBarSegmentClick ? 'pointer' : 'default'}
                  onClick={
                    onBarSegmentClick
                      ? () => onBarSegmentClick({ mode: 'account', accountId: aid })
                      : undefined
                  }
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {chartType === 'line' && (
        <p className="text-[10px] text-slate-600 mt-3 leading-relaxed">
          Trend line is an estimate from linked transactions for selected accounts only; transfers between your own accounts can skew it.
        </p>
      )}

      {chartType === 'bar' && (
        <p className="text-[10px] text-slate-600 mt-3 leading-relaxed">
          Bar height is total Plaid-reported activity in each time bucket (stacked by account). When a transaction has no timestamp, it is spread across the calendar day that overlaps the bucket.
        </p>
      )}

      {chartType === 'bar' && barAccountIds.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Bar colors</p>
          <div className="flex flex-wrap gap-2">
            {barAccountIds.map((aid, i) => {
              const a = nwAccounts.find((x) => x.account_id === aid);
              return (
                <label key={aid} className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="color"
                      value={accountColors[aid] ?? ACCOUNT_PALETTE[i % ACCOUNT_PALETTE.length]}
                      onChange={(e) =>
                        setAccountColors((prev) => ({ ...prev, [aid]: e.target.value }))
                      }
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                    <div
                      className="h-4 w-4 rounded-full ring-2 ring-slate-700 transition group-hover:ring-white"
                      style={{ background: accountColors[aid] ?? ACCOUNT_PALETTE[i % ACCOUNT_PALETTE.length] }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 group-hover:text-slate-300 transition max-w-[120px] truncate">
                    {a?.name ?? aid}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
