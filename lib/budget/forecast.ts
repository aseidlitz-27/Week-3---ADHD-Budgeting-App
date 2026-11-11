import { occurrencesInRange, todayISO, addDaysISO } from "@/lib/budget/recurrence";

export type ForecastBill = {
  name: string;
  amount: number;
  due_date: string;
  recurrence: string;
  status: string; // "unpaid" | "paid"
};
export type ForecastIncome = {
  source_name: string;
  amount: number;
  next_date: string | null;
  recurrence: string;
};
export type ForecastEvent = {
  date: string;
  label: string;
  delta: number; // negative for bills, positive for income
  balance: number; // running projected balance AFTER this event
};
export type Forecast = {
  startBalance: number;
  events: ForecastEvent[];
  lowest: number;
  lowestDate: string | null;
  firstNegativeDate: string | null;
  buffer: number;
};

/**
 * Project the balance forward from today. Counts each pound once:
 * only UNPAID future bills are subtracted (a paid bill is already a
 * transaction reflected in the starting balance), and expected income is added.
 */
export function buildForecast(
  startBalance: number,
  bills: ForecastBill[],
  incomes: ForecastIncome[],
  opts: { horizonDays?: number; buffer?: number } = {},
): Forecast {
  const horizonDays = opts.horizonDays ?? 45;
  const buffer = opts.buffer ?? 0;
  const from = todayISO();
  const to = addDaysISO(from, horizonDays);

  const raw: { date: string; label: string; delta: number }[] = [];

  for (const b of bills) {
    if (b.status === "paid") continue; // already counted as a transaction
    for (const date of occurrencesInRange(b.due_date, b.recurrence, from, to)) {
      raw.push({ date, label: b.name, delta: -Math.abs(Number(b.amount)) });
    }
  }
  for (const inc of incomes) {
    if (!inc.next_date) continue; // irregular with no date — can't project
    for (const date of occurrencesInRange(inc.next_date, inc.recurrence, from, to)) {
      raw.push({ date, label: inc.source_name, delta: Math.abs(Number(inc.amount)) });
    }
  }

  // Order by date; on the same day, income before bills (money in first).
  raw.sort((a, b) => (a.date === b.date ? b.delta - a.delta : a.date < b.date ? -1 : 1));

  let balance = startBalance;
  let lowest = startBalance;
  let lowestDate: string | null = null;
  let firstNegativeDate: string | null = null;
  const events: ForecastEvent[] = [];

  for (const e of raw) {
    balance += e.delta;
    if (balance < lowest) {
      lowest = balance;
      lowestDate = e.date;
    }
    if (firstNegativeDate === null && balance < buffer) {
      firstNegativeDate = e.date;
    }
    events.push({ ...e, balance });
  }

  return { startBalance, events, lowest, lowestDate, firstNegativeDate, buffer };
}
