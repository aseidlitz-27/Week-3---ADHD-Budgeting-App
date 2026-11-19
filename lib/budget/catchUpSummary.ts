/**
 * Pure helpers for the re-entry "catch me up" summary (ADR-0008 / ADR-0011).
 * Kept separate from the server action so the money math is unit-testable.
 */

export type CatchUpItem = { merchant: string; amount: number; category: string };
export type CategoryTotal = { category: string; total: number; count: number };

/**
 * Group imported transactions by category, summing the (absolute) amounts and
 * counting how many fell in each. Sorted biggest-spend first, so "where it went"
 * reads top-to-bottom.
 */
export function summarizeByCategory(items: CatchUpItem[]): CategoryTotal[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const it of items) {
    const cur = map.get(it.category) ?? { total: 0, count: 0 };
    cur.total += Math.abs(Number(it.amount));
    cur.count += 1;
    map.set(it.category, cur);
  }
  return [...map.entries()]
    .map(([category, v]) => ({ category, total: v.total, count: v.count }))
    .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));
}
