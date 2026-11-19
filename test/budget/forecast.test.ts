import { describe, it, expect } from "vitest";
import { buildForecast, type ForecastBill, type ForecastIncome } from "@/lib/budget/forecast";
import { todayISO, addDaysISO } from "@/lib/budget/recurrence";

/**
 * ADR-0006: project the balance forward, counting each pound once.
 * Only UNPAID future bills are subtracted (a paid bill is already a transaction
 * in the starting balance); expected income is added.
 *
 * BDD (Use Case 4 — "Upcoming balance forecast"):
 *   GIVEN my balance, upcoming bills and expected income
 *   WHEN I view the forecast
 *   THEN I see where my balance goes and when it would dip below my buffer.
 */

const bill = (amount: number, inDays: number, status = "unpaid"): ForecastBill => ({
  name: `bill-${amount}`,
  amount,
  due_date: addDaysISO(todayISO(), inDays),
  recurrence: "none",
  status,
});

const income = (amount: number, inDays: number): ForecastIncome => ({
  source_name: `income-${amount}`,
  amount,
  next_date: addDaysISO(todayISO(), inDays),
  recurrence: "none",
});

describe("buildForecast (ADR-0006)", () => {
  it("subtracts an unpaid future bill from the running balance", () => {
    const f = buildForecast(1000, [bill(200, 5)], [], { horizonDays: 45 });
    expect(f.events).toHaveLength(1);
    expect(f.events[0].delta).toBe(-200);
    expect(f.events[0].balance).toBe(800);
    expect(f.lowest).toBe(800);
  });

  it("does NOT double-count a paid bill (money counted once)", () => {
    // A huge PAID bill must not move the projection at all.
    const f = buildForecast(1000, [bill(99999, 5, "paid")], [], { horizonDays: 45 });
    expect(f.events).toHaveLength(0);
    expect(f.lowest).toBe(1000);
    expect(f.firstNegativeDate).toBeNull();
  });

  it("adds expected income", () => {
    const f = buildForecast(100, [], [income(500, 3)], { horizonDays: 45 });
    expect(f.events).toHaveLength(1);
    expect(f.events[0].delta).toBe(500);
    expect(f.events[0].balance).toBe(600);
  });

  it("flags the first date the balance falls below the buffer", () => {
    const f = buildForecast(300, [bill(250, 4)], [], { horizonDays: 45, buffer: 100 });
    // after the bill, balance = 50, which is below the 100 buffer
    expect(f.firstNegativeDate).toBe(addDaysISO(todayISO(), 4));
    expect(f.lowest).toBe(50);
    expect(f.lowestDate).toBe(addDaysISO(todayISO(), 4));
  });

  it("orders same-day events income-first (money in before money out)", () => {
    const sameDay = 7;
    const f = buildForecast(100, [bill(80, sameDay)], [income(200, sameDay)], { horizonDays: 45 });
    expect(f.events.map((e) => e.delta)).toEqual([200, -80]);
    // never dips negative because income lands first
    expect(f.lowest).toBe(100);
  });
});
