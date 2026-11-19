import { describe, it, expect } from "vitest";
import { summarizeByCategory, type CatchUpItem } from "@/lib/budget/catchUpSummary";

/**
 * The catch-up summary (ADR-0011) must show "where it went" by category after a
 * re-entry import. These tests lock in the grouping, the totals, and the
 * biggest-spend-first ordering.
 */

const item = (merchant: string, amount: number, category: string): CatchUpItem => ({
  merchant,
  amount,
  category,
});

describe("summarizeByCategory (ADR-0011)", () => {
  it("groups by category and sums the amounts", () => {
    const got = summarizeByCategory([
      item("Starbucks", 4.95, "Dining"),
      item("Local Cafe", 9.2, "Dining"),
      item("Tesco Express", 18.4, "Groceries"),
    ]);
    const dining = got.find((c) => c.category === "Dining")!;
    expect(dining.total).toBeCloseTo(14.15, 2);
    expect(dining.count).toBe(2);
    expect(got.find((c) => c.category === "Groceries")!.total).toBeCloseTo(18.4, 2);
  });

  it("orders categories by spend, biggest first", () => {
    const got = summarizeByCategory([
      item("Starbucks", 4.95, "Dining"),
      item("Tesco Express", 18.4, "Groceries"),
      item("TfL Travel", 6.6, "Transport"),
    ]);
    expect(got.map((c) => c.category)).toEqual(["Groceries", "Transport", "Dining"]);
  });

  it("uses absolute amounts (a credit never subtracts from a category)", () => {
    const got = summarizeByCategory([item("Refund", -10, "Shopping"), item("Amazon", 23.75, "Shopping")]);
    expect(got[0].total).toBeCloseTo(33.75, 2);
    expect(got[0].count).toBe(2);
  });

  it("returns an empty list for no items (the 'all caught up' case)", () => {
    expect(summarizeByCategory([])).toEqual([]);
  });
});
