"use client";
export const dynamic = "force-dynamic";
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart2,
  Link,
  Settings,
  Receipt,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Sparkles,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { WorthIQLogoNav } from "../../components/WorthIQLogoNav";
import { markAppHeader, markSidebar, ringOffsetApp } from "../../lib/worthiq-logo-mark";
import { getApiBase } from "../../lib/api-base";

const COLS_KEY = "worthiq_tx_columns";

type SortDir = "asc" | "desc" | null;
type FlowTab = "spending" | "investments" | "all";

interface ColDef {
  key: string;
  label: string;
  visible: boolean;
  sortable: boolean;
}

const DEFAULT_COLS: ColDef[] = [
  { key: "flow", label: "Type", visible: true, sortable: true },
  { key: "date", label: "Date", visible: true, sortable: true },
  { key: "merchant", label: "Merchant / Security", visible: true, sortable: true },
  { key: "name", label: "Description", visible: false, sortable: false },
  { key: "amount", label: "Amount", visible: true, sortable: true },
  { key: "sage_cat", label: "Sage Category", visible: true, sortable: true },
  { key: "plaid_cat", label: "Bank / Activity", visible: false, sortable: false },
  { key: "institution", label: "Institution", visible: true, sortable: true },
  { key: "account", label: "Account", visible: false, sortable: false },
  { key: "pending", label: "Status", visible: true, sortable: false },
];

type Row = { kind: "spending"; t: any } | { kind: "investment"; t: any };

