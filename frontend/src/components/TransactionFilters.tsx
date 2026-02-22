import React, { useState, useEffect } from 'react';

interface TransactionFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  categories: string[];
  accounts: any[];
}

export interface FilterState {
  searchTerm: string;
  category: string;
  accountId: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  sortBy: 'date' | 'amount';
  sortOrder: 'asc' | 'desc';
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  onFilterChange,
  categories,
  accounts,
}) => {
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

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
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
  };

  const hasActiveFilters = 
    filters.searchTerm ||
    filters.category ||
    filters.accountId ||
    filters.startDate ||
    filters.endDate ||
    filters.minAmount ||
    filters.maxAmount;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Filters & Search</h3>
        <div className="flex gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {isExpanded ? 'Hide Filters' : 'Show More Filters'}
          </button>
        </div>
      </div>

      {/* Quick Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by merchant or description..."
          value={filters.searchTerm}
          onChange={(e) => handleChange('searchTerm', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Basic Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Account Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account
          </label>
          <select
            value={filters.accountId}
            onChange={(e) => handleChange('accountId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} •••• {account.mask}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <div className="flex gap-2">
            <select
              value={filters.sortBy}
              onChange={(e) => handleChange('sortBy', e.target.value as 'date' | 'amount')}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
            </select>
            <button
              onClick={() =>
                handleChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')
              }
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {filters.sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters (Collapsible) */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={filters.minAmount}
              onChange={(e) => handleChange('minAmount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="1000.00"
              value={filters.maxAmount}
              onChange={(e) => handleChange('maxAmount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Active filters: 
            {filters.searchTerm && <span className="ml-2 text-blue-600">Search: "{filters.searchTerm}"</span>}
            {filters.category && <span className="ml-2 text-blue-600">Category: {filters.category}</span>}
            {filters.accountId && <span className="ml-2 text-blue-600">Account filtered</span>}
            {filters.startDate && <span className="ml-2 text-blue-600">From: {filters.startDate}</span>}
            {filters.endDate && <span className="ml-2 text-blue-600">To: {filters.endDate}</span>}
            {filters.minAmount && <span className="ml-2 text-blue-600">Min: ${filters.minAmount}</span>}
            {filters.maxAmount && <span className="ml-2 text-blue-600">Max: ${filters.maxAmount}</span>}
          </p>
        </div>
      )}
    </div>
  );
};
