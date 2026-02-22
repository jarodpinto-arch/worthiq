import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/format';

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

interface WidgetProps {
  transactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

// Net Worth Card Widget
export const NetWorthWidget: React.FC<WidgetProps> = ({ accounts }) => {
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);

  return (
    <div className="text-center py-4">
      <p className="text-sm text-gray-500 mb-1">Total Net Worth</p>
      <p className={`text-4xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {formatCurrency(totalBalance)}
      </p>
      <p className="text-xs text-gray-400 mt-2">{accounts.length} connected accounts</p>
    </div>
  );
};

// Spending by Category Widget
export const SpendingByCategoryWidget: React.FC<WidgetProps> = ({ transactions }) => {
  const data = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions
      .filter(t => t.amount > 0 && !t.pending)
      .forEach(t => {
        const cat = t.category?.[0] || 'Uncategorized';
        categories[cat] = (categories[cat] || 0) + t.amount;
      });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions]);

  if (data.length === 0) {
    return <div className="text-center text-gray-500 py-8">No spending data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          dataKey="value"
          label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Monthly Trends Widget
export const MonthlyTrendsWidget: React.FC<WidgetProps> = ({ transactions }) => {
  const data = useMemo(() => {
    const monthly: Record<string, { income: number; spending: number }> = {};
    transactions
      .filter(t => !t.pending)
      .forEach(t => {
        const month = new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (!monthly[month]) monthly[month] = { income: 0, spending: 0 };
        if (t.amount > 0) {
          monthly[month].spending += t.amount;
        } else {
          monthly[month].income += Math.abs(t.amount);
        }
      });

    return Object.entries(monthly)
      .map(([month, data]) => ({ month, ...data }))
      .slice(-6);
  }, [transactions]);

  if (data.length === 0) {
    return <div className="text-center text-gray-500 py-8">No trend data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
        <Legend />
        <Area type="monotone" dataKey="income" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Income" />
        <Area type="monotone" dataKey="spending" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} name="Spending" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Account Balances Widget
export const AccountBalancesWidget: React.FC<WidgetProps> = ({ accounts }) => {
  if (accounts.length === 0) {
    return <div className="text-center text-gray-500 py-8">No accounts connected</div>;
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {accounts.map(account => (
        <div key={account.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">{account.name}</p>
            <p className="text-xs text-gray-500">
              {account.item?.institutionName} {account.mask && `•••• ${account.mask}`}
            </p>
          </div>
          <p className={`font-bold ${(account.currentBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(account.currentBalance || 0)}
          </p>
        </div>
      ))}
    </div>
  );
};

