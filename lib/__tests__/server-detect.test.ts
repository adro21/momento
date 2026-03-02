import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { detectServerCommand } from "../server-detect";
import fs from "fs/promises";
import path from "path";
import os from "os";

describe("detectServerCommand", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "momento-detect-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("detects Next.js project", async () => {
    await fs.writeFile(path.join(tmpDir, "next.config.js"), "module.exports = {}");
    await fs.writeFile(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ scripts: { dev: "next dev" } })
    );
    const result = await detectServerCommand(tmpDir, 4100);
    expect(result).not.toBeNull();
    expect(result!.command).toBe("npx next dev -p 4100");
    expect(result!.framework).toBe("nextjs");
  });

  it("detects Vite project", async () => {
    await fs.writeFile(path.join(tmpDir, "vite.config.ts"), "export default {}");
    await fs.writeFile(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ scripts: { dev: "vite" } })
    );
    const result = await detectServerCommand(tmpDir, 4100);
    expect(result).not.toBeNull();
    expect(result!.command).toBe("npx vite --port 4100");
    expect(result!.framework).toBe("vite");
  });

  it("falls back to package.json dev script", async () => {
    await fs.writeFile(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ scripts: { dev: "some-custom-server" } })
    );
    const result = await detectServerCommand(tmpDir, 4100);
    expect(result).not.toBeNull();
    expect(result!.command).toContain("npm run dev");
    expect(result!.framework).toBe("unknown");
  });

  it("returns null when no package.json", async () => {
    const result = await detectServerCommand(tmpDir, 4100);
    expect(result).toBeNull();
  });
});
