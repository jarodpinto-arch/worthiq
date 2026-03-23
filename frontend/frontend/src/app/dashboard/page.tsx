"use client";
import React, { useEffect, useState } from 'react';

export default function Dashboard() {
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    setIsDemo(localStorage.getItem('worthiq_mode') === 'demo');
  }, []);

  const data = isDemo ? {
    balance: "$2,450,800.00",
    status: "Demo Data Active",
    statusColor: "text-amber-600",
    insight: "AI Analysis: Your liquidity is concentrated in low-yield cash. Recommend moving 15% to index-linked futures."
  } : {
    balance: "$0.00",
    status: "No Accounts Connected",
    statusColor: "text-blue-600",
    insight: "Connect an account to start the synthesis process."
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-4xl font-black italic mb-2 tracking-tighter">WorthIQ</h1>
            <p className="text-slate-500 font-medium">Portfolio Synthesis</p>
          </div>
          {isDemo && (
            <button 
              onClick={() => {localStorage.clear(); window.location.reload();}}
              className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-red-500"
            >
              EXIT DEMO
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200/50">
            <h3 className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Liquidity</h3>
            <p className="text-6xl font-black mt-4 tracking-tight">{data.balance}</p>
            <div className="mt-8 pt-6 border-t border-slate-50">
              <span className={`${data.statusColor} font-bold text-sm`}>{data.status}</span>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
            <h3 className="text-blue-400 font-bold uppercase tracking-widest text-[10px]">AI Intelligence</h3>
            <p className="mt-6 text-lg font-medium leading-relaxed italic">
              "{data.insight}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
