import { describe, it, expect } from "vitest";
import {
  toDateString,
  getDateRange,
  getTodayDate,
  getWeekdaysArray,
  getLastNDays,
} from "../utils";

describe("toDateString", () => {
  it("returns date in YYYY-MM-DD format using local time components", () => {
    const date = new Date(2026, 0, 15, 12, 0, 0); // Jan 15, 2026 noon local
    expect(toDateString(date)).toBe("2026-01-15");
  });

  it("does not use toISOString -- late December near midnight stays in same year", () => {
    const date = new Date(2026, 11, 31, 23, 0, 0);
    expect(toDateString(date)).toBe("2026-12-31");
  });

  it("pads single-digit months and days with leading zero", () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toDateString(new Date(2026, 10, 9))).toBe("2026-11-09");
  });
});

describe("getTodayDate", () => {
  it("returns today's date in YYYY-MM-DD format", () => {
    const result = getTodayDate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("getWeekdaysArray", () => {
  it("returns all weekdays when weekdays is undefined", () => {
    expect(getWeekdaysArray(undefined)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("returns all weekdays when weekdays is null", () => {
    expect(getWeekdaysArray(null)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("returns all weekdays when weekdays is empty string", () => {
    expect(getWeekdaysArray("")).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("parses valid JSON weekdays array", () => {
    expect(getWeekdaysArray("[1,3,5]")).toEqual([1, 3, 5]);
  });

  it("returns all weekdays for invalid JSON", () => {
    expect(getWeekdaysArray("invalid")).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("returns all weekdays for empty array JSON", () => {
    expect(getWeekdaysArray("[]")).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe("getDateRange", () => {
  it("returns correct range for 7 days back", () => {
    const range = getDateRange(7);
    const today = toDateString(new Date());
    const sevenDaysAgo = toDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    expect(range.end).toBe(today);
    expect(range.start).toBe(sevenDaysAgo);
  });
});

describe("getLastNDays", () => {
  it("returns array of N date strings", () => {
    const result = getLastNDays(5);
    expect(result).toHaveLength(5);
    result.forEach((d) => {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it("returns dates in ascending order", () => {
    const result = getLastNDays(3);
    const d1 = new Date(result[0]);
    const d2 = new Date(result[1]);
    const d3 = new Date(result[2]);
    expect(d1 <= d2).toBe(true);
    expect(d2 <= d3).toBe(true);
  });
});
