/** Date helpers for recurring bills and income. All dates are "YYYY-MM-DD". */

export type Recurrence = "none" | "weekly" | "monthly" | "yearly";
export type IncomeRecurrence = "one_time" | "weekly" | "biweekly" | "monthly" | "irregular";

function parse(iso: string): Date {
  return new Date(iso + "T00:00:00");
}
function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Advance one date by one recurrence step. "none"/"one_time"/"irregular" return the same date. */
export function rollForward(iso: string, recurrence: string): string {
  const d = parse(iso);
  switch (recurrence) {
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "biweekly":
      d.setDate(d.getDate() + 14);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      return iso;
  }
  return toISO(d);
}

/**
 * All occurrence dates of a recurring item within [fromISO, toISO], starting at
 * startISO. Non-recurring items yield their single date if it falls in range.
 */
export function occurrencesInRange(
  startISO: string,
  recurrence: string,
  fromISO: string,
  toISO: string,
): string[] {
  const out: string[] = [];
  const end = parse(toISO).getTime();
  const from = parse(fromISO).getTime();
  const nonRecurring = recurrence === "none" || recurrence === "one_time" || recurrence === "irregular";

  let cur = startISO;
  let guard = 0;
  while (parse(cur).getTime() <= end && guard < 400) {
    if (parse(cur).getTime() >= from) out.push(cur);
    if (nonRecurring) break;
    cur = rollForward(cur, recurrence);
    guard++;
  }
  return out;
}

export function todayISO(): string {
  return toISO(new Date());
}

export function addDaysISO(iso: string, days: number): string {
  const d = parse(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function daysBetween(aISO: string, bISO: string): number {
  return Math.round((parse(bISO).getTime() - parse(aISO).getTime()) / 86400000);
}
