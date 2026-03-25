"use client";
import React, { useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useRouter } from 'next/navigation';
import { Landmark, MousePointer2, Sparkles, PencilLine } from 'lucide-react';
import { getApiBase } from '../../../../src/lib/api-base';

export default function ConnectPage() {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch(`${getApiBase()}/plaid/create-link-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 'jarod-pinto-dev' }),
        });
        const data = await res.json();
        setToken(data.link_token);
      } catch (err) {
        console.error('Plaid unavailable', err);
      }
    };
    fetchToken();
  }, []);

  const { open, ready } = usePlaidLink({
    token: token,
    onSuccess: () => router.push('/dashboard'),
  });

  const handleExplore = () => {
    // Logic to set a 'demo' flag in local storage/state
    localStorage.setItem('worthiq_mode', 'demo');
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black italic tracking-tighter mb-2">WorthIQ</h1>
          <p className="text-slate-500 font-medium">How would you like to initialize your portfolio?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option 1: Plaid */}
          <button 
            onClick={() => open()} 
            disabled={!ready}
            className="group flex flex-col text-left p-6 bg-blue-600 rounded-3xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <div className="bg-white/20 p-3 rounded-2xl w-fit mb-12">
              <Landmark className="text-white" size={24} />
            </div>
            <h3 className="text-white font-bold text-xl">Sync with Plaid</h3>
            <p className="text-blue-100 text-sm mt-1">Automatic, real-time tracking of assets and liabilities.</p>
          </button>

          {/* Option 2: Explore / Dummy */}
          <button 
            onClick={handleExplore}
            className="group flex flex-col text-left p-6 bg-slate-900 rounded-3xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="bg-white/10 p-3 rounded-2xl w-fit mb-12">
              <Sparkles className="text-amber-400" size={24} />
            </div>
            <h3 className="text-white font-bold text-xl">Explore with Demo</h3>
            <p className="text-slate-400 text-sm mt-1">Don't have an account? Play with dummy data to see the tech.</p>
          </button>

          {/* Option 3: Manual Entry */}
          <button 
            onClick={() => router.push('/dashboard')}
            className="group flex flex-col text-left p-6 bg-slate-50 border border-slate-200 rounded-3xl transition-all hover:border-slate-400"
          >
            <div className="bg-white p-3 rounded-2xl w-fit mb-4 shadow-sm">
              <PencilLine className="text-slate-600" size={20} />
            </div>
            <h3 className="text-slate-900 font-bold">Manual Entry</h3>
            <p className="text-slate-500 text-xs mt-1">Type your balances yourself for maximum privacy.</p>
          </button>
          
           {/* Option 4: Help/Consult */}
           <div className="flex flex-col justify-center p-6 border border-dashed border-slate-200 rounded-3xl">
            <p className="text-slate-400 text-xs font-medium text-center italic">
              "Synthesis is the goal. Connection is the method."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
