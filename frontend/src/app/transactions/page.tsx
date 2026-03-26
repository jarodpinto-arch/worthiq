"use client";
export const dynamic = "force-dynamic";
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, BarChart2, Link, Settings, Receipt,
  ChevronUp, ChevronDown, ChevronsUpDown, Sparkles, Search, SlidersHorizontal, X,
} from 'lucide-react';
import { WorthIQLogoNav } from '../../components/WorthIQLogoNav';
import { getApiBase } from '../../lib/api-base';
const COLS_KEY = 'worthiq_tx_columns';

type SortDir = 'asc' | 'desc' | null;

interface ColDef {
  key: string;
  label: string;
  visible: boolean;
  sortable: boolean;
}

const DEFAULT_COLS: ColDef[] = [
  { key: 'date',         label: 'Date',            visible: true,  sortable: true  },
  { key: 'merchant',     label: 'Merchant',         visible: true,  sortable: true  },
  { key: 'name',         label: 'Description',      visible: false, sortable: false },
  { key: 'amount',       label: 'Amount',           visible: true,  sortable: true  },
  { key: 'sage_cat',     label: 'Sage Category',    visible: true,  sortable: true  },
  { key: 'plaid_cat',    label: 'Plaid Category',   visible: false, sortable: false },
  { key: 'institution',  label: 'Institution',      visible: true,  sortable: true  },
  { key: 'account',      label: 'Account',          visible: false, sortable: false },
  { key: 'pending',      label: 'Status',           visible: true,  sortable: false },
];

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(n));
}
function toDateStr(d: Date) { return d.toISOString().split('T')[0]; }

