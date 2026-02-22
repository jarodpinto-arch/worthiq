import React, { useState, useCallback } from 'react';
import { WidgetConfig, WidgetSize, WidgetType, WIDGET_DEFINITIONS, DashboardLayout } from './types';
import { WidgetWrapper } from './WidgetWrapper';
import {
  NetWorthWidget,
  SpendingByCategoryWidget,
  MonthlyTrendsWidget,
  AccountBalancesWidget,
  RecentTransactionsWidget,
  BudgetProgressWidget,
  TopMerchantsWidget,
  SpendingByDayWidget,
  IncomeVsExpensesWidget,
  SavingsRateWidget,
} from './Widgets';

interface Transaction {
  id: string;
  amount: number;
  date: string;
  name: string;
  merchantName?: string;
  category: string[];
  pending: boolean;
}

interface Account {
  id: string;
  name: string;
  currentBalance: number;
  mask?: string;
  item?: {
    institutionName: string;
  };
}

interface Budget {
  id: string;
  category: string;
  amount: number;
}

interface CustomDashboardProps {
  transactions: Transaction[];
  accounts: Account[];
}

const STORAGE_KEY = 'worthiq_dashboard_layout';

const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: '1', type: 'net-worth-card', title: 'Net Worth', size: 'small' },
  { id: '2', type: 'savings-rate', title: 'Savings Rate', size: 'small' },
  { id: '3', type: 'income-vs-expenses', title: 'Income vs Expenses', size: 'medium' },
  { id: '4', type: 'spending-by-category', title: 'Spending by Category', size: 'medium' },
  { id: '5', type: 'monthly-trends', title: 'Monthly Trends', size: 'large' },
  { id: '6', type: 'recent-transactions', title: 'Recent Transactions', size: 'medium' },
];

const loadLayout = (): WidgetConfig[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: DashboardLayout = JSON.parse(saved);
      return parsed.widgets;
    }
  } catch (e) {
    console.error('Error loading dashboard layout:', e);
  }
  return DEFAULT_LAYOUT;
};

const saveLayout = (widgets: WidgetConfig[]) => {
  try {
    const layout: DashboardLayout = {
      widgets,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch (e) {
    console.error('Error saving dashboard layout:', e);
  }
};

export const CustomDashboard: React.FC<CustomDashboardProps> = ({ transactions, accounts }) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(loadLayout);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load budgets from localStorage
  const budgets: Budget[] = JSON.parse(localStorage.getItem('budgets') || '[]');

  const handleRemoveWidget = useCallback((id: string) => {
    setWidgets(prev => {
      const updated = prev.filter(w => w.id !== id);
      saveLayout(updated);
      return updated;
    });
  }, []);

  const handleResizeWidget = useCallback((id: string, size: WidgetSize) => {
    setWidgets(prev => {
      const updated = prev.map(w => w.id === id ? { ...w, size } : w);
      saveLayout(updated);
      return updated;
    });
  }, []);

  const handleAddWidget = useCallback((type: WidgetType) => {
    const definition = WIDGET_DEFINITIONS.find(d => d.type === type);
    if (!definition) return;

    const newWidget: WidgetConfig = {
      id: Date.now().toString(),
      type,
      title: definition.name,
      size: definition.defaultSize,
    };

    setWidgets(prev => {
      const updated = [...prev, newWidget];
      saveLayout(updated);
      return updated;
    });

    setShowAddModal(false);
  }, []);

  const handleResetLayout = useCallback(() => {
    if (window.confirm('Reset dashboard to default layout?')) {
      setWidgets(DEFAULT_LAYOUT);
      saveLayout(DEFAULT_LAYOUT);
    }
  }, []);

  const handleMoveWidget = useCallback((id: string, direction: 'up' | 'down') => {
    setWidgets(prev => {
      const index = prev.findIndex(w => w.id === id);
      if (index === -1) return prev;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      saveLayout(updated);
      return updated;
    });
  }, []);

  const renderWidget = (config: WidgetConfig) => {
    const props = { transactions, accounts, budgets };

    switch (config.type) {
      case 'net-worth-card':
        return <NetWorthWidget {...props} />;
      case 'spending-by-category':
        return <SpendingByCategoryWidget {...props} />;
      case 'monthly-trends':
        return <MonthlyTrendsWidget {...props} />;
      case 'account-balances':
        return <AccountBalancesWidget {...props} />;
      case 'recent-transactions':
        return <RecentTransactionsWidget {...props} />;
      case 'budget-progress':
        return <BudgetProgressWidget {...props} />;
      case 'top-merchants':
        return <TopMerchantsWidget {...props} />;
      case 'spending-by-day':
        return <SpendingByDayWidget {...props} />;
      case 'income-vs-expenses':
        return <IncomeVsExpensesWidget {...props} />;
      case 'savings-rate':
        return <SavingsRateWidget {...props} />;
      default:
        return <div className="text-gray-500">Unknown widget type</div>;
    }
  };

  // Check which widgets are already added
  const addedTypes = new Set(widgets.map(w => w.type));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Custom Dashboard</h2>
          <p className="text-sm text-gray-500">Personalize your financial overview</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              isEditing
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {isEditing ? 'Done Editing' : 'Edit Layout'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Widget
          </button>
        </div>
      </div>

      {/* Widgets Grid */}
      {widgets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No widgets yet</h3>
          <p className="text-gray-500 mb-4">Add widgets to build your custom dashboard</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Add Your First Widget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {widgets.map((widget, index) => (
            <div key={widget.id} className="relative">
              {isEditing && (
                <div className="absolute -top-2 -left-2 z-10 flex gap-1">
                  <button
                    onClick={() => handleMoveWidget(widget.id, 'up')}
                    disabled={index === 0}
                    className="w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-gray-700"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMoveWidget(widget.id, 'down')}
                    disabled={index === widgets.length - 1}
                    className="w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-gray-700"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
              <WidgetWrapper
                config={widget}
                onRemove={handleRemoveWidget}
                onResize={handleResizeWidget}
              >
                {renderWidget(widget)}
              </WidgetWrapper>
            </div>
          ))}
        </div>
      )}

      {/* Reset button */}
      {widgets.length > 0 && isEditing && (
        <div className="text-center">
          <button
            onClick={handleResetLayout}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Reset to Default Layout
          </button>
        </div>
      )}

      {/* Add Widget Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Add Widget</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WIDGET_DEFINITIONS.map(definition => {
                  const isAdded = addedTypes.has(definition.type);
                  return (
                    <button
                      key={definition.type}
                      onClick={() => !isAdded && handleAddWidget(definition.type)}
                      disabled={isAdded}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        isAdded
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{definition.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{definition.name}</p>
                          <p className="text-sm text-gray-500">{definition.description}</p>
                          {isAdded && (
                            <p className="text-xs text-blue-600 mt-1">Already added</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
