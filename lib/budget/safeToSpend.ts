import { occurrencesInRange, todayISO, addDaysISO, daysBetween } from "@/lib/budget/recurrence";
import type { ForecastBill, ForecastIncome } from "@/lib/budget/forecast";

export type SafeToSpend = {
  safe: number; // money you can spend today and still cover bills before next income
  currentBalance: number;
  upcomingBills: number; // unpaid bills due within the coverage window
  buffer: number;
  nextIncomeDate: string | null;
  windowEnd: string; // date the coverage window runs to
  days: number; // days in the coverage window
  perDay: number; // suggested safe daily spend
};

const DEFAULT_WINDOW_DAYS = 14;

/** The soonest future income occurrence, or null if none is scheduled. */
export function nextIncomeDate(incomes: ForecastIncome[], fromISO: string, horizonISO: string): string | null {
  let best: string | null = null;
  for (const inc of incomes) {
    if (!inc.next_date) continue;
    for (const d of occurrencesInRange(inc.next_date, inc.recurrence, fromISO, horizonISO)) {
      if (d > fromISO && (best === null || d < best)) best = d;
    }
  }
  return best;
}

/**
 * Safe to spend today = current balance minus the unpaid bills due before your
 * next income, minus your buffer. Conservative on purpose: we do NOT count
 * income that hasn't arrived, so the number is money you actually have.
 */
export function computeSafeToSpend(
  currentBalance: number,
  bills: ForecastBill[],
  incomes: ForecastIncome[],
  buffer: number,
): SafeToSpend {
  const today = todayISO();
  const horizon = addDaysISO(today, 60);
  const next = nextIncomeDate(incomes, today, horizon);
  const windowEnd = next ?? addDaysISO(today, DEFAULT_WINDOW_DAYS);

  let upcomingBills = 0;
  for (const b of bills) {
    if (b.status === "paid") continue;
    const count = occurrencesInRange(b.due_date, b.recurrence, today, windowEnd).length;
    upcomingBills += Math.abs(Number(b.amount)) * count;
  }

  const safe = currentBalance - upcomingBills - buffer;
  const days = Math.max(1, daysBetween(today, windowEnd));
  const perDay = safe > 0 ? safe / days : 0;

  return {
    safe,
    currentBalance,
    upcomingBills,
    buffer,
    nextIncomeDate: next,
    windowEnd,
    days,
    perDay,
  };
}
