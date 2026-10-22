import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { copyDockIcon, dockIconDir, readDockIconDataUrl, removeDockIcons } from "../dockIcon";

const tempRoots: string[] = [];

async function tempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "pawpause-dock-icon-test-"));
  tempRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("dock icon import", () => {
  it("copies a png into user data and reads it back as a data url", async () => {
    const userData = await tempRoot();
    const source = path.join(userData, "paw.png");
    await writeFile(source, Buffer.from([1, 2, 3]));

    const result = copyDockIcon(source, userData, 1024);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(readDockIconDataUrl(result.fileName, userData)).toBe("data:image/png;base64,AQID");
  });

  it("keeps only the latest imported icon", async () => {
    const userData = await tempRoot();
    const first = path.join(userData, "first.png");
    const second = path.join(userData, "second.webp");
    await writeFile(first, "a");
    await writeFile(second, "b");

    const firstResult = copyDockIcon(first, userData, 1024);
    await new Promise((resolve) => setTimeout(resolve, 5));
    const secondResult = copyDockIcon(second, userData, 1024);
    expect(firstResult.ok && secondResult.ok).toBe(true);
    if (!secondResult.ok) return;
    expect(await readdir(dockIconDir(userData))).toEqual([secondResult.fileName]);
  });

  it("rejects unsupported formats and oversized files", async () => {
    const userData = await tempRoot();
    const text = path.join(userData, "paw.txt");
    const big = path.join(userData, "big.png");
    await writeFile(text, "x");
    await writeFile(big, Buffer.alloc(2048));

    expect(copyDockIcon(text, userData, 1024)).toEqual({ ok: false, error: "unsupported_format" });
    expect(copyDockIcon(big, userData, 1024)).toEqual({ ok: false, error: "file_too_large" });
  });

  it("falls back to null after reset or for path-like names", async () => {
    const userData = await tempRoot();
    const source = path.join(userData, "paw.png");
    await writeFile(source, "a");
    const result = copyDockIcon(source, userData, 1024);
    if (!result.ok) throw new Error("import failed");

    removeDockIcons(userData);
    expect(readDockIconDataUrl(result.fileName, userData)).toBeNull();
    expect(readDockIconDataUrl("../paw.png", userData)).toBeNull();
  });
});
