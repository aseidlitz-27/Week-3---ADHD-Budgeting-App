import { describe, it, expect } from "vitest";
import { computeMilestones, type RewardStats } from "@/lib/budget/rewards";

/**
 * ADR-0008: rewards are ADDITIVE milestones only — there is no streak to break
 * and nothing is ever taken away (shame-free). These tests lock in that
 * principle: raising a stat can only turn a milestone ON, never off.
 */

const stats = (over: Partial<RewardStats> = {}): RewardStats => ({
  accounts: 0,
  transactions: 0,
  incomes: 0,
  bills: 0,
  paidBills: 0,
  daysTracked: 0,
  ...over,
});

describe("computeMilestones (ADR-0008)", () => {
  it("returns the full milestone set regardless of progress", () => {
    expect(computeMilestones(stats())).toHaveLength(6);
  });

  it("marks none met for a brand-new user", () => {
    expect(computeMilestones(stats()).every((m) => !m.met)).toBe(true);
  });

  it("turns milestones on as the matching stat crosses its threshold", () => {
    const m = computeMilestones(stats({ accounts: 1, transactions: 3, daysTracked: 7 }));
    const byKind = Object.fromEntries(m.map((x) => [x.kind, x.met]));
    expect(byKind["connected_bank"]).toBe(true);
    expect(byKind["first_transaction"]).toBe(true);
    expect(byKind["week_tracked"]).toBe(true);
    expect(byKind["first_bill"]).toBe(false);
  });

  it("is monotonic: more activity never removes a won milestone", () => {
    const before = computeMilestones(stats({ accounts: 1, bills: 1, paidBills: 1 }));
    const after = computeMilestones(stats({ accounts: 5, bills: 9, paidBills: 3, transactions: 100 }));
    before.forEach((m, i) => {
      if (m.met) expect(after[i].met).toBe(true);
    });
  });
});
