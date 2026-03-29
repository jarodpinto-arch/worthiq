/** Heuristic: options / derivatives vs stocks, ETFs, funds, etc. (Plaid security + tx fields). */
export function isOptionsLeg(tx: { subtype?: string; security_id?: string }, sec: any | undefined): boolean {
  const st = (tx?.subtype || '').toLowerCase();
  const nm = (sec?.name || '').toLowerCase();
  return sec?.type === 'derivative' || st.includes('option') || nm.includes('option');
}

export type InstrumentKindFilter = 'options_only' | 'non_options' | 'all';

export function filterInvestmentTxByInstrumentKind<T extends { security_id?: string; subtype?: string }>(
  txs: T[],
  securities: any[],
  kind: InstrumentKindFilter | undefined,
): T[] {
  if (!kind || kind === 'all') return txs;
  const secMap = new Map(securities.map((s) => [s.security_id, s]));
  return txs.filter((t) => {
    const opt = isOptionsLeg(t, secMap.get(t.security_id));
    return kind === 'options_only' ? opt : !opt;
  });
}
