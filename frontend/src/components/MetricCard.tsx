import React from 'react';

export function MetricCard({ title, value, trend, label }: any) {
  const isUp = trend === 'up';
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
        {trend && (
          <span className={`text-sm font-semibold ${isUp ? 'text-red-500' : 'text-green-500'}`}>
            {isUp ? '↑' : '↓'}
          </span>
        )}
      </div>
      {label && <p className="mt-1 text-xs text-slate-400">{label}</p>}
    </div>
  );
}
