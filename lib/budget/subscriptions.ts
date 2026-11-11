import { daysBetween } from "@/lib/budget/recurrence";

export type DetectTxn = {
  merchant: string | null;
  amount: number;
  occurred_on: string;
  type: "expense" | "income";
};

export type DetectedSubscription = {
  merchant: string;
  typicalAmount: number;
  count: number;
  lastDate: string;
  cadence: "weekly" | "monthly";
};

/**
 * Flag likely subscriptions: the same merchant charged a similar amount at a
 * regular (weekly or monthly) cadence at least twice.
 */
export function detectSubscriptions(txns: DetectTxn[]): DetectedSubscription[] {
  const byMerchant = new Map<string, DetectTxn[]>();
  for (const t of txns) {
    if (t.type !== "expense" || !t.merchant) continue;
    const arr = byMerchant.get(t.merchant) ?? [];
    arr.push(t);
    byMerchant.set(t.merchant, arr);
  }

  const out: DetectedSubscription[] = [];
  for (const [merchant, list] of byMerchant) {
    if (list.length < 2) continue;
    const dates = list.map((t) => t.occurred_on).sort();
    const amounts = list.map((t) => Math.abs(Number(t.amount)));
    const typical = amounts.sort((a, b) => a - b)[Math.floor(amounts.length / 2)];

    // amounts must be similar (within 15% of the typical)
    const similar = amounts.every((a) => Math.abs(a - typical) <= typical * 0.15 + 0.01);
    if (!similar) continue;

    // check gaps for a weekly or monthly cadence
    const gaps: number[] = [];
    for (let i = 1; i < dates.length; i++) gaps.push(daysBetween(dates[i - 1], dates[i]));
    const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;

    let cadence: "weekly" | "monthly" | null = null;
    if (avgGap >= 5 && avgGap <= 9) cadence = "weekly";
    else if (avgGap >= 24 && avgGap <= 38) cadence = "monthly";
    if (!cadence) continue;

    out.push({
      merchant,
      typicalAmount: typical,
      count: list.length,
      lastDate: dates[dates.length - 1],
      cadence,
    });
  }

  return out.sort((a, b) => b.typicalAmount - a.typicalAmount);
}
