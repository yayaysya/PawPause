import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { deletePawPausePet } from "../petDeletion";

const tempRoots: string[] = [];

async function tempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "pawpause-delete-test-"));
  tempRoots.push(root);
  return root;
}

async function installPet(root: string, slug: string, source: "imported" | "petdex"): Promise<string> {
  const target = path.join(root, slug);
  await mkdir(target, { recursive: true });
  await writeFile(
    path.join(target, "pet.json"),
    JSON.stringify({ id: slug, displayName: slug, source })
  );
  await writeFile(path.join(target, "spritesheet.webp"), "sprite");
  return target;
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("deletePawPausePet", () => {
  it("deletes an imported pet inside the PawPause data root", async () => {
    const root = await tempRoot();
    const target = await installPet(root, "duo-copy", "imported");

    await expect(deletePawPausePet(root, "duo-copy")).resolves.toEqual({ ok: true });
    await expect(readFile(path.join(target, "pet.json"))).rejects.toThrow();
  });

  it("never deletes a PetDex-managed pet", async () => {
    const root = await tempRoot();
    const target = await installPet(root, "community-pet", "petdex");

    await expect(deletePawPausePet(root, "community-pet")).resolves.toMatchObject({ ok: false });
    await expect(readFile(path.join(target, "pet.json"), "utf8")).resolves.toContain("petdex");
  });

  it("does not affect a same-slug pet in another root", async () => {
    const pawPauseRoot = await tempRoot();
    const petDexRoot = await tempRoot();
    await installPet(pawPauseRoot, "same-pet", "imported");
    const petDexTarget = await installPet(petDexRoot, "same-pet", "petdex");

    await expect(deletePawPausePet(pawPauseRoot, "same-pet")).resolves.toEqual({ ok: true });
    await expect(readFile(path.join(petDexTarget, "pet.json"), "utf8")).resolves.toContain("petdex");
  });

  it("rejects path-like identifiers", async () => {
    const root = await tempRoot();
    await expect(deletePawPausePet(root, "../outside")).resolves.toMatchObject({ ok: false });
  });
});
