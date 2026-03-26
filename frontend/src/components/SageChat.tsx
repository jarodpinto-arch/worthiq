"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Trash2, Sparkles, ChevronDown, Plus, Loader2 } from 'lucide-react';
import WidgetCard from './WidgetCard';
import { getApiBase } from '../lib/api-base';

interface TextMessage {
  role: 'user' | 'assistant';
  content: string;
  widgetPreview?: never;
}

interface WidgetMessage {
  role: 'assistant';
  content: string;
  widgetPreview: any;
}

type Message = TextMessage | WidgetMessage;

// Phrases that signal widget creation intent
const WIDGET_TRIGGERS = [
  'create widget', 'build widget', 'add widget', 'make widget', 'show widget',
  'create a widget', 'build a widget', 'add a widget', 'make a widget', 'show a widget',
  'create chart', 'build chart', 'add chart', 'make chart',
  'create a chart', 'build a chart', 'show chart', 'show a chart',
  'add to dashboard', 'put on dashboard', 'add this to dashboard',
  'widget for', 'chart for', 'graph for',
];

function isWidgetRequest(text: string) {
  const lower = text.toLowerCase();
  return WIDGET_TRIGGERS.some(t => lower.includes(t));
}

function toDateStr(d: Date) { return d.toISOString().split('T')[0]; }