// Recent Transactions Widget
export const RecentTransactionsWidget: React.FC<WidgetProps> = ({ transactions }) => {
  const recent = transactions.slice(0, 5);

  if (recent.length === 0) {
    return <div className="text-center text-gray-500 py-8">No transactions</div>;
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {recent.map(t => (
        <div key={t.id} className="flex justify-between items-center p-2 border-b border-gray-100 last:border-0">
          <div>
            <p className="font-medium text-gray-900 text-sm">{t.merchantName || t.name}</p>
            <p className="text-xs text-gray-500">
              {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {t.pending && <span className="ml-1 text-yellow-600">(Pending)</span>}
            </p>
          </div>
          <p className={`font-bold text-sm ${t.amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {t.amount > 0 ? '-' : '+'}{formatCurrency(Math.abs(t.amount))}
          </p>
        </div>
      ))}
    </div>
  );
};

// Budget Progress Widget
export const BudgetProgressWidget: React.FC<WidgetProps> = ({ transactions, budgets }) => {
  const monthlySpending = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const spending: Record<string, number> = {};

    transactions
      .filter(t => new Date(t.date) >= startOfMonth && t.amount > 0 && !t.pending)
      .forEach(t => {
        const cat = t.category?.[0] || 'Uncategorized';
        spending[cat] = (spending[cat] || 0) + t.amount;
      });

    return spending;
  }, [transactions]);

  if (budgets.length === 0) {
    return <div className="text-center text-gray-500 py-8">No budgets set</div>;
  }

  return (
    <div className="space-y-4 max-h-64 overflow-y-auto">
      {budgets.map(budget => {
        const spent = monthlySpending[budget.category] || 0;
        const percentage = Math.min((spent / budget.amount) * 100, 100);
        const isOver = spent > budget.amount;

        return (
          <div key={budget.id}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{budget.category}</span>
              <span className={isOver ? 'text-red-600' : 'text-gray-600'}>
                {formatCurrency(spent)} / {formatCurrency(budget.amount)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  isOver ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Top Merchants Widget
export const TopMerchantsWidget: React.FC<WidgetProps> = ({ transactions }) => {
  const data = useMemo(() => {
    const merchants: Record<string, number> = {};
    transactions
      .filter(t => t.amount > 0 && !t.pending)
      .forEach(t => {
        const name = t.merchantName || t.name;
        merchants[name] = (merchants[name] || 0) + t.amount;
      });

    return Object.entries(merchants)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [transactions]);

  if (data.length === 0) {
    return <div className="text-center text-gray-500 py-8">No merchant data</div>;
  }

  return (
    <div className="space-y-2">
      {data.map((merchant, index) => (
        <div key={merchant.name} className="flex items-center gap-3 p-2">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
            {index + 1}
          </span>
          <span className="flex-1 font-medium text-gray-900 truncate">{merchant.name}</span>
          <span className="font-bold text-red-600">{formatCurrency(merchant.total)}</span>
        </div>
      ))}
    </div>
  );
};

// Spending by Day Widget
export const SpendingByDayWidget: React.FC<WidgetProps> = ({ transactions }) => {
  const data = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const spending = Array(7).fill(0);

    transactions
      .filter(t => t.amount > 0 && !t.pending)
      .forEach(t => {
        const day = new Date(t.date).getDay();
        spending[day] += t.amount;
      });

    return days.map((name, index) => ({ name, amount: spending[index] }));
  }, [transactions]);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
        <Bar dataKey="amount" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Income vs Expenses Widget
export const IncomeVsExpensesWidget: React.FC<WidgetProps> = ({ transactions }) => {
  const { income, expenses } = useMemo(() => {
    let income = 0;
    let expenses = 0;

    transactions
      .filter(t => !t.pending)
      .forEach(t => {
        if (t.amount > 0) {
          expenses += t.amount;
        } else {
          income += Math.abs(t.amount);
        }
      });

    return { income, expenses };
  }, [transactions]);

  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-green-600 uppercase">Income</p>
          <p className="text-xl font-bold text-green-700">{formatCurrency(income)}</p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-xs text-red-600 uppercase">Expenses</p>
          <p className="text-xl font-bold text-red-700">{formatCurrency(expenses)}</p>
        </div>
      </div>
      <div className={`text-center p-3 rounded-lg ${savings >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
        <p className={`text-xs uppercase ${savings >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
          {savings >= 0 ? 'Saved' : 'Over Budget'}
        </p>
        <p className={`text-xl font-bold ${savings >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
          {formatCurrency(Math.abs(savings))}
        </p>
        <p className="text-xs text-gray-500 mt-1">{savingsRate.toFixed(1)}% savings rate</p>
      </div>
    </div>
  );
};

// Savings Rate Widget
export const SavingsRateWidget: React.FC<WidgetProps> = ({ transactions }) => {
  const { income, expenses, rate } = useMemo(() => {
    let income = 0;
    let expenses = 0;

    transactions
      .filter(t => !t.pending)
      .forEach(t => {
        if (t.amount > 0) {
          expenses += t.amount;
        } else {
          income += Math.abs(t.amount);
        }
      });

    const rate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    return { income, expenses, rate };
  }, [transactions]);

  const getColor = (rate: number) => {
    if (rate >= 20) return 'text-green-600';
    if (rate >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCircleColor = (rate: number) => {
    if (rate >= 20) return '#10B981';
    if (rate >= 10) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="12"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke={getCircleColor(rate)}
            strokeWidth="12"
            strokeDasharray={`${Math.max(0, rate) * 3.52} 352`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${getColor(rate)}`}>
            {rate.toFixed(0)}%
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-2">Savings Rate</p>
    </div>
  );
};
