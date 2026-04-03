/**
 * Net worth aligned with dashboard summary tiles:
 * cash (depository) + investments − credit card balances.
 * Other Plaid types (e.g. loan) are excluded.
 */
export function computeNetWorthFromAccounts(
  accounts: { type: string; balances: { current: number | null } }[],
): number {
  const cash = accounts
    .filter((a) => a.type === 'depository')
    .reduce((s, a) => s + (a.balances.current ?? 0), 0);
  const inv = accounts
    .filter((a) => a.type === 'investment')
    .reduce((s, a) => s + (a.balances.current ?? 0), 0);
  const cred = accounts
    .filter((a) => a.type === 'credit')
    .reduce((s, a) => s + (a.balances.current ?? 0), 0);
  return cash + inv - cred;
}

const NW_TYPES = new Set(['depository', 'credit', 'investment']);

export function accountsIncludedInNetWorth<T extends { type: string }>(accounts: T[]): T[] {
  return accounts.filter((a) => NW_TYPES.has(a.type));
}
