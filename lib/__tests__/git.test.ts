import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GitOperations } from "../git";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { execSync } from "child_process";

describe("GitOperations", () => {
  let tmpDir: string;
  let git: GitOperations;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "momento-test-"));
    execSync("git init", { cwd: tmpDir });
    execSync('git config user.email "test@test.com"', { cwd: tmpDir });
    execSync('git config user.name "Test"', { cwd: tmpDir });
    await fs.writeFile(path.join(tmpDir, "file.txt"), "v1");
    execSync("git add -A && git commit -m 'first commit'", { cwd: tmpDir });
    await fs.writeFile(path.join(tmpDir, "file.txt"), "v2");
    execSync("git add -A && git commit -m 'second commit'", { cwd: tmpDir });
    await fs.writeFile(path.join(tmpDir, "file.txt"), "v3");
    execSync("git add -A && git commit -m 'third commit'", { cwd: tmpDir });
    git = new GitOperations(tmpDir);
  });

  afterEach(async () => {
    // Clean up any worktrees first
    try {
      execSync("git worktree prune", { cwd: tmpDir });
    } catch {}
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("validates a real git repo", async () => {
    expect(await git.isValidRepo()).toBe(true);
  });

  it("rejects a non-repo directory", async () => {
    const fakeDir = await fs.mkdtemp(path.join(os.tmpdir(), "not-a-repo-"));
    const fakeGit = new GitOperations(fakeDir);
    expect(await fakeGit.isValidRepo()).toBe(false);
    await fs.rm(fakeDir, { recursive: true, force: true });
  });

  it("gets repo name from directory", async () => {
    const name = await git.getRepoName();
    expect(name).toBe(path.basename(tmpDir));
  });

  it("lists branches", async () => {
    const branches = await git.listBranches();
    expect(branches.current).toBeTruthy();
    expect(branches.all.length).toBeGreaterThan(0);
  });

  it("lists commits in reverse chronological order", async () => {
    const commits = await git.listCommits();
    expect(commits).toHaveLength(3);
    expect(commits[0].message).toBe("third commit");
    expect(commits[2].message).toBe("first commit");
  });

  it("checks if a file changed between two commits", async () => {
    const commits = await git.listCommits();
    const changed = await git.hasFileChanged(
      commits[1].hash,
      commits[0].hash,
      "file.txt"
    );
    expect(changed).toBe(true);
  });

  it("samples every Nth commit", async () => {
    const commits = await git.listCommits();
    const sampled = git.sampleEveryNth(commits, 2);
    expect(sampled.length).toBeGreaterThanOrEqual(2);
    // Should include first chronological and latest
  });
});