function rowId(row: Row): string {
  return row.kind === "spending" ? row.t.transaction_id : row.t.investment_transaction_id;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(n));
}
function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function TransactionsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [investmentTx, setInvestmentTx] = useState<any[]>([]);
  const [securities, setSecurities] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<Record<string, any>>({});
  const [cols, setCols] = useState<ColDef[]>(DEFAULT_COLS);
  const [flowTab, setFlowTab] = useState<FlowTab>("spending");
  const [showColMenu, setShowColMenu] = useState(false);
  const [sortKey, setSortKey] = useState<string>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [classifying, setClassifying] = useState(false);
  const [loadingTx, setLoadingTx] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editRef = useRef<HTMLInputElement>(null);
  const autoClassifyRan = useRef(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(COLS_KEY);
      if (saved) setCols(JSON.parse(saved));
    } catch {
      /* ignore */
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
      return;
    }

    const end = toDateStr(new Date());
    const start = toDateStr(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));

    Promise.all([
      fetch(`${getApiBase()}/plaid/transactions?startDate=${start}&endDate=${end}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(
        `${getApiBase()}/plaid/investment-transactions?startDate=${start}&endDate=${end}`,
        { headers: { Authorization: `Bearer ${token}` } },
      ).then((r) => r.json()),
      fetch(`${getApiBase()}/plaid/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${getApiBase()}/sage/classifications`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([txData, invData, accData, classData]) => {
        setTransactions(txData.transactions || []);
        setInvestmentTx(invData.investmentTransactions || []);
        setSecurities(invData.securities || []);
        setAccounts(accData.accounts || []);
        setClassifications(classData.classifications || {});
      })
      .catch(console.error)
      .finally(() => setLoadingTx(false));
  }, [router]);

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  const secById = useMemo(() => new Map(securities.map((s) => [s.security_id, s])), [securities]);

  const accountMap = useMemo(() => {
    const m: Record<string, string> = {};
    accounts.forEach((a) => {
      m[a.account_id] = a.name;
    });
    return m;
  }, [accounts]);

  const getCategory = useCallback(
    (id: string) => {
      const cls = classifications[id];
      return cls?.userCategory || cls?.aiCategory || null;
    },
    [classifications],
  );

  const buildSlimPayload = useCallback(() => {
    const slimSpend = transactions.map((t) => ({
      transaction_id: t.transaction_id,
      name: t.name,
      merchant_name: t.merchant_name ?? null,
      amount: t.amount,
      category: t.category ?? null,
    }));
    const slimInv = investmentTx.map((t) => {
      const sec = secById.get(t.security_id);
      return {
        investment_transaction_id: t.investment_transaction_id,
        name: t.name,
        amount: t.amount,
        type: t.type,
        subtype: t.subtype,
        ticker_symbol: sec?.ticker_symbol ?? null,
      };
    });
    return { slimSpend, slimInv };
  }, [transactions, investmentTx, secById]);

  const runClassify = useCallback(
    async (force: boolean) => {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const { slimSpend, slimInv } = buildSlimPayload();
      if (slimSpend.length === 0 && slimInv.length === 0) return;
      setClassifying(true);
      try {
        const res = await fetch(`${getApiBase()}/sage/classify`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            transactions: slimSpend,
            investment_transactions: slimInv,
            force,
          }),
        });
        if (!res.ok) {
          console.error("Classify failed:", res.status, await res.text());
          return;
        }
        const data = await res.json();
        setClassifications((prev) => ({ ...prev, ...(data.classifications || {}) }));
      } catch (err) {
        console.error("Classify error:", err);
      } finally {
        setClassifying(false);
      }
    },
    [buildSlimPayload],
  );

  useEffect(() => {
    if (!mounted || loadingTx || autoClassifyRan.current) return;
    autoClassifyRan.current = true;
    const { slimSpend, slimInv } = buildSlimPayload();
    if (slimSpend.length === 0 && slimInv.length === 0) return;
    runClassify(false);
  }, [mounted, loadingTx, buildSlimPayload, runClassify]);

  const saveCols = (next: ColDef[]) => {
    setCols(next);
    localStorage.setItem(COLS_KEY, JSON.stringify(next));
  };

  const toggleCol = (key: string) => {
    saveCols(cols.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const baseRows = useMemo((): Row[] => {
    if (flowTab === "spending") return transactions.map((t) => ({ kind: "spending" as const, t }));
    if (flowTab === "investments")
      return investmentTx.map((t) => ({ kind: "investment" as const, t }));
    return [
      ...transactions.map((t) => ({ kind: "spending" as const, t })),
      ...investmentTx.map((t) => ({ kind: "investment" as const, t })),
    ];
  }, [flowTab, transactions, investmentTx]);

  const filteredRows = useMemo(() => {
    if (!search) return baseRows;
    const q = search.toLowerCase();
    return baseRows.filter((row) => {
      const id = rowId(row);
      const cat = (classifications[id]?.userCategory || classifications[id]?.aiCategory || "").toLowerCase();
      if (row.kind === "spending") {
        return (
          (row.t.merchant_name || "").toLowerCase().includes(q) ||
          (row.t.name || "").toLowerCase().includes(q) ||
          cat.includes(q)
        );
      }
      const sec = secById.get(row.t.security_id);
      return (
        (sec?.ticker_symbol || "").toLowerCase().includes(q) ||
        (sec?.name || "").toLowerCase().includes(q) ||
        (row.t.name || "").toLowerCase().includes(q) ||
        cat.includes(q)
      );
    });
  }, [baseRows, search, classifications, secById]);

  const sortedRows = useMemo(() => {
    const sortVal = (row: Row, key: string): string | number => {
      const id = rowId(row);
      if (key === "flow") return row.kind === "spending" ? "a" : "b";
      if (key === "date") return row.t.date || "";
      if (key === "merchant") {
        if (row.kind === "spending")
          return (row.t.merchant_name || row.t.name || "").toLowerCase();
        const sec = secById.get(row.t.security_id);
        return (sec?.ticker_symbol || sec?.name || row.t.name || "").toLowerCase();
      }
      if (key === "amount") return Math.abs(Number(row.t.amount) || 0);
      if (key === "sage_cat") return (getCategory(id) || "").toLowerCase();
      if (key === "institution") return (row.t.institution || "").toLowerCase();
      return "";
    };

    let rows = [...filteredRows];
    if (sortDir && sortKey) {
      rows.sort((a, b) => {
        const va = sortVal(a, sortKey);
        const vb = sortVal(b, sortKey);
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [filteredRows, sortKey, sortDir, secById, getCategory]);

  const spendUnclassified = useMemo(
    () => transactions.filter((t) => !classifications[t.transaction_id]?.aiCategory).length,
    [transactions, classifications],
  );
  const invUnclassified = useMemo(
    () => investmentTx.filter((t) => !classifications[t.investment_transaction_id]?.aiCategory).length,
    [investmentTx, classifications],
  );

  const visibleCols = useMemo(
    () =>
      cols.filter((c) => c.visible && !(c.key === "flow" && flowTab !== "all")),
    [cols, flowTab],
  );

  const startEdit = (id: string, current: string | null) => {
    setEditingId(id);
    setEditValue(current || "");
  };

  const commitEdit = async (id: string) => {
    if (!editValue.trim()) {
      setEditingId(null);
      return;
    }
    const token = localStorage.getItem("authToken");
    try {
      await fetch(`${getApiBase()}/sage/classifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category: editValue.trim() }),
      });
      setClassifications((prev) => ({
        ...prev,
        [id]: { ...(prev[id] || {}), transactionId: id, userCategory: editValue.trim() },
      }));
    } catch (err) {
      console.error("Save category error:", err);
    } finally {
      setEditingId(null);
    }
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey || !sortDir) return <ChevronsUpDown size={12} className="opacity-30" />;
    return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const hasAnyData = transactions.length > 0 || investmentTx.length > 0;
  const sageClassifiedSpend = transactions.filter((t) => classifications[t.transaction_id]?.aiCategory).length;
  const sageClassifiedInv = investmentTx.filter((t) => classifications[t.investment_transaction_id]?.aiCategory)
    .length;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0A0C10] text-slate-300 flex">
      <aside className="w-20 lg:w-64 border-r border-slate-800 flex flex-col items-center lg:items-start p-6 gap-8 shrink-0">
        <WorthIQLogoNav className={markSidebar} wrapperClassName={ringOffsetApp} />
        <nav className="flex-1 w-full space-y-1">
          <NavItem icon={<LayoutDashboard size={19} />} label="Dashboard" onClick={() => router.push("/dashboard")} />
          <NavItem icon={<BarChart2 size={19} />} label="Views" onClick={() => router.push("/views")} />
          <NavItem icon={<Receipt size={19} />} label="Transactions" active />
          <NavItem icon={<Link size={19} />} label="Manage Accounts" onClick={() => router.push("/connect")} />
          <NavItem icon={<Settings size={19} />} label="Settings" />
        </nav>
        <div
          onClick={() => {
            localStorage.removeItem("authToken");
            router.push("/login");
          }}
          className="flex items-center gap-3 text-slate-700 hover:text-red-400 px-3 py-2 rounded-xl cursor-pointer transition-colors text-xs font-mono w-full"
        >
          <span className="hidden lg:block">[LOGOUT]</span>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-10 overflow-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
          <div>
            <WorthIQLogoNav className={markAppHeader} wrapperClassName={ringOffsetApp} />
            <h1 className="mt-4 text-4xl font-black italic tracking-tighter text-white">Transactions</h1>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-worthiq-cyan">
              Spending & investments · last 90 days
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => runClassify(true)}
              disabled={classifying || !hasAnyData}
              className="flex items-center gap-2 border border-slate-600 bg-slate-800/50 hover:bg-slate-800 disabled:opacity-40 text-slate-200 px-4 py-2 rounded-xl font-bold text-sm transition-all"
            >
              <Sparkles size={15} className="text-purple-400" />
              {classifying ? "Sage is working…" : "Reset to Sage classifications"}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColMenu((v) => !v)}
                className="flex items-center gap-2 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 px-4 py-2 rounded-xl font-bold text-sm transition-all"
              >
                <SlidersHorizontal size={15} />
                Columns
              </button>
              {showColMenu && (
                <div className="absolute right-0 top-10 z-50 bg-[#11141B] border border-slate-700 rounded-xl p-3 w-52 shadow-2xl space-y-1">
                  {cols.map((c) => (
                    <label
                      key={c.key}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer text-sm"
                    >
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

        {!loadingTx && hasAnyData && (
          <div className="flex flex-wrap gap-2 mb-4">
            {(
              [
                ["spending", `Spending (${transactions.length})`],
                ["investments", `Investments (${investmentTx.length})`],
                ["all", `All (${transactions.length + investmentTx.length})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFlowTab(key)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                  flowTab === key
                    ? "bg-white text-black"
                    : "border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {classifying && (
          <p className="text-[11px] font-mono text-purple-400/90 mb-3 flex items-center gap-2">
            <Sparkles size={12} />
            Sage is classifying new activity in the background…
          </p>
        )}

        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Search merchant, ticker, description, or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#11141B] border border-slate-800 text-white text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-700"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {!loadingTx && hasAnyData && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-[11px] font-mono text-slate-600">
            <span>
              {sortedRows.length} shown
              {flowTab === "all" ? ` · ${transactions.length} spending · ${investmentTx.length} investment` : ""}
            </span>
            <span>·</span>
            <span className="text-green-500">
              Sage: {sageClassifiedSpend} spending · {sageClassifiedInv} investment
            </span>
            {(spendUnclassified > 0 || invUnclassified > 0) && (
              <>
                <span>·</span>
                <span className="text-yellow-500">
                  Pending: {spendUnclassified} spend · {invUnclassified} inv
                </span>
              </>
            )}
          </div>
        )}

        {loadingTx ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-slate-600 font-mono text-sm animate-pulse">Loading transactions…</p>
          </div>
        ) : !hasAnyData ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-2xl">
            <Receipt size={36} className="text-slate-700 mb-3" />
            <p className="text-slate-500 font-bold mb-1">No activity in the last 90 days</p>
            <p className="text-slate-600 text-sm">Connect accounts to see spending and investment activity.</p>
          </div>
        ) : (
          <div className="bg-[#11141B] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {visibleCols.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => col.sortable && handleSort(col.key)}
                        className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap select-none ${
                          col.sortable ? "cursor-pointer hover:text-slate-300" : ""
                        }`}
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
                  {sortedRows.map((row, i) => {
                    const id = rowId(row);
                    const cls = classifications[id];
                    const category = cls?.userCategory || cls?.aiCategory;
                    const isUserOverride = !!cls?.userCategory;
                    const isEditing = editingId === id;
                    const sec = row.kind === "investment" ? secById.get(row.t.security_id) : null;

                    return (
                      <tr key={`${row.kind}-${id || i}`} className="hover:bg-slate-800/30 transition-colors">
                        {visibleCols.map((col) => (
                          <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                            {col.key === "flow" && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  row.kind === "spending"
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : "bg-violet-500/15 text-violet-300"
                                }`}
                              >
                                {row.kind === "spending" ? "Spending" : "Investment"}
                              </span>
                            )}

                            {col.key === "date" && (
                              <span className="text-slate-400 font-mono text-xs">{row.t.date}</span>
                            )}

                            {col.key === "merchant" && (
                              <span className="text-white font-medium truncate max-w-[180px] block">
                                {row.kind === "spending"
                                  ? row.t.merchant_name || row.t.name || "—"
                                  : sec?.ticker_symbol || sec?.name || row.t.name || "—"}
                              </span>
                            )}

                            {col.key === "name" && (
                              <span className="text-slate-400 text-xs truncate max-w-[200px] block">
                                {row.kind === "spending"
                                  ? row.t.name
                                  : [sec?.name, row.t.name].filter(Boolean).join(" · ") || "—"}
                              </span>
                            )}

                            {col.key === "amount" && (
                              <span
                                className={`font-mono font-bold ${row.t.amount < 0 ? "text-green-400" : "text-white"}`}
                              >
                                {row.t.amount < 0 ? "+" : "-"}
                                {fmt(row.t.amount)}
                              </span>
                            )}

                            {col.key === "sage_cat" &&
                              (isEditing ? (
                                <input
                                  ref={editRef}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => commitEdit(id)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") commitEdit(id);
                                    if (e.key === "Escape") setEditingId(null);
                                  }}
                                  className="bg-slate-800 border border-blue-500 text-white text-xs rounded-lg px-2 py-1 outline-none w-40"
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEdit(id, category)}
                                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
                                    category
                                      ? isUserOverride
                                        ? "bg-blue-500/10 border-blue-500/40 text-blue-300"
                                        : "bg-purple-500/10 border-purple-500/30 text-purple-300"
                                      : "bg-slate-800 border-slate-700 text-slate-600 hover:text-slate-400"
                                  }`}
                                >
                                  {isUserOverride && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                                  {!isUserOverride && category && (
                                    <Sparkles size={10} className="text-purple-400 shrink-0" />
                                  )}
                                  {category || "Add category"}
                                </button>
                              ))}

                            {col.key === "plaid_cat" && (
                              <span className="text-slate-500 text-xs">
                                {row.kind === "spending"
                                  ? row.t.category?.[0] || "—"
                                  : row.t.subtype || row.t.type || "—"}
                              </span>
                            )}

                            {col.key === "institution" && (
                              <span className="text-slate-400 text-xs">{row.t.institution || "—"}</span>
                            )}

                            {col.key === "account" && (
                              <span className="text-slate-400 text-xs">
                                {row.kind === "spending" ? accountMap[row.t.account_id] || "—" : "—"}
                              </span>
                            )}

                            {col.key === "pending" &&
                              (row.kind === "spending" ? (
                                row.t.pending ? (
                                  <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                                    Pending
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                                    Posted
                                  </span>
                                )
                              ) : (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                                  Settled
                                </span>
                              ))}
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

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
        active ? "text-blue-400 bg-blue-500/10" : "text-slate-500 hover:text-white"
      }`}
    >
      {icon}
      <span className="hidden lg:block font-semibold text-sm">{label}</span>
    </div>
  );
}
