import path from "path";
import fs from "fs/promises";
import { execSync } from "child_process";
import { GitOperations } from "./git";
import { SessionManager } from "./session";
import { detectServerCommand } from "./server-detect";
import { startDevServer, pollForReady } from "./dev-server";
import { takeScreenshot, closeBrowser } from "./screenshot";
import { isDuplicate } from "./frame-dedup";
import { WORKTREE_PREFIX, PORT_RANGE_START } from "./constants";
import type {
  CaptureConfig,
  CommitInfo,
  CaptureProgress,
  FrameMetadata,
} from "./types";

export type ProgressCallback = (progress: CaptureProgress) => void;

export interface CaptureEngineOptions {
  config: CaptureConfig;
  commits: CommitInfo[];
  sessionId: string;
  sessionManager: SessionManager;
  onProgress: ProgressCallback;
  abortSignal?: AbortSignal;
}

export async function runCapture(options: CaptureEngineOptions): Promise<void> {
  const {
    config,
    commits,
    sessionId,
    sessionManager,
    onProgress,
    abortSignal,
  } = options;

  const git = new GitOperations(config.repoPath);
  const framesDir = sessionManager.getFramesDir(sessionId);
  let prevPackageHash: string | null = null;
  let prevNodeModulesPath: string | null = null;
  let lastUniqueFramePath: string | null = null;

  try {
    for (let i = 0; i < commits.length; i++) {
      if (abortSignal?.aborted) {
        await sessionManager.update(sessionId, { status: "cancelled" });
        return;
      }

      const commit = commits[i];
      const port = PORT_RANGE_START + (i % config.concurrency);
      const worktreePath = `${WORKTREE_PREFIX}${commit.shortHash}-${Date.now()}`;
      const frameFilename = `${String(i + 1).padStart(4, "0")}-${commit.shortHash}.png`;

      onProgress({
        sessionId,
        currentIndex: i,
        totalFrames: commits.length,
        currentCommit: commit,
        status: "installing",
      });

      try {
        // 1. Create worktree
        await git.createWorktree(commit.hash, worktreePath);

        // 2. Smart npm install
        const pkgJsonPath = path.join(worktreePath, "package.json");
        let currentPackageHash: string | null = null;
        try {
          const pkgContent = await fs.readFile(pkgJsonPath, "utf-8");
          const lockPath = path.join(worktreePath, "package-lock.json");
          let lockContent = "";
          try {
            lockContent = await fs.readFile(lockPath, "utf-8");
          } catch {
            // no lock file
          }
          currentPackageHash = simpleHash(pkgContent + lockContent);
        } catch {
          // no package.json at this commit
        }

        if (currentPackageHash) {
          if (
            prevPackageHash === currentPackageHash &&
            prevNodeModulesPath
          ) {
            // Reuse node_modules via copy
            try {
              await fs.cp(
                prevNodeModulesPath,
                path.join(worktreePath, "node_modules"),
                { recursive: true }
              );
            } catch {
              // Fallback to fresh install
              execSync("npm install --prefer-offline", {
                cwd: worktreePath,
                stdio: "pipe",
                timeout: 120_000,
              });
            }
          } else {
            execSync("npm install --prefer-offline", {
              cwd: worktreePath,
              stdio: "pipe",
              timeout: 120_000,
            });
          }
          prevPackageHash = currentPackageHash;
          prevNodeModulesPath = path.join(worktreePath, "node_modules");
        }

        // 3. Detect and start dev server
        onProgress({
          sessionId,
          currentIndex: i,
          totalFrames: commits.length,
          currentCommit: commit,
          status: "starting-server",
        });

        const serverConfig =
          config.serverCommand
            ? { command: config.serverCommand.replace("{port}", String(port)), framework: "unknown" as const, port }
            : await detectServerCommand(worktreePath, port);

        if (!serverConfig) {
          throw new Error("Could not detect dev server command");
        }

        const server = startDevServer(
          serverConfig.command,
          worktreePath,
          port
        );

        try {
          // 4. Wait for server ready
          const ready = await pollForReady(port, config.timeout);
          if (!ready) {
            throw new Error(`Server did not start within ${config.timeout}ms`);
          }

          // 5. Take screenshot
          onProgress({
            sessionId,
            currentIndex: i,
            totalFrames: commits.length,
            currentCommit: commit,
            status: "screenshotting",
          });

          const outputPath = path.join(framesDir, frameFilename);
          await takeScreenshot({
            url: `http://localhost:${port}${config.route}`,
            outputPath,
            viewport: config.viewport,
          });

          // 6. Dedup check — compare to previous unique frame
          if (lastUniqueFramePath) {
            const dupe = await isDuplicate(lastUniqueFramePath, outputPath);
            if (dupe) {
              // Delete the duplicate file and record as skipped
              await fs.unlink(outputPath);
              const frame: FrameMetadata = {
                index: i,
                commit,
                filename: frameFilename,
                status: "skipped",
              };
              await sessionManager.addFrame(sessionId, frame);

              onProgress({
                sessionId,
                currentIndex: i,
                totalFrames: commits.length,
                currentCommit: commit,
                status: "skipped",
              });
              continue;
            }
          }
          lastUniqueFramePath = outputPath;

          // 7. Record success
          const frame: FrameMetadata = {
            index: i,
            commit,
            filename: frameFilename,
            status: "captured",
            capturedAt: new Date().toISOString(),
          };
          await sessionManager.addFrame(sessionId, frame);

          onProgress({
            sessionId,
            currentIndex: i,
            totalFrames: commits.length,
            currentCommit: commit,
            status: "done",
            screenshotPath: `/api/sessions/${sessionId}/frames/${frameFilename}`,
          });
        } finally {
          server.kill();
        }
      } catch (error) {
        // Record failure, continue to next commit
        const frame: FrameMetadata = {
          index: i,
          commit,
          filename: frameFilename,
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        };
        await sessionManager.addFrame(sessionId, frame);

        onProgress({
          sessionId,
          currentIndex: i,
          totalFrames: commits.length,
          currentCommit: commit,
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        // 7. Cleanup worktree
        try {
          await git.removeWorktree(worktreePath);
        } catch {
          try {
            await fs.rm(worktreePath, { recursive: true, force: true });
          } catch {
            // ignore
          }
        }
      }
    }

    await sessionManager.update(sessionId, { status: "completed" });
  } finally {
    await closeBrowser();
  }
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}
