import { describe, it, expect } from "vitest";
import { computeSafeToSpend, nextIncomeDate } from "@/lib/budget/safeToSpend";
import { todayISO, addDaysISO } from "@/lib/budget/recurrence";
import type { ForecastBill, ForecastIncome } from "@/lib/budget/forecast";

/**
 * ADR-0007: safe to spend = current balance
 *   - unpaid bills due before the next income
 *   - buffer.
 * We never count income that has not arrived yet.
 *
 * BDD (Use Case 3 — "Safe to spend today"):
 *   GIVEN a balance, upcoming unpaid bills, and a buffer
 *   WHEN I open the app
 *   THEN I see money I can spend now without missing a bill before my next income.
 */

const bill = (amount: number, inDays: number, status = "unpaid"): ForecastBill => ({
  name: `bill-${amount}`,
  amount,
  due_date: addDaysISO(todayISO(), inDays),
  recurrence: "none",
  status,
});

const income = (amount: number, inDays: number, recurrence = "monthly"): ForecastIncome => ({
  source_name: `income-${amount}`,
  amount,
  next_date: addDaysISO(todayISO(), inDays),
  recurrence,
});

describe("computeSafeToSpend (ADR-0007)", () => {
  it("subtracts unpaid bills due before next income, and the buffer", () => {
    // balance 500, one 200 bill due in 3 days, next income in 10 days, buffer 50
    const r = computeSafeToSpend(500, [bill(200, 3)], [income(2000, 10)], 50);
    expect(r.upcomingBills).toBe(200);
    expect(r.safe).toBe(250); // 500 - 200 - 50
    expect(r.nextIncomeDate).toBe(addDaysISO(todayISO(), 10));
  });

  it("does NOT count income that hasn't arrived (conservative by design)", () => {
    const withBigIncome = computeSafeToSpend(500, [bill(200, 3)], [income(9999, 10)], 50);
    const withoutIncome = computeSafeToSpend(500, [bill(200, 3)], [], 50);
    // The future income must not inflate today's spendable number.
    expect(withBigIncome.safe).toBe(withoutIncome.safe + 0); // income never added to `safe`
    expect(withBigIncome.safe).toBe(250);
  });

  it("ignores bills due AFTER the next income (outside the coverage window)", () => {
    // next income in 5 days; a bill due in 12 days is beyond the window
    const r = computeSafeToSpend(500, [bill(200, 12)], [income(2000, 5)], 0);
    expect(r.upcomingBills).toBe(0);
    expect(r.safe).toBe(500);
  });

  it("excludes bills already marked paid (counted once — ADR-0006/0007)", () => {
    const r = computeSafeToSpend(500, [bill(200, 3, "paid")], [income(2000, 10)], 0);
    expect(r.upcomingBills).toBe(0);
    expect(r.safe).toBe(500);
  });

  it("returns the raw (possibly negative) figure; perDay floors at 0", () => {
    // balance 100, a 300 bill due in 2 days -> formula yields -200.
    const r = computeSafeToSpend(100, [bill(300, 2)], [income(2000, 10)], 0);
    expect(r.safe).toBe(-200); // the UI shows this as £0; the function reports the real math
    expect(r.perDay).toBe(0); // never suggest a negative daily pace
  });

  it("uses a 14-day window when no income is scheduled", () => {
    const r = computeSafeToSpend(500, [], [], 0);
    expect(r.nextIncomeDate).toBeNull();
    expect(r.windowEnd).toBe(addDaysISO(todayISO(), 14));
  });
});

describe("nextIncomeDate", () => {
  it("returns the soonest FUTURE income occurrence", () => {
    const today = todayISO();
    const horizon = addDaysISO(today, 60);
    const next = nextIncomeDate([income(2000, 20), income(500, 6)], today, horizon);
    expect(next).toBe(addDaysISO(today, 6));
  });

  it("returns null when there is no scheduled income", () => {
    const today = todayISO();
    expect(nextIncomeDate([], today, addDaysISO(today, 60))).toBeNull();
  });
});
