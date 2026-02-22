import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/format';

interface Transaction {
  id: string;
  amount: number;
  date: string;
  category: string[];
  pending: boolean;
}

interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
}

interface BudgetTrackerProps {
  transactions: Transaction[];
  categories: string[];
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({ transactions, categories }) => {
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('budgets');
    return saved ? JSON.parse(saved) : [];
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  // Calculate spending per category for the current month
  const monthlySpending = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const spending: Record<string, number> = {};

    transactions
      .filter(t => {
        const txDate = new Date(t.date);
        return txDate >= startOfMonth && t.amount > 0 && !t.pending;
      })
      .forEach(t => {
        const category = t.category?.[0] || 'Uncategorized';
        spending[category] = (spending[category] || 0) + t.amount;
      });

    return spending;
  }, [transactions]);

  const saveBudgets = (newBudgets: Budget[]) => {
    setBudgets(newBudgets);
    localStorage.setItem('budgets', JSON.stringify(newBudgets));
  };

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory || !newAmount) return;

    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) return;

    // Check if budget for this category already exists
    if (budgets.some(b => b.category === newCategory)) {
      alert('Budget for this category already exists');
      return;
    }

    const newBudget: Budget = {
      id: Date.now().toString(),
      category: newCategory,
      amount,
      spent: monthlySpending[newCategory] || 0,
    };

    saveBudgets([...budgets, newBudget]);
    setNewCategory('');
    setNewAmount('');
    setShowAddForm(false);
  };

  const handleUpdateBudget = (id: string) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) return;

    const updated = budgets.map(b =>
      b.id === id ? { ...b, amount } : b
    );
    saveBudgets(updated);
    setEditingId(null);
    setEditAmount('');
  };

  const handleDeleteBudget = (id: string) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      saveBudgets(budgets.filter(b => b.id !== id));
    }
  };

  const getProgressColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressBg = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return 'bg-red-100';
    if (percentage >= 80) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  // Calculate totals
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (monthlySpending[b.category] || 0), 0);

  const unusedCategories = categories.filter(
    cat => !budgets.some(b => b.category === cat)
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Monthly Budgets</h2>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Budget
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Total Budgeted</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalBudgeted)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-600 font-medium">Total Spent</p>
          <p className="text-2xl font-bold text-red-700">{formatCurrency(totalSpent)}</p>
        </div>
        <div className={`rounded-lg p-4 ${totalBudgeted - totalSpent >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className={`text-sm font-medium ${totalBudgeted - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Remaining
          </p>
          <p className={`text-2xl font-bold ${totalBudgeted - totalSpent >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatCurrency(totalBudgeted - totalSpent)}
          </p>
        </div>
      </div>

      {/* Add Budget Form */}
      {showAddForm && (
        <form onSubmit={handleAddBudget} className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select category...</option>
                {unusedCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Budget ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Budget List */}
      {budgets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p>No budgets set yet. Click "Add Budget" to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map(budget => {
            const spent = monthlySpending[budget.category] || 0;
            const percentage = Math.min((spent / budget.amount) * 100, 100);
            const remaining = budget.amount - spent;

            return (
              <div key={budget.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{budget.category}</h4>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(spent)} of {formatCurrency(budget.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === budget.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Amount"
                        />
                        <button
                          onClick={() => handleUpdateBudget(budget.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={`text-sm font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}
                        </span>
                        <button
                          onClick={() => {
                            setEditingId(budget.id);
                            setEditAmount(budget.amount.toString());
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteBudget(budget.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className={`w-full rounded-full h-3 ${getProgressBg(spent, budget.amount)}`}>
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(spent, budget.amount)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">{percentage.toFixed(0)}% used</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
