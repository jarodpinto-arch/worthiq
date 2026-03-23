"use client";
import React, { useCallback, useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Wallet, CreditCard, TrendingUp, ChevronLeft, Trash2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const TYPE_ICON: Record<string, React.ReactNode> = {
  depository: <Wallet    size={15} className="text-green-400" />,
  credit:     <CreditCard size={15} className="text-red-400" />,
  investment: <TrendingUp size={15} className="text-purple-400" />,
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n);
}

// Isolated so usePlaidLink only mounts when token is ready — prevents duplicate script injection
function PlaidButton({
  token, hasAccounts, onSuccess,
}: {
  token: string;
  hasAccounts: boolean;
  onSuccess: (public_token: string) => void;
}) {
  const { open, ready } = usePlaidLink({ token, onSuccess });
  return (
    <button
      onClick={() => open()}
      disabled={!ready}
      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-40 text-sm shadow-xl"
    >
      <Plus size={17} />
      {hasAccounts ? 'Add Another Bank or Brokerage' : 'Connect Bank via Plaid'}
    </button>
  );
}

export default function ConnectPage() {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) { router.push('/login'); return; }

    try {
      const [accountsRes, tokenRes] = await Promise.all([
        fetch(`${API_URL}/plaid/accounts`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${API_URL}/plaid/create-link-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        }),
      ]);

      if (accountsRes.ok) {
        const data = await accountsRes.json();
        const accs = data.accounts || [];
        setAccounts(accs);

        // Build items list (unique institutions) from accounts
        const institutionMap: Record<string, { institution: string; accounts: any[] }> = {};
        accs.forEach((a: any) => {
          const key = a.institution || 'Unknown';
          if (!institutionMap[key]) institutionMap[key] = { institution: key, accounts: [] };
          institutionMap[key].accounts.push(a);
        });
        setItems(Object.values(institutionMap));
      }

      if (tokenRes.ok) {
        const data = await tokenRes.json();
        setLinkToken(data.link_token);
      } else {
        setError('Could not initialize Plaid. Check your backend credentials.');
      }
    } catch {
      setError('Could not connect to backend.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onSuccess = useCallback(async (public_token: string) => {
    const authToken = localStorage.getItem('authToken');
    try {
      await fetch(`${API_URL}/plaid/exchange-public-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ public_token }),
      });
      router.push('/dashboard');
    } catch {
      setError('Failed to link bank account. Please try again.');
    }
  }, [router]);

  const disconnect = async (institution: string) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    setDisconnecting(institution);
    try {
      // Find account_id for this institution to get plaid item id
      // We need to hit the backend to get the item id — for now remove via institution name match
      // Re-fetch accounts after to refresh state
      const res = await fetch(`${API_URL}/plaid/accounts`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      const institutionAccounts = (data.accounts || []).filter(
        (a: any) => (a.institution || 'Unknown') === institution
      );

      if (institutionAccounts.length > 0) {
        // Get the plaid item id from the first account's item_id
        const itemRes = await fetch(`${API_URL}/plaid/items`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (itemRes.ok) {
          const itemsData = await itemRes.json();
          const matchingItem = (itemsData.items || []).find(
            (item: any) => item.institution === institution
          );
          if (matchingItem) {
            await fetch(`${API_URL}/plaid/items/${matchingItem.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${authToken}` },
            });
          }
        }
      }

      await fetchData();
    } catch {
      setError('Failed to disconnect account. Please try again.');
    } finally {
      setDisconnecting(null);
    }
  };

  const hasAccounts = accounts.length > 0;

  return (
    <div className="min-h-screen bg-[#0A0C10] text-slate-300 p-6 lg:p-12">
      <div className="max-w-2xl mx-auto">

        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors text-sm mb-8"
        >
          <ChevronLeft size={16} />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-black italic tracking-tighter text-white">
            {hasAccounts ? 'Manage Accounts' : 'Connect Bank'}
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            {hasAccounts
              ? 'Your linked institutions are below. Add more or disconnect anytime.'
              : 'Link your bank, credit card, or brokerage to start tracking your finances.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* Linked institutions */}
        {!loading && hasAccounts && (
          <div className="space-y-4 mb-8">
            {items.map(({ institution, accounts: accs }) => (
              <div key={institution} className="bg-[#11141B] border border-slate-800 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-800">
                  <Building2 size={15} className="text-blue-400 shrink-0" />
                  <p className="font-bold text-white text-sm">{institution}</p>
                  <span className="ml-auto text-[11px] text-slate-600 font-mono">
                    {accs.length} account{accs.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => disconnect(institution)}
                    disabled={disconnecting === institution}
                    title="Disconnect"
                    className="ml-2 text-slate-600 hover:text-red-400 transition-colors disabled:opacity-40"
                  >
                    {disconnecting === institution
                      ? <span className="text-[10px] font-mono text-slate-600">Removing...</span>
                      : <Trash2 size={14} />}
                  </button>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {accs.map((acc: any, i: number) => (
                    <div key={acc.account_id ?? i} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="shrink-0">
                          {TYPE_ICON[acc.type] ?? <Wallet size={15} className="text-slate-500" />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">{acc.name}</p>
                          <p className="text-[11px] text-slate-600 capitalize">
                            {acc.subtype}{acc.mask ? ` · •••• ${acc.mask}` : ''}
                          </p>
                        </div>
                      </div>
                      <p className="font-mono font-bold text-white text-sm shrink-0 ml-4">
                        {fmt(acc.balances.current ?? 0)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="space-y-3 mb-8">
            {[1, 2].map(n => (
              <div key={n} className="bg-[#11141B] border border-slate-800 rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        )}

        {/* Only mount PlaidButton when token is ready — prevents duplicate script */}
        {linkToken ? (
          <PlaidButton token={linkToken} hasAccounts={hasAccounts} onSuccess={onSuccess} />
        ) : !error && (
          <div className="w-full flex items-center justify-center gap-2 bg-blue-600/30 text-blue-400 py-4 rounded-2xl font-bold text-sm">
            Initializing Plaid...
          </div>
        )}

      </div>
    </div>
  );
}
