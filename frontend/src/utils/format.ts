/**
 * Format a number as USD currency with commas
 * @param amount - The amount to format
 * @param showCents - Whether to show cents (default: true)
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export const formatCurrency = (amount: number, showCents: boolean = true): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  });
  return formatter.format(amount);
};

/**
 * Format a number with commas
 * @param num - The number to format
 * @returns Formatted number string (e.g., "1,234")
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Format a date for display
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatDate = (
  date: string | Date,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string => {
  return new Date(date).toLocaleDateString('en-US', options);
};
