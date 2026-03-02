import simpleGit, { SimpleGit } from "simple-git";
import path from "path";
import type { CommitInfo } from "./types";

export class GitOperations {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
  }

  async isValidRepo(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }

  async getRepoName(): Promise<string> {
    return path.basename(this.repoPath);
  }

  async listBranches(): Promise<{ current: string; all: string[] }> {
    const result = await this.git.branchLocal();
    return { current: result.current, all: result.all };
  }

  async listCommits(branch?: string): Promise<CommitInfo[]> {
    const log = await this.git.log({
      ...(branch ? [branch] : []),
      maxCount: 10000,
    });
    return log.all.map((entry) => ({
      hash: entry.hash,
      shortHash: entry.hash.slice(0, 7),
      message: entry.message,
      author: entry.author_name,
      date: entry.date,
    }));
  }

  async hasFileChanged(
    fromHash: string,
    toHash: string,
    filePath: string
  ): Promise<boolean> {
    try {
      const diff = await this.git.diff([fromHash, toHash, "--", filePath]);
      return diff.trim().length > 0;
    } catch {
      return true;
    }
  }

  async getChangedFiles(fromHash: string, toHash: string): Promise<string[]> {
    const diff = await this.git.diff(["--name-only", fromHash, toHash]);
    return diff.trim().split("\n").filter(Boolean);
  }

  sampleEveryNth(commits: CommitInfo[], n: number): CommitInfo[] {
    const chronological = [...commits].reverse();
    const sampled = chronological.filter((_, i) => i % n === 0);
    const latest = chronological[chronological.length - 1];
    if (sampled[sampled.length - 1]?.hash !== latest.hash) {
      sampled.push(latest);
    }
    return sampled;
  }

  sampleByTime(
    commits: CommitInfo[],
    interval: "daily" | "weekly"
  ): CommitInfo[] {
    const chronological = [...commits].reverse();
    if (chronological.length === 0) return [];
    const result: CommitInfo[] = [chronological[0]];
    let lastDate = new Date(chronological[0].date);
    const msInterval = interval === "daily" ? 86400000 : 604800000;
    for (const commit of chronological.slice(1)) {
      const commitDate = new Date(commit.date);
      if (commitDate.getTime() - lastDate.getTime() >= msInterval) {
        result.push(commit);
        lastDate = commitDate;
      }
    }
    const latest = chronological[chronological.length - 1];
    if (result[result.length - 1]?.hash !== latest.hash) {
      result.push(latest);
    }
    return result;
  }

  async createWorktree(commitHash: string, targetPath: string): Promise<void> {
    await this.git.raw(["worktree", "add", "--detach", targetPath, commitHash]);
  }

  async removeWorktree(targetPath: string): Promise<void> {
    try {
      await this.git.raw(["worktree", "remove", "--force", targetPath]);
    } catch {
      // Worktree may already be removed
    }
  }
}