export default function TransactionsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<Record<string, any>>({});
  const [cols, setCols] = useState<ColDef[]>(DEFAULT_COLS);
  const [showColMenu, setShowColMenu] = useState(false);
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');
  const [classifying, setClassifying] = useState(false);
  const [loadingTx, setLoadingTx] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(COLS_KEY);
      if (saved) setCols(JSON.parse(saved));
    } catch {}

    const token = localStorage.getItem('authToken');
    if (!token) { router.push('/login'); return; }

    const end   = toDateStr(new Date());
    const start = toDateStr(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));

    Promise.all([
      fetch(`${getApiBase()}/plaid/transactions?startDate=${start}&endDate=${end}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch(`${getApiBase()}/plaid/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch(`${getApiBase()}/sage/classifications`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
    ])
      .then(([txData, accData, classData]) => {
        setTransactions(txData.transactions || []);
        setAccounts(accData.accounts || []);
        setClassifications(classData.classifications || {});
      })
      .catch(console.error)
      .finally(() => setLoadingTx(false));
  }, [router]);

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  const accountMap = useMemo(() => {
    const m: Record<string, string> = {};
    accounts.forEach(a => { m[a.account_id] = a.name; });
    return m;
  }, [accounts]);

  // Effective category: user override > AI category > —
  const getCategory = useCallback((tx: any) => {
    const cls = classifications[tx.transaction_id];
    return cls?.userCategory || cls?.aiCategory || null;
  }, [classifications]);

  const saveCols = (next: ColDef[]) => {
    setCols(next);
    localStorage.setItem(COLS_KEY, JSON.stringify(next));
  };

  const toggleCol = (key: string) => {
    saveCols(cols.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => {
    let rows = transactions.filter(t => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (t.merchant_name || '').toLowerCase().includes(q) ||
        (t.name || '').toLowerCase().includes(q) ||
        (getCategory(t) || '').toLowerCase().includes(q)
      );
    });

    if (sortDir && sortKey) {
      rows = [...rows].sort((a, b) => {
        let va: any, vb: any;
        if (sortKey === 'date')        { va = a.date; vb = b.date; }
        else if (sortKey === 'merchant') { va = (a.merchant_name || a.name || '').toLowerCase(); vb = (b.merchant_name || b.name || '').toLowerCase(); }
        else if (sortKey === 'amount')   { va = Math.abs(a.amount); vb = Math.abs(b.amount); }
        else if (sortKey === 'sage_cat') { va = getCategory(a) || ''; vb = getCategory(b) || ''; }
        else if (sortKey === 'institution') { va = a.institution || ''; vb = b.institution || ''; }
        else return 0;
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [transactions, search, sortKey, sortDir, getCategory]);

  const unclassifiedCount = useMemo(
    () => transactions.filter(t => !classifications[t.transaction_id]?.aiCategory).length,
    [transactions, classifications],
  );

  const classifyWithSage = async () => {
    const token = localStorage.getItem('authToken');
    if (!token || transactions.length === 0) return;
    setClassifying(true);
    try {
      // Only send the minimal fields Sage needs — keeps payload small
      const slim = transactions.map(t => ({
        transaction_id: t.transaction_id,
        name:           t.name,
        merchant_name:  t.merchant_name ?? null,
        amount:         t.amount,
        category:       t.category ?? null,
      }));
      const res = await fetch(`${getApiBase()}/sage/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transactions: slim }),
      });
      if (!res.ok) {
        console.error('Classify failed:', res.status, await res.text());
        return;
      }
      const data = await res.json();
      setClassifications(data.classifications || {});
    } catch (err) {
      console.error('Classify error:', err);
    } finally {
      setClassifying(false);
    }
  };

  const startEdit = (txId: string, current: string | null) => {
    setEditingId(txId);
    setEditValue(current || '');
  };

  const commitEdit = async (txId: string) => {
    if (!editValue.trim()) { setEditingId(null); return; }
    const token = localStorage.getItem('authToken');
    try {
      await fetch(`${getApiBase()}/sage/classifications/${txId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category: editValue.trim() }),
      });
      setClassifications(prev => ({
        ...prev,
        [txId]: { ...(prev[txId] || {}), transactionId: txId, userCategory: editValue.trim() },
      }));
    } catch (err) {
      console.error('Save category error:', err);
    } finally {
      setEditingId(null);
    }
  };

  const visibleCols = cols.filter(c => c.visible);

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey || !sortDir) return <ChevronsUpDown size={12} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0A0C10] text-slate-300 flex">
      {/* ── SIDEBAR ── */}
      <aside className="w-20 lg:w-64 border-r border-slate-800 flex flex-col items-center lg:items-start p-6 gap-8 shrink-0">
        <WorthIQLogoNav
          className="w-10 lg:w-32"
          wrapperClassName="rounded-lg p-1 focus-visible:ring-offset-[#0A0C10]"
        />
        <nav className="flex-1 w-full space-y-1">
          <NavItem icon={<LayoutDashboard size={19} />} label="Dashboard"    onClick={() => router.push('/dashboard')} />
          <NavItem icon={<BarChart2 size={19} />}       label="Views"        onClick={() => router.push('/views')} />
          <NavItem icon={<Receipt size={19} />}         label="Transactions" active />
          <NavItem icon={<Link size={19} />}            label="Manage Accounts" onClick={() => router.push('/connect')} />
          <NavItem icon={<Settings size={19} />}        label="Settings" />
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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-white">Transactions</h1>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-worthiq-cyan">Last 90 days</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Classify with Sage */}
            <button
              onClick={classifyWithSage}
              disabled={classifying || transactions.length === 0}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all"
            >
              <Sparkles size={15} />
              {classifying
                ? 'Classifying...'
                : unclassifiedCount > 0
                  ? `Classify ${unclassifiedCount} with Sage`
                  : 'Re-classify with Sage'}
            </button>

            {/* Column picker */}
            <div className="relative">
              <button
                onClick={() => setShowColMenu(v => !v)}
                className="flex items-center gap-2 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 px-4 py-2 rounded-xl font-bold text-sm transition-all"
              >
                <SlidersHorizontal size={15} />
                Columns
              </button>
              {showColMenu && (
                <div className="absolute right-0 top-10 z-50 bg-[#11141B] border border-slate-700 rounded-xl p-3 w-52 shadow-2xl space-y-1">
                  {cols.map(c => (
                    <label key={c.key} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={c.visible}
                        onChange={() => toggleCol(c.key)}
                        className="accent-blue-500"
                      />
                      <span className="text-slate-300">{c.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Search merchant, description, or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#11141B] border border-slate-800 text-white text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-700"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Stats row */}
        {!loadingTx && transactions.length > 0 && (
          <div className="flex items-center gap-4 mb-4 text-[11px] font-mono text-slate-600">
            <span>{sorted.length} of {transactions.length} transactions</span>
            <span>·</span>
            <span className="text-green-500">{transactions.filter(t => classifications[t.transaction_id]?.aiCategory).length} classified by Sage</span>
            {unclassifiedCount > 0 && <><span>·</span><span className="text-yellow-500">{unclassifiedCount} unclassified</span></>}
          </div>
        )}

        {/* Table */}
        {loadingTx ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-slate-600 font-mono text-sm animate-pulse">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-2xl">
            <Receipt size={36} className="text-slate-700 mb-3" />
            <p className="text-slate-500 font-bold mb-1">No transactions found</p>
            <p className="text-slate-600 text-sm">Connect a bank account to see transactions.</p>
          </div>
        ) : (
          <div className="bg-[#11141B] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {visibleCols.map(col => (
                      <th
                        key={col.key}
                        onClick={() => col.sortable && handleSort(col.key)}
                        className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap select-none ${col.sortable ? 'cursor-pointer hover:text-slate-300' : ''}`}
                      >
                        <span className="flex items-center gap-1.5">
                          {col.label}
                          {col.sortable && <SortIcon colKey={col.key} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {sorted.map((tx, i) => {
                    const cls = classifications[tx.transaction_id];
                    const category = cls?.userCategory || cls?.aiCategory;
                    const isUserOverride = !!cls?.userCategory;
                    const isEditing = editingId === tx.transaction_id;

                    return (
                      <tr key={tx.transaction_id || i} className="hover:bg-slate-800/30 transition-colors">
                        {visibleCols.map(col => (
                          <td key={col.key} className="px-4 py-3 whitespace-nowrap">

                            {col.key === 'date' && (
                              <span className="text-slate-400 font-mono text-xs">{tx.date}</span>
                            )}

                            {col.key === 'merchant' && (
                              <span className="text-white font-medium truncate max-w-[160px] block">
                                {tx.merchant_name || tx.name || '—'}
                              </span>
                            )}

                            {col.key === 'name' && (
                              <span className="text-slate-400 text-xs truncate max-w-[200px] block">{tx.name}</span>
                            )}

                            {col.key === 'amount' && (
                              <span className={`font-mono font-bold ${tx.amount < 0 ? 'text-green-400' : 'text-white'}`}>
                                {tx.amount < 0 ? '+' : '-'}{fmt(tx.amount)}
                              </span>
                            )}

                            {col.key === 'sage_cat' && (
                              isEditing ? (
                                <input
                                  ref={editRef}
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  onBlur={() => commitEdit(tx.transaction_id)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') commitEdit(tx.transaction_id);
                                    if (e.key === 'Escape') setEditingId(null);
                                  }}
                                  className="bg-slate-800 border border-blue-500 text-white text-xs rounded-lg px-2 py-1 outline-none w-36"
                                />
                              ) : (
                                <button
                                  onClick={() => startEdit(tx.transaction_id, category)}
                                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
                                    category
                                      ? isUserOverride
                                        ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                                        : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                                      : 'bg-slate-800 border-slate-700 text-slate-600 hover:text-slate-400'
                                  }`}
                                >
                                  {isUserOverride && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                                  {!isUserOverride && category && <Sparkles size={10} className="text-purple-400 shrink-0" />}
                                  {category || 'Add category'}
                                </button>
                              )
                            )}

                            {col.key === 'plaid_cat' && (
                              <span className="text-slate-500 text-xs">{tx.category?.[0] || '—'}</span>
                            )}

                            {col.key === 'institution' && (
                              <span className="text-slate-400 text-xs">{tx.institution || '—'}</span>
                            )}

                            {col.key === 'account' && (
                              <span className="text-slate-400 text-xs">{accountMap[tx.account_id] || '—'}</span>
                            )}

                            {col.key === 'pending' && (
                              tx.pending
                                ? <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">Pending</span>
                                : <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">Posted</span>
                            )}

                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: {
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
