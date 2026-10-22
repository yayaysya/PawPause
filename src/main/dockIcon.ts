import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { extname, join } from "node:path";

/* 收纳图标支持的格式和对应 MIME，渲染层用 data URL 显示，避免改动资源协议的白名单。 */
const DOCK_ICON_MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml"
};

const DOCK_ICON_DIR_NAME = "dock-icon";
const DOCK_ICON_FILE_PREFIX = "dock-icon-";

export const DOCK_ICON_EXTENSIONS = Object.keys(DOCK_ICON_MIME_TYPES).map((ext) => ext.slice(1));

export type DockIconCopyResult =
  | { ok: true; fileName: string }
  | { ok: false; error: "unsupported_format" | "file_too_large" | "file_missing" };

export function dockIconDir(userDataDir: string): string {
  return join(userDataDir, DOCK_ICON_DIR_NAME);
}

/*
 * 把用户选的图片复制进应用数据目录，原文件被移动或删除后图标仍然可用。
 * 文件名带时间戳，渲染层据此知道图标换过；复制成功后清掉旧图标，目录里只保留一份。
 */
export function copyDockIcon(sourcePath: string, userDataDir: string, maxBytes: number): DockIconCopyResult {
  const ext = extname(sourcePath).toLowerCase();
  if (!DOCK_ICON_MIME_TYPES[ext]) return { ok: false, error: "unsupported_format" };
  if (!existsSync(sourcePath)) return { ok: false, error: "file_missing" };
  if (statSync(sourcePath).size > maxBytes) return { ok: false, error: "file_too_large" };

  const dir = dockIconDir(userDataDir);
  mkdirSync(dir, { recursive: true });
  const fileName = `${DOCK_ICON_FILE_PREFIX}${Date.now()}${ext}`;
  copyFileSync(sourcePath, join(dir, fileName));
  removeDockIcons(userDataDir, fileName);
  return { ok: true, fileName };
}

/* keepFileName 用于导入新图标后只删旧文件；不传则全部删除（恢复默认小爪）。 */
export function removeDockIcons(userDataDir: string, keepFileName?: string): void {
  const dir = dockIconDir(userDataDir);
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (!entry.startsWith(DOCK_ICON_FILE_PREFIX) || entry === keepFileName) continue;
    rmSync(join(dir, entry), { force: true });
  }
}

/* 读不到文件（被手动删掉、格式不对）时返回 null，渲染层回退到内置小爪。 */
export function readDockIconDataUrl(fileName: string, userDataDir: string): string | null {
  if (!fileName || fileName.includes("/") || fileName.includes("\\")) return null;
  const mime = DOCK_ICON_MIME_TYPES[extname(fileName).toLowerCase()];
  const path = join(dockIconDir(userDataDir), fileName);
  if (!mime || !existsSync(path)) return null;
  return `data:${mime};base64,${readFileSync(path).toString("base64")}`;
}
