import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const APP_NAME = "PawPause";
export const STORE_NAME = "pawpause";

export const PET_WINDOW = {
  width: 220,
  height: 340
} as const;

export const SCREEN_BLOCK_WINDOW = {
  minWidth: 520,
  minHeight: 420
} as const;

/* 收纳到右侧时的小图标窗口，贴屏幕右边缘，左侧圆角露出一个小爪标签。 */
export const DOCK_WINDOW = {
  width: 40,
  height: 48
} as const;
/* 拖动宠物松手时，鼠标离屏幕右边缘不超过这个距离就自动收纳。 */
export const DOCK_EDGE_SNAP_PX = 6;
/* 收纳中提醒结束后，等这么久再缩回，避免气泡刚消失窗口就闪走。 */
export const DOCK_REDOCK_DELAY_MS = 1500;
/* 自定义收纳图标的大小上限，图标会以 data URL 发给渲染层，太大没必要。 */
export const DOCK_ICON_MAX_BYTES = 2 * 1024 * 1024;

export const SETTINGS_WINDOW = {
  width: 760,
  height: 680
} as const;

export const PRELOAD_PATH = join(__dirname, "../preload/index.cjs");
export const RENDERER_HTML_PATH = join(__dirname, "../renderer/index.html");
export const IS_DEV = Boolean(process.env.ELECTRON_RENDERER_URL);

export const DISTRACTION_CHECK_INTERVAL_MS = 3000;
export const DISTRACTION_WARNING_COOLDOWN_MS = 60_000;
export const BREAK_RUN_DURATION_MS = 60_000;
export const BREAK_RUN_TICK_MS = 16;
/* 各提醒点"稍后"后的顺延时间，沿用原项目的取值：休息 10 分钟、喝水 15 分钟。 */
export const BREAK_SNOOZE_MS = 10 * 60_000;
export const HYDRATION_SNOOZE_MS = 15 * 60_000;
export const STAND_SNOOZE_MS = 10 * 60_000;
/* 提醒到点时正有别的提醒占着气泡，只把这一个提醒顺延这么久，不去重置其他计时器。 */
export const REMINDER_BUSY_RETRY_MS = 60_000;
/* 关机期间已经过点的提醒，启动后等这么久再弹，留出窗口加载时间。 */
export const REMINDER_OVERDUE_DELAY_MS = 60_000;
/* 专注期间到点的提醒，专注结束后等这么久再补，避开"专注结束"气泡（约 3 秒）。 */
export const FOCUS_END_REMINDER_DELAY_MS = 6_000;
