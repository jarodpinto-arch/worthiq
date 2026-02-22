import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../utils/format';

interface Transaction {
  id: string;
  amount: number;
  date: string;
  name: string;
  merchantName?: string;
  category: string[];
  pending: boolean;
}

interface ChartsProps {
  transactions: Transaction[];
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

export const Charts: React.FC<ChartsProps> = ({ transactions }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const completedTransactions = useMemo(() =>
    transactions.filter(t => !t.pending),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    if (timeRange === 'all') return completedTransactions;

    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return completedTransactions.filter(t => new Date(t.date) >= cutoff);
  }, [completedTransactions, timeRange]);

  // Category spending data
  const categoryData = useMemo(() => {
    const categories: { [key: string]: number } = {};

    filteredTransactions
      .filter(t => t.amount > 0)
      .forEach(transaction => {
        const category = transaction.category?.[0] || 'Uncategorized';
        categories[category] = (categories[category] || 0) + transaction.amount;
      });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredTransactions]);

  // Monthly spending vs income
  const monthlyData = useMemo(() => {
    const monthly: { [key: string]: { spending: number; income: number; savings: number } } = {};

    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthly[monthKey]) {
        monthly[monthKey] = { spending: 0, income: 0, savings: 0 };
      }

      if (transaction.amount > 0) {
        monthly[monthKey].spending += transaction.amount;
      } else {
        monthly[monthKey].income += Math.abs(transaction.amount);
      }
    });

    return Object.entries(monthly)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        spending: parseFloat(data.spending.toFixed(2)),
        income: parseFloat(data.income.toFixed(2)),
        savings: parseFloat((data.income - data.spending).toFixed(2)),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredTransactions]);

  // Daily spending trend with moving average
  const dailyData = useMemo(() => {
    const daily: { [key: string]: number } = {};

    filteredTransactions
      .filter(t => t.amount > 0)
      .forEach(t => {
        const dateKey = t.date.split('T')[0];
        daily[dateKey] = (daily[dateKey] || 0) + t.amount;
      });

    const sortedDays = Object.entries(daily)
      .map(([date, amount]) => ({
        date,
        amount: parseFloat(amount.toFixed(2)),
        displayDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate 7-day moving average
    return sortedDays.map((day, index) => {
      const start = Math.max(0, index - 6);
      const window = sortedDays.slice(start, index + 1);
      const avg = window.reduce((sum, d) => sum + d.amount, 0) / window.length;
      return { ...day, movingAvg: parseFloat(avg.toFixed(2)) };
    });
  }, [filteredTransactions]);

  // Top merchants
  const topMerchants = useMemo(() => {
    const merchants: { [key: string]: { total: number; count: number } } = {};

    filteredTransactions
      .filter(t => t.amount > 0)
      .forEach(t => {
        const name = t.merchantName || t.name;
        if (!merchants[name]) {
          merchants[name] = { total: 0, count: 0 };
        }
        merchants[name].total += t.amount;
        merchants[name].count += 1;
      });

    return Object.entries(merchants)
      .map(([name, data]) => ({
        name,
        total: parseFloat(data.total.toFixed(2)),
        count: data.count,
        avg: parseFloat((data.total / data.count).toFixed(2)),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredTransactions]);

  // Spending by day of week
  const dayOfWeekData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const spending: number[] = Array(7).fill(0);
    const counts: number[] = Array(7).fill(0);

    filteredTransactions
      .filter(t => t.amount > 0)
      .forEach(t => {
        const day = new Date(t.date).getDay();
        spending[day] += t.amount;
        counts[day] += 1;
      });

    return days.map((name, index) => ({
      name,
      total: parseFloat(spending[index].toFixed(2)),
      average: counts[index] > 0 ? parseFloat((spending[index] / counts[index]).toFixed(2)) : 0,
    }));
  }, [filteredTransactions]);

  // Summary stats
  const stats = useMemo(() => {
    const spending = filteredTransactions.filter(t => t.amount > 0);
    const income = filteredTransactions.filter(t => t.amount < 0);

    const totalSpending = spending.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const avgTransaction = spending.length > 0 ? totalSpending / spending.length : 0;
    const largestPurchase = spending.length > 0 ? Math.max(...spending.map(t => t.amount)) : 0;

    return {
      totalSpending,
      totalIncome,
      netSavings: totalIncome - totalSpending,
      avgTransaction,
      largestPurchase,
      transactionCount: spending.length,
    };
  }, [filteredTransactions]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  if (completedTransactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No transaction data available for charts. Fetch transactions first!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range === 'all' ? 'All Time' : range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Spent</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(stats.totalSpending)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Income</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalIncome)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Net Savings</p>
          <p className={`text-xl font-bold ${stats.netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats.netSavings)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Transaction</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.avgTransaction)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Largest Purchase</p>
          <p className="text-xl font-bold text-orange-600">{formatCurrency(stats.largestPurchase)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Transactions</p>
          <p className="text-xl font-bold text-blue-600">{stats.transactionCount}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category - Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Spending by Day of Week */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Spending by Day of Week</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dayOfWeekData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
              <Bar dataKey="total" fill="#8B5CF6" name="Total" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Spending with Moving Average */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Spending Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
            <Legend />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#3B82F6"
              fill="#93C5FD"
              fillOpacity={0.3}
              name="Daily Spending"
            />
            <Line
              type="monotone"
              dataKey="movingAvg"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              name="7-Day Average"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Income vs Spending - Bar Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Cash Flow</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="income" fill="#10B981" name="Income" radius={[4, 4, 0, 0]} />
            <Bar dataKey="spending" fill="#EF4444" name="Spending" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Merchants & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Merchants */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Top Merchants</h3>
          <div className="space-y-3">
            {topMerchants.map((merchant, index) => (
              <div key={merchant.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 truncate max-w-[200px]">{merchant.name}</p>
                    <p className="text-xs text-gray-500">{merchant.count} transactions • {formatCurrency(merchant.avg)} avg</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-red-600">{formatCurrency(merchant.total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {categoryData.map((category, index) => {
              const total = categoryData.reduce((sum, c) => sum + c.value, 0);
              const percentage = ((category.value / total) * 100).toFixed(1);
              return (
                <div key={category.name}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-gray-700">{category.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(category.value)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};