/**
 * Time-bucket layout for net-worth bar charts (aligned with dashboard timeframe presets).
 */

export type TimeBucketPlan = {
  bucketCount: number;
  rangeStartMs: number;
  rangeEndMs: number;
};

/** Calendar-day range ending today, matching daily net-worth walk semantics. */
export function timeBucketPlanForDays(days: number): TimeBucketPlan {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(today);
  rangeEnd.setHours(23, 59, 59, 999);

  if (days <= 1) {
    return { bucketCount: 24, rangeStartMs: today.getTime(), rangeEndMs: rangeEnd.getTime() };
  }
  if (days <= 7) {
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - days);
    return { bucketCount: 12, rangeStartMs: rangeStart.getTime(), rangeEndMs: rangeEnd.getTime() };
  }
  if (days <= 30) {
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - 29);
    return { bucketCount: 30, rangeStartMs: rangeStart.getTime(), rangeEndMs: rangeEnd.getTime() };
  }
  if (days <= 90) {
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - days);
    return { bucketCount: 12, rangeStartMs: rangeStart.getTime(), rangeEndMs: rangeEnd.getTime() };
  }
  if (days <= 180) {
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - days);
    return { bucketCount: 12, rangeStartMs: rangeStart.getTime(), rangeEndMs: rangeEnd.getTime() };
  }
  const rangeStart = new Date(today);
  rangeStart.setDate(rangeStart.getDate() - days);
  return { bucketCount: 12, rangeStartMs: rangeStart.getTime(), rangeEndMs: rangeEnd.getTime() };
}

function bucketEdges(plan: TimeBucketPlan): number[] {
  const { rangeStartMs, rangeEndMs, bucketCount } = plan;
  const span = rangeEndMs - rangeStartMs + 1;
  const step = span / bucketCount;
  const edges: number[] = [];
  for (let i = 0; i <= bucketCount; i++) {
    edges.push(rangeStartMs + Math.round(i * step));
  }
  return edges;
}

export type TxLike = {
  account_id?: string;
  amount: number;
  date: string;
  datetime?: string | null;
  authorized_datetime?: string | null;
};

/** Parse transaction time; falls back to noon local on `date`. */
export function txTimeMs(tx: TxLike): number {
  const iso = tx.datetime || tx.authorized_datetime;
  if (iso) {
    const t = Date.parse(iso);
    if (!Number.isNaN(t)) return t;
  }
  return new Date(`${tx.date}T12:00:00`).getTime();
}

export function hasPreciseTime(tx: TxLike): boolean {
  const iso = tx.datetime || tx.authorized_datetime;
  if (!iso) return false;
  const t = Date.parse(iso);
  return !Number.isNaN(t);
}

/**
 * Stacked bar rows: each bucket has `label`, `bucketStart`, `bucketEnd`, and per-account_id amounts.
 * Uses Plaid sign: positive = outflow, negative = inflow.
 */
export function buildTimeBucketFlowData(
  transactions: TxLike[],
  accountIds: Set<string>,
  plan: TimeBucketPlan,
): { rows: Record<string, number | string>[]; accountIdsOrdered: string[] } {
  const edges = bucketEdges(plan);
  const n = plan.bucketCount;
  const perBucketPerAccount: number[][] = Array.from({ length: n }, () => []);

  const idList = Array.from(accountIds);
  for (let i = 0; i < n; i++) {
    perBucketPerAccount[i] = idList.map(() => 0);
  }

  for (const tx of transactions) {
    if (!tx.account_id || !accountIds.has(tx.account_id)) continue;
    const accIdx = idList.indexOf(tx.account_id);
    if (accIdx < 0) continue;

    if (hasPreciseTime(tx)) {
      const t = txTimeMs(tx);
      if (t < plan.rangeStartMs || t > plan.rangeEndMs) continue;
      const span = plan.rangeEndMs - plan.rangeStartMs + 1;
      let b = Math.floor(((t - plan.rangeStartMs) / span) * n);
      if (b < 0) b = 0;
      if (b >= n) b = n - 1;
      perBucketPerAccount[b][accIdx] += tx.amount;
    } else {
      const dayStart = new Date(`${tx.date}T00:00:00`).getTime();
      const dayEnd = new Date(`${tx.date}T23:59:59.999`).getTime();
      const dayLen = Math.max(1, dayEnd - dayStart + 1);
      for (let b = 0; b < n; b++) {
        const bucketStart = edges[b];
        const bucketEndExcl = edges[b + 1];
        if (dayEnd < bucketStart || dayStart >= bucketEndExcl) continue;
        const ovStart = Math.max(bucketStart, dayStart);
        const ovEndIncl = Math.min(bucketEndExcl - 1, dayEnd);
        if (ovStart > ovEndIncl) continue;
        const ovLen = ovEndIncl - ovStart + 1;
        const frac = ovLen / dayLen;
        perBucketPerAccount[b][accIdx] += tx.amount * frac;
      }
    }
  }

  const rows: Record<string, number | string>[] = [];
  for (let b = 0; b < n; b++) {
    const bs = edges[b];
    const beIncl = edges[b + 1] - 1;
    const row: Record<string, number | string> = {
      bucketIndex: b,
      bucketStart: bs,
      bucketEnd: beIncl,
      axisLabel: formatBarAxisTick(bs, beIncl, plan),
      tooltipLabel: formatBarTooltipRange(bs, beIncl, plan),
    };
    for (let i = 0; i < idList.length; i++) {
      row[idList[i]] = Math.round(perBucketPerAccount[b][i] * 100) / 100;
    }
    rows.push(row);
  }

  return { rows, accountIdsOrdered: idList };
}

/** Short, fixed-width style labels for the x-axis (even visual rhythm). */
function formatBarAxisTick(startMs: number, endMs: number, plan: TimeBucketPlan): string {
  const start = new Date(startMs);
  const end = new Date(endMs);

  if (plan.bucketCount === 24) {
    const h = start.getHours();
    const h12 = h % 12 || 12;
    const ap = h < 12 ? 'a' : 'p';
    return `${h12}${ap}`;
  }
  if (plan.bucketCount === 30) {
    return `${start.getMonth() + 1}/${start.getDate()}`;
  }
  if (plan.bucketCount === 12) {
    const rangeDays = (plan.rangeEndMs - plan.rangeStartMs) / (24 * 60 * 60 * 1000);
    if (rangeDays < 10) {
      const h = start.getHours();
      const h12 = h % 12 || 12;
      const ap = h < 12 ? 'a' : 'p';
      return `${start.getMonth() + 1}/${start.getDate()} ${h12}${ap}`;
    }
    return `${start.getMonth() + 1}/${start.getDate()}`;
  }
  return `${start.getMonth() + 1}/${start.getDate()}`;
}

/** Fuller range text for tooltips. */
function formatBarTooltipRange(startMs: number, endMs: number, plan: TimeBucketPlan): string {
  const start = new Date(startMs);
  const end = new Date(endMs);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (plan.bucketCount === 24) {
    return start.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  if (sameDay) {
    return `${start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} – ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  }
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}
