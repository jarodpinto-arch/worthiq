import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/Auth';
import { PlaidLink } from './components/PlaidLink';
import { Transactions } from './components/Transactions';
import { Charts } from './components/Charts';
import { TransactionFilters, FilterState } from './components/TransactionFilters';
import { BudgetTracker } from './components/BudgetTracker';
import { CustomDashboard } from './components/Dashboard';
import { formatCurrency } from './utils/format';
import api from './services/api';

type TabType = 'overview' | 'dashboard' | 'transactions' | 'budgets' | 'insights';

function Dashboard() {
  const { user, logout } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingTransactions, setFetchingTransactions] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    category: '',
    accountId: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  useEffect(() => {
    loadAccounts();
    loadTransactions();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await api.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await api.getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handlePlaidSuccess = async (publicToken: string, metadata: any) => {
    try {
      await api.exchangePublicToken(publicToken);
      await loadAccounts();
    } catch (error) {
      console.error('Error exchanging token:', error);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const data = await api.syncAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchTransactions = async () => {
    setFetchingTransactions(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const data = await api.fetchTransactions(startDate, endDate);
      setTransactions(data);
      console.log(`Fetched ${data.length} transactions`);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setFetchingTransactions(false);
    }
  };

  // Get unique categories from transactions
  const categories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => {
      if (t.category && t.category.length > 0) {
        cats.add(t.category[0]);
      }
    });
    return Array.from(cats).sort();
  }, [transactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        (t.name?.toLowerCase().includes(search)) ||
        (t.merchantName?.toLowerCase().includes(search))
      );
    }

    if (filters.category) {
      filtered = filtered.filter(t =>
        t.category && t.category.includes(filters.category)
      );
    }

    if (filters.accountId) {
      filtered = filtered.filter(t => t.accountId === filters.accountId);
    }

    if (filters.startDate) {
      filtered = filtered.filter(t =>
        new Date(t.date) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(t =>
        new Date(t.date) <= new Date(filters.endDate)
      );
    }

    if (filters.minAmount) {
      filtered = filtered.filter(t =>
        Math.abs(t.amount) >= parseFloat(filters.minAmount)
      );
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(t =>
        Math.abs(t.amount) <= parseFloat(filters.maxAmount)
      );
    }

    filtered.sort((a, b) => {
      if (filters.sortBy === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        return filters.sortOrder === 'asc'
          ? a.amount - b.amount
          : b.amount - a.amount;
      }
    });

    return filtered;
  }, [transactions, filters]);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const totalBalance = accounts.reduce(
    (sum, account) => sum + (account.currentBalance || 0),
    0
  );

  const totalSpent = transactions
    .filter(t => t.amount > 0 && !t.pending)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.amount < 0 && !t.pending)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )},
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    )},
    { id: 'transactions' as TabType, label: 'Transactions', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )},
    { id: 'budgets' as TabType, label: 'Budgets', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )},
    { id: 'insights' as TabType, label: 'Insights', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )},
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:transform-none ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">WorthIQ</h1>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">WorthIQ</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        <div className="p-4 lg:p-8">
          {/* Quick Actions - Always visible at top */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                <p className="text-sm text-gray-500">Manage your bank connections</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <PlaidLink onSuccess={handlePlaidSuccess} userId={user?.id || ''} />
                {accounts.length > 0 && (
                  <>
                    <button
                      onClick={handleSync}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-gray-400 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {loading ? 'Syncing...' : 'Sync'}
                    </button>
                    <button
                      onClick={handleFetchTransactions}
                      disabled={fetchingTransactions}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-gray-400 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {fetchingTransactions ? 'Fetching...' : 'Fetch Transactions'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Overview */}
              {accounts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium opacity-90">Total Balance</h3>
                      <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
                    <p className="text-sm opacity-75 mt-1">{accounts.length} connected accounts</p>
                  </div>

                  <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium opacity-90">Total Spent (90d)</h3>
                      <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(totalSpent)}</p>
                    <p className="text-sm opacity-75 mt-1">{transactions.filter(t => t.amount > 0).length} transactions</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium opacity-90">Total Income (90d)</h3>
                      <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(totalIncome)}</p>
                    <p className="text-sm opacity-75 mt-1">{transactions.filter(t => t.amount < 0).length} deposits</p>
                  </div>
                </div>
              )}

              {/* Accounts */}
              {accounts.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Your Accounts</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900">{account.name}</p>
                            <p className="text-sm text-gray-500">
                              {account.item?.institutionName} •••• {account.mask}
                            </p>
                          </div>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(account.currentBalance || 0)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Transactions */}
              {transactions.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Recent Transactions</h2>
                    <button
                      onClick={() => setActiveTab('transactions')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View All
                    </button>
                  </div>
                  <Transactions transactions={transactions.slice(0, 5)} />
                </div>
              )}

              {/* Empty State */}
              {accounts.length === 0 && !loading && (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No accounts connected</h3>
                  <p className="text-gray-500 mb-4">
                    Connect your bank account to start tracking your finances
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'transactions' && (
            <>
              {transactions.length > 0 && (
                <TransactionFilters
                  onFilterChange={handleFilterChange}
                  categories={categories}
                  accounts={accounts}
                />
              )}

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold">All Transactions</h2>
                  <span className="text-sm text-gray-600">
                    Showing {filteredTransactions.length} of {transactions.length}
                  </span>
                </div>
                <Transactions transactions={filteredTransactions} />
              </div>
            </>
          )}

          {activeTab === 'dashboard' && (
            <CustomDashboard transactions={transactions} accounts={accounts} />
          )}

          {activeTab === 'budgets' && (
            <BudgetTracker transactions={transactions} categories={categories} />
          )}

          {activeTab === 'insights' && (
            <>
              {transactions.length > 0 ? (
                <Charts transactions={transactions} />
              ) : (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No data for insights</h3>
                  <p className="text-gray-500">
                    Fetch your transactions to see spending insights and analytics
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <AuthPage />;
}

export default App;
