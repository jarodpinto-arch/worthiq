/** localStorage / AsyncStorage key — keep identical on web and mobile. */
export const NW_DISPLAY_FORMAT_KEY = 'worthiq_nw_display_format_v1';

export type NwDisplayFormat = 'compact' | 'precise';

/** Charts, deltas, axes — compact K/M / whole dollars. */
export function fmtCurrency(n: number): string {
  const abs = Math.abs(n);
  const neg = n < 0;
  if (abs >= 1_000_000) return `${neg ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${neg ? '-' : ''}$${(abs / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function fmtCurrencyPrecise(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatNetWorthHeadline(n: number, mode: NwDisplayFormat): string {
  return mode === 'precise' ? fmtCurrencyPrecise(n) : fmtCurrency(n);
}

/** Plain whole-dollar USD (tiles, lists). */
export function fmtCurrencyWhole(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}
