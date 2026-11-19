import { describe, it, expect } from "vitest";
import {
  rollForward,
  occurrencesInRange,
  addDaysISO,
  daysBetween,
} from "@/lib/budget/recurrence";

/**
 * The recurrence engine underpins both the forecast (ADR-0006) and
 * safe-to-spend (ADR-0007), so its boundaries matter most. Edge cases per the
 * testing-standards skill: non-recurring items, start-before-range, exact
 * boundaries.
 */

describe("rollForward", () => {
  it("advances by the right step for each cadence", () => {
    expect(rollForward("2026-01-01", "weekly")).toBe("2026-01-08");
    expect(rollForward("2026-01-01", "biweekly")).toBe("2026-01-15");
    expect(rollForward("2026-01-31", "monthly")).toBe("2026-03-03"); // JS month roll (no clamp)
    expect(rollForward("2026-01-01", "yearly")).toBe("2027-01-01");
  });

  it("returns the same date for non-recurring cadences", () => {
    for (const r of ["none", "one_time", "irregular", "whatever"]) {
      expect(rollForward("2026-01-01", r)).toBe("2026-01-01");
    }
  });
});

describe("occurrencesInRange", () => {
  it("yields a single date for a non-recurring item in range", () => {
    expect(occurrencesInRange("2026-02-10", "none", "2026-02-01", "2026-02-28")).toEqual([
      "2026-02-10",
    ]);
  });

  it("yields nothing when the single date is outside the range", () => {
    expect(occurrencesInRange("2026-03-10", "none", "2026-02-01", "2026-02-28")).toEqual([]);
  });

  it("includes the start boundary and the end boundary", () => {
    const got = occurrencesInRange("2026-01-01", "weekly", "2026-01-01", "2026-01-15");
    expect(got).toEqual(["2026-01-01", "2026-01-08", "2026-01-15"]);
  });

  it("skips occurrences before the window start", () => {
    // starts Jan 1 weekly, but we only look from Jan 10 -> first kept is Jan 15
    const got = occurrencesInRange("2026-01-01", "weekly", "2026-01-10", "2026-01-20");
    expect(got).toEqual(["2026-01-15"]);
  });

  it("is bounded (guard) and never runs away", () => {
    const got = occurrencesInRange("2020-01-01", "weekly", "2020-01-01", "2035-01-01");
    expect(got.length).toBeLessThanOrEqual(400);
  });
});

describe("date helpers", () => {
  it("addDaysISO adds calendar days", () => {
    expect(addDaysISO("2026-02-27", 2)).toBe("2026-03-01"); // 2026 is not a leap year
  });
  it("daysBetween counts whole days", () => {
    expect(daysBetween("2026-01-01", "2026-01-11")).toBe(10);
    expect(daysBetween("2026-01-11", "2026-01-01")).toBe(-10);
  });
});
