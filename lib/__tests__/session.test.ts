import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SessionManager } from "../session";
import fs from "fs/promises";
import path from "path";
import os from "os";

describe("SessionManager", () => {
  let sessionsDir: string;
  let manager: SessionManager;

  beforeEach(async () => {
    sessionsDir = await fs.mkdtemp(path.join(os.tmpdir(), "momento-sessions-"));
    manager = new SessionManager(sessionsDir);
  });

  afterEach(async () => {
    await fs.rm(sessionsDir, { recursive: true, force: true });
  });

  it("creates a new session with manifest", async () => {
    const session = await manager.create({
      repoPath: "/fake/repo",
      branch: "main",
      route: "/dashboard",
      sampling: { type: "every-nth", n: 5 },
      viewport: { width: 1280, height: 800 },
      timeout: 60000,
      concurrency: 3,
    }, "my-app", 100, 20);

    expect(session.id).toBeTruthy();
    expect(session.status).toBe("capturing");
    expect(session.repoName).toBe("my-app");
    expect(session.totalCommits).toBe(100);
    expect(session.sampledCommits).toBe(20);

    const dir = path.join(sessionsDir, session.id);
    const manifest = JSON.parse(await fs.readFile(path.join(dir, "manifest.json"), "utf-8"));
    expect(manifest.id).toBe(session.id);
    const framesDir = await fs.stat(path.join(dir, "frames"));
    expect(framesDir.isDirectory()).toBe(true);
  });

  it("lists sessions sorted by creation date (newest first)", async () => {
    const s1 = await manager.create({
      repoPath: "/repo1", branch: "main", route: "/",
      sampling: { type: "every-nth", n: 1 },
      viewport: { width: 1280, height: 800 }, timeout: 60000, concurrency: 1,
    }, "repo1", 10, 10);

    // Small delay to ensure different timestamps
    await new Promise(r => setTimeout(r, 50));

    const s2 = await manager.create({
      repoPath: "/repo2", branch: "main", route: "/about",
      sampling: { type: "every-nth", n: 1 },
      viewport: { width: 1280, height: 800 }, timeout: 60000, concurrency: 1,
    }, "repo2", 20, 20);

    const sessions = await manager.list();
    expect(sessions).toHaveLength(2);
    expect(sessions[0].id).toBe(s2.id);
  });

  it("gets a session by ID", async () => {
    const created = await manager.create({
      repoPath: "/repo", branch: "main", route: "/",
      sampling: { type: "every-nth", n: 1 },
      viewport: { width: 1280, height: 800 }, timeout: 60000, concurrency: 1,
    }, "repo", 10, 10);

    const fetched = await manager.get(created.id);
    expect(fetched).toBeTruthy();
    expect(fetched!.id).toBe(created.id);
  });

  it("updates a session manifest", async () => {
    const session = await manager.create({
      repoPath: "/repo", branch: "main", route: "/",
      sampling: { type: "every-nth", n: 1 },
      viewport: { width: 1280, height: 800 }, timeout: 60000, concurrency: 1,
    }, "repo", 10, 10);

    await manager.update(session.id, { status: "completed" });
    const updated = await manager.get(session.id);
    expect(updated!.status).toBe("completed");
  });

  it("adds a frame to a session", async () => {
    const session = await manager.create({
      repoPath: "/repo", branch: "main", route: "/",
      sampling: { type: "every-nth", n: 1 },
      viewport: { width: 1280, height: 800 }, timeout: 60000, concurrency: 1,
    }, "repo", 10, 10);

    await manager.addFrame(session.id, {
      index: 0,
      commit: {
        hash: "abc1234567890", shortHash: "abc1234",
        message: "test commit", author: "Test",
        date: new Date().toISOString(),
      },
      filename: "001-abc1234.png",
      status: "captured",
      capturedAt: new Date().toISOString(),
    });

    const updated = await manager.get(session.id);
    expect(updated!.frames).toHaveLength(1);
    expect(updated!.frames[0].status).toBe("captured");
  });

  it("deletes a session", async () => {
    const session = await manager.create({
      repoPath: "/repo", branch: "main", route: "/",
      sampling: { type: "every-nth", n: 1 },
      viewport: { width: 1280, height: 800 }, timeout: 60000, concurrency: 1,
    }, "repo", 10, 10);

    await manager.delete(session.id);
    const sessions = await manager.list();
    expect(sessions).toHaveLength(0);
  });
});
