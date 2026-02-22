export type WidgetType =
  | 'spending-by-category'
  | 'monthly-trends'
  | 'account-balances'
  | 'recent-transactions'
  | 'budget-progress'
  | 'top-merchants'
  | 'spending-by-day'
  | 'net-worth-card'
  | 'income-vs-expenses'
  | 'savings-rate'
  | 'spending-heatmap'
  | 'category-comparison';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  settings?: Record<string, any>;
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
  lastUpdated: string;
}

export interface WidgetDefinition {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  defaultSize: WidgetSize;
  availableSizes: WidgetSize[];
}

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    type: 'net-worth-card',
    name: 'Net Worth',
    description: 'Display your total net worth across all accounts',
    icon: '💰',
    defaultSize: 'small',
    availableSizes: ['small', 'medium'],
  },
  {
    type: 'spending-by-category',
    name: 'Spending by Category',
    description: 'Pie chart showing spending distribution',
    icon: '🥧',
    defaultSize: 'medium',
    availableSizes: ['medium', 'large'],
  },
  {
    type: 'monthly-trends',
    name: 'Monthly Trends',
    description: 'Line chart of income and spending over time',
    icon: '📈',
    defaultSize: 'large',
    availableSizes: ['medium', 'large', 'full'],
  },
  {
    type: 'account-balances',
    name: 'Account Balances',
    description: 'List of all connected accounts with balances',
    icon: '🏦',
    defaultSize: 'medium',
    availableSizes: ['small', 'medium', 'large'],
  },
  {
    type: 'recent-transactions',
    name: 'Recent Transactions',
    description: 'Latest transactions across all accounts',
    icon: '📋',
    defaultSize: 'medium',
    availableSizes: ['medium', 'large'],
  },
  {
    type: 'budget-progress',
    name: 'Budget Progress',
    description: 'Progress bars for your budget categories',
    icon: '🎯',
    defaultSize: 'medium',
    availableSizes: ['small', 'medium', 'large'],
  },
  {
    type: 'top-merchants',
    name: 'Top Merchants',
    description: 'Where you spend the most money',
    icon: '🏪',
    defaultSize: 'medium',
    availableSizes: ['small', 'medium'],
  },
  {
    type: 'spending-by-day',
    name: 'Spending by Day',
    description: 'Bar chart of spending by day of week',
    icon: '📅',
    defaultSize: 'medium',
    availableSizes: ['medium', 'large'],
  },
  {
    type: 'income-vs-expenses',
    name: 'Income vs Expenses',
    description: 'Compare your income and expenses',
    icon: '⚖️',
    defaultSize: 'medium',
    availableSizes: ['small', 'medium', 'large'],
  },
  {
    type: 'savings-rate',
    name: 'Savings Rate',
    description: 'Your savings rate as a percentage',
    icon: '🐷',
    defaultSize: 'small',
    availableSizes: ['small', 'medium'],
  },
];

export const SIZE_CLASSES: Record<WidgetSize, string> = {
  small: 'col-span-1',
  medium: 'col-span-1 lg:col-span-2',
  large: 'col-span-1 lg:col-span-2 xl:col-span-3',
  full: 'col-span-full',
};
