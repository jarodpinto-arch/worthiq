"use client";
import React, { useState } from 'react';

export default function ChatInput({ onViewGenerated }: { onViewGenerated: (data: any) => void }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/generate-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          dataSummary: { total_balance: "$5,240.00", top_category: "Travel" } // Placeholder for now
        }),
      });
      const data = await res.json();
      onViewGenerated(data);
    } catch (err) {
      console.error("Failed to generate view", err);
    } finally {
      setLoading(false);
      setPrompt("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex gap-2">
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask AI to build a view... (e.g. 'Show my subscription costs')"
        className="flex-1 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
      />
      <button 
        type="submit" 
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300"
      >
        {loading ? "Building..." : "Generate"}
      </button>
    </form>
  );
}
