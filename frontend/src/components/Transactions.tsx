import React from 'react';
import { formatCurrency } from '../utils/format';

interface Transaction {
  id: string;
  amount: number;
  date: string;
  name: string;
  merchantName?: string;
  category: string[];
  pending: boolean;
  account: {
    name: string;
    mask: string;
  };
  item: {
    institutionName: string;
  };
}

interface TransactionsProps {
  transactions: Transaction[];
}

export const Transactions: React.FC<TransactionsProps> = ({ transactions }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getCategoryColor = (category: string[]) => {
    if (!category || category.length === 0) return 'bg-gray-100 text-gray-800';
    
    const primaryCategory = category[0].toLowerCase();
    if (primaryCategory.includes('food')) return 'bg-orange-100 text-orange-800';
    if (primaryCategory.includes('travel')) return 'bg-blue-100 text-blue-800';
    if (primaryCategory.includes('shopping')) return 'bg-purple-100 text-purple-800';
    if (primaryCategory.includes('entertainment')) return 'bg-pink-100 text-pink-800';
    if (primaryCategory.includes('transfer')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No transactions found. Click "Fetch Transactions" to load your spending history.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">
                  {transaction.merchantName || transaction.name}
                </p>
                {transaction.pending && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Pending
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mt-1">
                {transaction.account.name} •••• {transaction.account.mask}
              </p>
              
              <div className="flex gap-2 mt-2 flex-wrap">
                {transaction.category && transaction.category.length > 0 && (
                  <span
                    className={`text-xs px-2 py-1 rounded ${getCategoryColor(
                      transaction.category
                    )}`}
                  >
                    {transaction.category[0]}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {formatDate(transaction.date)}
                </span>
              </div>
            </div>

            <div className="text-right ml-4">
              <p
                className={`text-lg font-bold ${
                  transaction.amount > 0
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}
              >
                {transaction.amount > 0 ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};