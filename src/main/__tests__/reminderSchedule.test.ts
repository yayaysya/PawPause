import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../../shared/constants";
import { changedIntervalReminderKinds, restoreReminderDelayMs } from "../reminderSchedule";

const MINUTE_MS = 60 * 1000;

describe("restoreReminderDelayMs", () => {
  it("starts a full interval when nothing was stored", () => {
    expect(restoreReminderDelayMs(null, 60 * MINUTE_MS, 1_000, MINUTE_MS)).toBe(60 * MINUTE_MS);
    expect(restoreReminderDelayMs(undefined, 60 * MINUTE_MS, 1_000, MINUTE_MS)).toBe(60 * MINUTE_MS);
  });

  it("continues the remaining time after a restart", () => {
    const now = 10 * MINUTE_MS;
    expect(restoreReminderDelayMs(now + 25 * MINUTE_MS, 60 * MINUTE_MS, now, MINUTE_MS)).toBe(25 * MINUTE_MS);
  });

  it("fires shortly after launch when the reminder came due while the app was closed", () => {
    const now = 100 * MINUTE_MS;
    expect(restoreReminderDelayMs(now - 5 * MINUTE_MS, 60 * MINUTE_MS, now, MINUTE_MS)).toBe(MINUTE_MS);
  });

  it("never waits longer than one full interval", () => {
    const now = 0;
    expect(restoreReminderDelayMs(now + 500 * MINUTE_MS, 60 * MINUTE_MS, now, MINUTE_MS)).toBe(60 * MINUTE_MS);
  });
});

describe("changedIntervalReminderKinds", () => {
  it("ignores settings unrelated to interval reminders", () => {
    const next = { ...DEFAULT_SETTINGS, petScale: 0.5, language: "en" as const };
    expect(changedIntervalReminderKinds(DEFAULT_SETTINGS, next)).toEqual([]);
  });

  it("returns only the reminders whose switch or interval changed", () => {
    const next = { ...DEFAULT_SETTINGS, hydrationIntervalMinutes: 30, standReminderEnabled: false };
    expect(changedIntervalReminderKinds(DEFAULT_SETTINGS, next)).toEqual(["hydration", "stand"]);
  });
});
