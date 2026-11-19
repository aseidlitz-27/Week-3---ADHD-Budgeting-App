import { describe, it, expect } from "vitest";
import { detectSubscriptions, type DetectTxn } from "@/lib/budget/subscriptions";

/**
 * Subscription detection (Epic 1 — "where it went" / recurring spend).
 * A likely subscription = same merchant, similar amount, regular weekly or
 * monthly cadence, seen at least twice. Edge cases per testing-standards:
 * single charge, dissimilar amounts, income excluded.
 */

const txn = (merchant: string | null, amount: number, occurred_on: string, type: "expense" | "income" = "expense"): DetectTxn => ({
  merchant,
  amount,
  occurred_on,
  type,
});

describe("detectSubscriptions", () => {
  it("flags a monthly subscription with a stable amount", () => {
    const got = detectSubscriptions([
      txn("Netflix", 10.99, "2026-01-05"),
      txn("Netflix", 10.99, "2026-02-04"),
      txn("Netflix", 10.99, "2026-03-06"),
    ]);
    expect(got).toHaveLength(1);
    expect(got[0].merchant).toBe("Netflix");
    expect(got[0].cadence).toBe("monthly");
    expect(got[0].count).toBe(3);
  });

  it("flags a weekly subscription", () => {
    const got = detectSubscriptions([
      txn("Gym Day Pass", 12, "2026-01-01"),
      txn("Gym Day Pass", 12, "2026-01-08"),
      txn("Gym Day Pass", 12, "2026-01-15"),
    ]);
    expect(got).toHaveLength(1);
    expect(got[0].cadence).toBe("weekly");
  });

  it("ignores a merchant seen only once", () => {
    expect(detectSubscriptions([txn("Amazon", 38.99, "2026-01-10")])).toEqual([]);
  });

  it("ignores charges whose amounts vary too much to be a subscription", () => {
    const got = detectSubscriptions([
      txn("Corner Shop", 5, "2026-01-01"),
      txn("Corner Shop", 50, "2026-02-01"),
    ]);
    expect(got).toEqual([]);
  });

  it("ignores income and null-merchant rows", () => {
    const got = detectSubscriptions([
      txn("Acme Salary", 2000, "2026-01-01", "income"),
      txn("Acme Salary", 2000, "2026-02-01", "income"),
      txn(null, 9.99, "2026-01-01"),
      txn(null, 9.99, "2026-02-01"),
    ]);
    expect(got).toEqual([]);
  });
});