export default function SageChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);
  const [savedWidgetIds, setSavedWidgetIds] = useState<Set<number>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const buildContext = useCallback(async (token: string) => {
    try {
      const end   = toDateStr(new Date());
      const start = toDateStr(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));

      const [accRes, txRes] = await Promise.all([
        fetch(`${getApiBase()}/plaid/accounts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiBase()}/plaid/transactions?startDate=${start}&endDate=${end}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [accData, txData] = await Promise.all([accRes.json(), txRes.json()]);
      const accounts     = accData.accounts || [];
      const transactions = txData.transactions || [];

      const cash        = accounts.filter((a: any) => a.type === 'depository');
      const credit      = accounts.filter((a: any) => a.type === 'credit');
      const investments = accounts.filter((a: any) => a.type === 'investment');

      const totalCash        = cash.reduce((s: number, a: any) => s + (a.balances.current ?? 0), 0);
      const totalCredit      = credit.reduce((s: number, a: any) => s + (a.balances.current ?? 0), 0);
      const totalInvestments = investments.reduce((s: number, a: any) => s + (a.balances.current ?? 0), 0);

      const spending = transactions.filter((t: any) => t.amount > 0 && !t.pending);
      const catMap: Record<string, number> = {};
      spending.forEach((t: any) => {
        const cat = t.category?.[0] || 'Other';
        catMap[cat] = (catMap[cat] || 0) + t.amount;
      });
      const topCategories = Object.entries(catMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([cat, total]) => ({ category: cat, total: +total.toFixed(2) }));

      const totalSpent  = spending.reduce((s: number, t: any) => s + t.amount, 0);
      const totalIncome = transactions
        .filter((t: any) => t.amount < 0 && !t.pending)
        .reduce((s: number, t: any) => s + Math.abs(t.amount), 0);

      return {
        summary: {
          netWorth: +(totalCash + totalInvestments - totalCredit).toFixed(2),
          totalCash: +totalCash.toFixed(2),
          totalCreditOutstanding: +totalCredit.toFixed(2),
          totalInvestments: +totalInvestments.toFixed(2),
        },
        accounts: accounts.map((a: any) => ({
          name: a.name,
          type: a.type,
          subtype: a.subtype,
          institution: a.institution,
          balance: a.balances.current,
          limit: a.balances.limit ?? null,
        })),
        last90Days: {
          totalSpent: +totalSpent.toFixed(2),
          totalIncome: +totalIncome.toFixed(2),
          transactionCount: spending.length,
          topCategories,
        },
        recentTransactions: transactions.slice(0, 15).map((t: any) => ({
          date: t.date,
          merchant: t.merchant_name || t.name,
          amount: t.amount,
          category: t.category?.[0],
        })),
        rawAccounts: accounts,
        rawTransactions: transactions.slice(0, 50),
      };
    } catch {
      return {};
    }
  }, []);

  const initChat = useCallback(async () => {
    if (initialized) return;
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const [histRes, ctx] = await Promise.all([
        fetch(`${getApiBase()}/sage/chat`, { headers: { Authorization: `Bearer ${token}` } }),
        buildContext(token),
      ]);
      const hist = await histRes.json();
      setMessages(Array.isArray(hist) ? hist.map((m: any) => ({ role: m.role, content: m.content })) : []);
      setContext(ctx);
      setInitialized(true);
    } catch {}
  }, [initialized, buildContext]);

  const handleOpen = () => {
    setOpen(true);
    initChat();
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const token = localStorage.getItem('authToken');
    if (!token) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      if (isWidgetRequest(text)) {
        // Route to widget creation
        const res = await fetch(`${getApiBase()}/sage/create-widget`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ prompt: text, context }),
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: `I built a **${data.widget.title}** widget for you. Add it to your dashboard?`,
              widgetPreview: data.widget,
            } as WidgetMessage,
          ]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: 'I had trouble creating that widget. Try describing it differently.' }]);
        }
      } else {
        // Regular chat
        const res = await fetch(`${getApiBase()}/sage/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: text, context }),
        });
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection lost. Try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const saveWidget = async (widget: any, msgIdx: number) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      const res = await fetch(`${getApiBase()}/widgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: widget.type, title: widget.title, config: widget.config }),
      });
      if (res.ok) {
        setSavedWidgetIds(prev => { const next = new Set(prev); next.add(msgIdx); return next; });
      }
    } catch {}
  };

  const clearChat = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    await fetch(`${getApiBase()}/sage/chat`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setMessages([]);
    setSavedWidgetIds(new Set());
  };

  // Build a minimal FinancialData object from context for WidgetCard
  const finData = {
    accounts: context?.rawAccounts || [],
    transactions: context?.rawTransactions || [],
    investmentTx: [],
    securities: [],
    classifications: {},
  };

  return (
    <>
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-4 py-3 rounded-2xl font-bold text-sm shadow-2xl transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles size={16} />
          <span>Sage</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[400px] h-[600px] bg-[#0D1117] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#11141B] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Sparkles size={13} className="text-white" />
              </div>
              <div>
                <p className="text-white font-black text-sm italic tracking-tight">Sage</p>
                <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Financial Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear chat"
                className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-600 hover:text-white p-1.5 rounded-lg transition-colors"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/20 flex items-center justify-center mb-3">
                  <Sparkles size={20} className="text-purple-400" />
                </div>
                <p className="text-white font-bold text-sm mb-1">Ask Sage anything</p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Your personal financial AI. Ask about spending, net worth, investments — or say "build me a widget" to add custom charts to your dashboard.
                </p>
                <div className="mt-4 space-y-2 w-full">
                  {[
                    "What's my net worth?",
                    "Where am I spending the most?",
                    "Build a chart of my spending by category",
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); inputRef.current?.focus(); }}
                      className="w-full text-left text-xs text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-start gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {m.role === 'assistant' && (
                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mt-0.5 shrink-0">
                      <Sparkles size={10} className="text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] text-sm rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-[#1a1f2e] border border-slate-700/50 text-slate-200 rounded-bl-sm'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>

                {/* Widget preview inline */}
                {m.role === 'assistant' && m.widgetPreview && (
                  <div className="ml-7 mt-2 w-full max-w-[320px]">
                    <WidgetCard
                      widget={{ id: `preview-${i}`, ...m.widgetPreview }}
                      data={finData}
                    />
                    <button
                      onClick={() => saveWidget(m.widgetPreview, i)}
                      disabled={savedWidgetIds.has(i)}
                      className={`mt-2 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                        savedWidgetIds.has(i)
                          ? 'bg-green-600/20 text-green-400 border border-green-600/30 cursor-default'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {savedWidgetIds.has(i) ? (
                        <><span>✓</span> Added to Dashboard</>
                      ) : (
                        <><Plus size={12} /> Add to Dashboard</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                  <Sparkles size={10} className="text-white" />
                </div>
                <div className="bg-[#1a1f2e] border border-slate-700/50 text-slate-400 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-slate-800 bg-[#11141B] shrink-0">
            <div className="flex items-end gap-2 bg-[#0D1117] border border-slate-700 rounded-xl px-3 py-2 focus-within:border-blue-500 transition-colors">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                placeholder='Ask Sage or "build me a widget..."'
                className="flex-1 bg-transparent text-white text-sm resize-none outline-none placeholder-slate-600 max-h-24"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-black transition-all hover:bg-slate-100 disabled:opacity-30"
              >
                {loading ? <Loader2 size={12} className="animate-spin text-black/60" /> : <Send size={13} className="text-black" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-700 text-center mt-2">Sage · WorthIQ™ Financial AI</p>
          </div>
        </div>
      )}
    </>
  );
}
