"use client";
import React, { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { X, GripVertical } from 'lucide-react';
import { isOptionsLeg, type InstrumentKindFilter } from '../lib/investment-instrument';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

function fmtUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}
function fmtUSD2(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

interface WidgetConfig {
  dataSource: 'transactions' | 'investment_transactions' | 'accounts';
  metric?: string;
  groupBy?: string;
  txFilter?: {
    category?: string;
    sageCategory?: string;
    merchant?: string;
    type?: string;
    flow?: 'income' | 'expense' | 'all';
    dateRange?: string;
  };
  invFilter?: {
    subtype?: string;
    ticker?: string;
    sageCategory?: string;
    instrumentKind?: InstrumentKindFilter;
    dateRange?: string;
  };
  accountFilter?: { type?: string };
  dateRange?: string;
  limit?: number;
}

interface Widget {
  id: string;
  type: 'metric' | 'bar' | 'line' | 'pie' | 'table';
  title: string;
  config: WidgetConfig;
}

interface FinancialData {
  accounts: any[];
  transactions: any[];
  investmentTx: any[];
  securities: any[];
  classifications: Record<string, any>;
}

interface WidgetCardProps {
  widget: Widget;
  data: FinancialData;
  onDelete?: (id: string) => void;
  dragging?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

// ── Data computation ──────────────────────────────────────────────────────────

function daysForRange(dr?: string): number | null {
  if (!dr) return null;
  const m: Record<string, number> = { '30d': 30, '90d': 90, '6mo': 180, '1yr': 365 };
  return m[dr] ?? null;
}

function filterByDateRange<T extends { date?: string }>(rows: T[], dateRange?: string): T[] {
  const days = daysForRange(dateRange);
  if (days == null) return rows;
  const cutoff = new Date();
  cutoff.setUTCHours(0, 0, 0, 0);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cs = cutoff.toISOString().slice(0, 10);
  return rows.filter((r) => (r.date || '') >= cs);
}

function computeWidgetData(widget: Widget, data: FinancialData) {
  const { config } = widget;

  if (config.dataSource === 'accounts') {
    let accs = data.accounts;
    if (config.accountFilter?.type) accs = accs.filter(a => a.type === config.accountFilter!.type);

    if (widget.type === 'metric') {
      let value = 0;
      switch (config.metric) {
        case 'net_worth':
          value = accs.filter(a => a.type !== 'credit').reduce((s, a) => s + (a.balances.current ?? 0), 0)
                - accs.filter(a => a.type === 'credit').reduce((s, a) => s + (a.balances.current ?? 0), 0);
          break;
        case 'total_cash':
          value = accs.filter(a => a.type === 'depository').reduce((s, a) => s + (a.balances.current ?? 0), 0);
          break;
        case 'total_investments':
          value = accs.filter(a => a.type === 'investment').reduce((s, a) => s + (a.balances.current ?? 0), 0);
          break;
        case 'total_credit':
          value = accs.filter(a => a.type === 'credit').reduce((s, a) => s + (a.balances.current ?? 0), 0);
          break;
        default:
          value = accs.reduce((s, a) => s + (a.balances.current ?? 0), 0);
      }
      return { type: 'metric', value, label: widget.title };
    }

    if (config.groupBy === 'institution' || config.groupBy === 'type') {
      const grouped: Record<string, number> = {};
      accs.forEach(a => {
        const key = config.groupBy === 'institution' ? (a.institution || 'Unknown') : a.type;
        grouped[key] = (grouped[key] ?? 0) + (a.balances.current ?? 0);
      });
      return { type: 'grouped', rows: Object.entries(grouped).map(([name, value]) => ({ name, value })) };
    }

    return { type: 'grouped', rows: accs.map(a => ({ name: a.name, value: a.balances.current ?? 0 })) };
  }

  if (config.dataSource === 'investment_transactions') {
    const secMap = new Map(data.securities.map(s => [s.security_id, s]));
    let txs = data.investmentTx;
    const invDr = config.dateRange || config.invFilter?.dateRange;
    txs = filterByDateRange(txs, invDr);
    const ik = config.invFilter?.instrumentKind;
    if (ik && ik !== 'all') {
      txs = txs.filter((t) => {
        const opt = isOptionsLeg(t, secMap.get(t.security_id));
        return ik === 'options_only' ? opt : !opt;
      });
    }
    if (config.invFilter?.sageCategory) {
      const q = config.invFilter.sageCategory.toLowerCase();
      txs = txs.filter((t) => {
        const cl = data.classifications[t.investment_transaction_id];
        const sage = (cl?.userCategory || cl?.aiCategory || '').toLowerCase();
        return sage.includes(q);
      });
    }
    if (config.invFilter?.subtype) txs = txs.filter(t => t.subtype?.toLowerCase() === config.invFilter!.subtype!.toLowerCase());
    if (config.invFilter?.ticker) {
      txs = txs.filter(t => {
        const sec = secMap.get(t.security_id);
        return sec?.ticker_symbol?.toUpperCase() === config.invFilter!.ticker!.toUpperCase();
      });
    }

    if (widget.type === 'metric') {
      let value = 0;
      if (config.metric === 'pl_total') {
        value = txs.reduce((s, t) => s + (t.amount < 0 ? -t.amount : -t.amount), 0);
      } else if (config.metric === 'count') {
        value = txs.length;
      } else {
        value = txs.reduce((s, t) => s + Math.abs(t.amount), 0);
      }
      return { type: 'metric', value, label: widget.title, isCount: config.metric === 'count' };
    }

    if (config.groupBy === 'ticker') {
      const secMap = new Map(data.securities.map(s => [s.security_id, s]));
      const grouped: Record<string, number> = {};
      txs.forEach(t => {
        const sec = secMap.get(t.security_id);
        const key = sec?.ticker_symbol || sec?.name || 'Unknown';
        grouped[key] = (grouped[key] ?? 0) + Math.abs(t.amount);
      });
      return { type: 'grouped', rows: Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, config.limit ?? 10) };
    }

    if (config.groupBy === 'subtype' || config.groupBy === 'type') {
      const grouped: Record<string, number> = {};
      txs.forEach(t => {
        const key = (config.groupBy === 'subtype' ? t.subtype : t.type) || 'Unknown';
        grouped[key] = (grouped[key] ?? 0) + Math.abs(t.amount);
      });
      return { type: 'grouped', rows: Object.entries(grouped).map(([name, value]) => ({ name, value })) };
    }

    if (config.groupBy === 'month') {
      const grouped: Record<string, number> = {};
      txs.forEach(t => {
        const key = t.date?.slice(0, 7) || 'Unknown';
        grouped[key] = (grouped[key] ?? 0) + Math.abs(t.amount);
      });
      return { type: 'grouped', rows: Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => ({ name, value })) };
    }

    if (config.groupBy === 'sage_category') {
      const grouped: Record<string, number> = {};
      txs.forEach((t) => {
        const cl = data.classifications[t.investment_transaction_id];
        const cat = cl?.userCategory || cl?.aiCategory || t.subtype || 'Uncategorized';
        grouped[cat] = (grouped[cat] ?? 0) + Math.abs(t.amount);
      });
      return {
        type: 'grouped',
        rows: Object.entries(grouped)
          .sort(([, a], [, b]) => b - a)
          .slice(0, config.limit ?? 10)
          .map(([name, value]) => ({ name, value })),
      };
    }

    if (config.groupBy === 'instrument_kind') {
      const grouped: Record<string, number> = { Options: 0, 'Stocks & other': 0 };
      txs.forEach((t) => {
        const key = isOptionsLeg(t, secMap.get(t.security_id)) ? 'Options' : 'Stocks & other';
        grouped[key] += Math.abs(Number(t.amount) || 0);
      });
      return { type: 'grouped', rows: Object.entries(grouped).map(([name, value]) => ({ name, value })) };
    }

    // table fallback
    return {
      type: 'table',
      columns: ['Date', 'Ticker', 'Type', 'Qty', 'Price', 'Amount'],
      rows: txs.slice(0, config.limit ?? 20).map(t => {
        const sec = secMap.get(t.security_id);
        return [t.date, sec?.ticker_symbol || '—', t.subtype || t.type || '—', t.quantity ?? '—', t.price != null ? fmtUSD2(t.price) : '—', fmtUSD2(Math.abs(t.amount))];
      }),
    };
  }

  // transactions (default)
  let txs = data.transactions;
  const txDr = config.dateRange || config.txFilter?.dateRange;
  txs = filterByDateRange(txs, txDr);
  const flow = config.txFilter?.flow;
  if (flow === 'income') txs = txs.filter((t) => t.amount < 0);
  else if (flow === 'expense') txs = txs.filter((t) => t.amount > 0);
  if (config.txFilter?.type === 'debit') txs = txs.filter(t => t.amount > 0);
  if (config.txFilter?.type === 'credit') txs = txs.filter(t => t.amount < 0);
  if (config.txFilter?.category) {
    const q = config.txFilter.category.toLowerCase();
    txs = txs.filter(t => {
      const cl = data.classifications[t.transaction_id];
      const cat = cl?.userCategory || cl?.aiCategory || t.category?.[0] || '';
      return cat.toLowerCase().includes(q);
    });
  }
  if (config.txFilter?.sageCategory) {
    const q = config.txFilter.sageCategory.toLowerCase();
    txs = txs.filter((t) => {
      const cl = data.classifications[t.transaction_id];
      const sage = (cl?.userCategory || cl?.aiCategory || '').toLowerCase();
      return sage.includes(q);
    });
  }
  if (config.txFilter?.merchant) {
    txs = txs.filter(t => (t.merchant_name || t.name || '').toLowerCase().includes(config.txFilter!.merchant!.toLowerCase()));
  }

  if (widget.type === 'metric') {
    let value = 0;
    switch (config.metric) {
      case 'total_spent':  value = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0); break;
      case 'total_income': value = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0); break;
      case 'avg_amount':   value = txs.length ? txs.reduce((s, t) => s + Math.abs(t.amount), 0) / txs.length : 0; break;
      case 'count':        return { type: 'metric', value: txs.length, label: widget.title, isCount: true };
      default:             value = txs.reduce((s, t) => s + Math.abs(t.amount), 0);
    }
    return { type: 'metric', value, label: widget.title };
  }

  if (config.groupBy === 'category') {
    const grouped: Record<string, number> = {};
    txs.filter((t) => t.amount > 0).forEach((t) => {
      const cl = data.classifications[t.transaction_id];
      const cat = cl?.userCategory || cl?.aiCategory || t.category?.[0] || 'Uncategorized';
      grouped[cat] = (grouped[cat] ?? 0) + t.amount;
    });
    return {
      type: 'grouped',
      rows: Object.entries(grouped)
        .sort(([, a], [, b]) => b - a)
        .slice(0, config.limit ?? 10)
        .map(([name, value]) => ({ name, value })),
    };
  }

  if (config.groupBy === 'sage_category') {
    const grouped: Record<string, number> = {};
    txs.filter((t) => t.amount > 0).forEach((t) => {
      const cl = data.classifications[t.transaction_id];
      const cat = cl?.userCategory || cl?.aiCategory || 'Uncategorized';
      grouped[cat] = (grouped[cat] ?? 0) + t.amount;
    });
    return {
      type: 'grouped',
      rows: Object.entries(grouped)
        .sort(([, a], [, b]) => b - a)
        .slice(0, config.limit ?? 10)
        .map(([name, value]) => ({ name, value })),
    };
  }

  if (config.groupBy === 'merchant') {
    const grouped: Record<string, number> = {};
    txs.filter(t => t.amount > 0).forEach(t => {
      const key = t.merchant_name || t.name || 'Unknown';
      grouped[key] = (grouped[key] ?? 0) + t.amount;
    });
    return { type: 'grouped', rows: Object.entries(grouped).sort(([, a], [, b]) => b - a).slice(0, config.limit ?? 10).map(([name, value]) => ({ name, value })) };
  }

  if (config.groupBy === 'month') {
    const grouped: Record<string, { spent: number; income: number }> = {};
    txs.forEach(t => {
      const key = t.date?.slice(0, 7) || 'Unknown';
      if (!grouped[key]) grouped[key] = { spent: 0, income: 0 };
      if (t.amount > 0) grouped[key].spent += t.amount;
      else grouped[key].income += Math.abs(t.amount);
    });
    return { type: 'multi', rows: Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([name, v]) => ({ name, ...v })) };
  }

  // table fallback
  return {
    type: 'table',
    columns: ['Date', 'Description', 'Category', 'Amount'],
    rows: txs.slice(0, config.limit ?? 20).map(t => {
      const cl = data.classifications[t.transaction_id];
      const cat = cl?.userCategory || cl?.aiCategory || t.category?.[0] || '—';
      return [t.date, t.merchant_name || t.name, cat, fmtUSD2(Math.abs(t.amount))];
    }),
  };
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1f2e] border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {typeof p.value === 'number' ? fmtUSD(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// ── Main WidgetCard ───────────────────────────────────────────────────────────

export default function WidgetCard({ widget, data, onDelete, dragging, onDragStart, onDragOver, onDragEnd }: WidgetCardProps) {
  const computed = useMemo(() => computeWidgetData(widget, data), [widget, data]);

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`bg-[#11141B] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 transition-opacity ${dragging ? 'opacity-40' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        {onDragStart && <GripVertical size={14} className="text-slate-700 cursor-grab shrink-0" />}
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex-1 truncate">{widget.title}</p>
        {onDelete && (
          <button onClick={() => onDelete(widget.id)} className="text-slate-700 hover:text-red-400 transition-colors shrink-0">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Content */}
      <WidgetContent widget={widget} computed={computed} />
    </div>
  );
}

function WidgetContent({ widget, computed }: { widget: Widget; computed: any }) {
  if (computed.type === 'metric') {
    return (
      <div className="flex-1 flex flex-col justify-center">
        <p className="text-3xl font-black tabular-nums text-white">
          {computed.isCount ? computed.value.toLocaleString() : fmtUSD(computed.value)}
        </p>
      </div>
    );
  }

  if (computed.type === 'table') {
    return (
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800">
              {computed.columns.map((col: string) => (
                <th key={col} className="px-2 py-1.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {computed.rows.map((row: any[], i: number) => (
              <tr key={i} className="hover:bg-slate-800/20">
                {row.map((cell, j) => (
                  <td key={j} className="px-2 py-2 text-slate-300 font-mono whitespace-nowrap">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const rows = computed.rows || [];

  if (widget.type === 'pie') {
    return (
      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
              {rows.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
          {rows.slice(0, 6).map((r: any, i: number) => (
            <div key={i} className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="truncate max-w-[80px]">{r.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (widget.type === 'line') {
    if (computed.type === 'multi') {
      return (
        <div className="flex-1 min-h-[180px]">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={computed.rows} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `$${Math.round(v / 1000)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="spent" stroke="#ef4444" strokeWidth={2} dot={false} name="Spent" />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={false} name="Income" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }
    return (
      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `$${Math.round(v / 1000)}k`} />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} name={widget.title} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // bar (default for grouped)
  return (
    <div className="flex-1 min-h-[180px]">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
          <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `$${Math.round(v / 1000)}k`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={80} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {rows.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
