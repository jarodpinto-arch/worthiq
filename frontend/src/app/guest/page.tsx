"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function GuestPage() {
  const [aiResponse, setAiResponse] = useState(null);

  return (
    <main className="min-h-screen bg-slate-50 p-8 pt-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-slate-900 mb-2 italic">WorthIQ</h1>
        <p className="text-slate-500 mb-10 text-lg">Guest Intelligence Portal</p>
        
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-200 min-h-[400px] flex items-center justify-center text-slate-400 font-medium">
          AI Dashboard will appear here after your first query.
        </div>
      </div>
    </main>
  );
}
