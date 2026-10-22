import type { Settings } from "../shared/types";

/* 按固定间隔循环的三种提醒；自定义提醒按每天固定时刻，另有调度逻辑。 */
export type IntervalReminderKind = "break" | "hydration" | "stand";

export const INTERVAL_REMINDER_KINDS: readonly IntervalReminderKind[] = ["break", "hydration", "stand"];

/* 每种提醒下一次到点的时间戳（毫秒），null 表示当前没有排程。持久化到 store，重启后接着算。 */
export type ReminderDueAtMap = Record<IntervalReminderKind, number | null>;

export function emptyReminderDueAt(): ReminderDueAtMap {
  return { break: null, hydration: null, stand: null };
}

export function isIntervalReminderEnabled(kind: IntervalReminderKind, settings: Settings): boolean {
  if (kind === "break") return settings.breakReminderEnabled;
  if (kind === "hydration") return settings.hydrationReminderEnabled;
  return settings.standReminderEnabled;
}

export function intervalReminderMs(kind: IntervalReminderKind, settings: Settings): number {
  const minutes =
    kind === "break"
      ? settings.breakIntervalMinutes
      : kind === "hydration"
        ? settings.hydrationIntervalMinutes
        : settings.standIntervalMinutes;
  return minutes * 60 * 1000;
}

/*
 * 只有提醒自己的开关或间隔变了才需要重排；改宠物大小、语言等其他设置不应该让倒计时清零。
 */
export function changedIntervalReminderKinds(previous: Settings, next: Settings): IntervalReminderKind[] {
  return INTERVAL_REMINDER_KINDS.filter((kind) => {
    const is_enabled_changed = isIntervalReminderEnabled(kind, previous) !== isIntervalReminderEnabled(kind, next);
    const is_interval_changed = intervalReminderMs(kind, previous) !== intervalReminderMs(kind, next);
    return is_enabled_changed || is_interval_changed;
  });
}

/*
 * 启动时恢复一个提醒还要等多久，分三种出路：
 * 1. 没有存过到点时间（第一次运行或之前被关掉）：按完整间隔重新开始；
 * 2. 存的到点时间还没到：接着等剩下的时间；
 * 3. 关机期间已经过点：启动后等 overdueDelayMs 再提醒，给程序留出加载时间，也不会一启动就弹。
 * 存的值比"现在 + 完整间隔"还远（例如间隔被改小、系统时间被往回调）时，按完整间隔截断。
 */
export function restoreReminderDelayMs(
  storedDueAt: number | null | undefined,
  intervalMs: number,
  nowMs: number,
  overdueDelayMs: number
): number {
  if (typeof storedDueAt !== "number" || !Number.isFinite(storedDueAt)) return intervalMs;
  const remaining_ms = storedDueAt - nowMs;
  if (remaining_ms <= 0) return overdueDelayMs;
  return Math.min(remaining_ms, intervalMs);
}
