import React from 'react';
import { MetricCard } from './MetricCard';

const ComponentMap: any = {
  MetricCard: MetricCard,
  // We will add SpendingChart and TransactionTable here next
};

export default function DynamicDashboard({ aiResponse }: { aiResponse: any }) {
  if (!aiResponse || !aiResponse.components) return (
    <div className="p-10 text-center text-slate-400">Waiting for AI to build your view...</div>
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">
        {aiResponse.view_title || "Your Custom Insight"}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aiResponse.components.map((comp: any, index: number) => {
          const SelectedComponent = ComponentMap[comp.type];
          if (!SelectedComponent) return null;
          return <SelectedComponent key={index} {...comp.props} />;
        })}
      </div>
    </div>
  );
}
