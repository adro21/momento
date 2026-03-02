import { SessionManager } from "@/lib/session";
import { GitOperations } from "@/lib/git";
import { runCapture } from "@/lib/capture-engine";
import { registerCapture, removeCapture } from "@/lib/active-captures";
import { ensureDirs } from "@/lib/ensure-dirs";
import { SESSIONS_DIR, DEFAULT_VIEWPORT, DEFAULT_TIMEOUT, DEFAULT_CONCURRENCY, DEFAULT_TARGET_FRAMES } from "@/lib/constants";
import type { CaptureConfig, SamplingStrategy } from "@/lib/types";

const sessions = new SessionManager(SESSIONS_DIR);

export async function POST(request: Request) {
  await ensureDirs();

  const body = await request.json();
  const {
    repoPath,
    branch,
    route,
    sampling,
    viewport,
    serverCommand,
    timeout,
    concurrency,
    startCommitIndex,
    endCommitIndex,
    safeMode,
  } = body as {
    repoPath: string;
    branch: string;
    route: string;
    sampling: SamplingStrategy;
    viewport?: { width: number; height: number };
    serverCommand?: string;
    timeout?: number;
    concurrency?: number;
    startCommitIndex?: number;
    endCommitIndex?: number;
    safeMode?: boolean;
  };

  // Validate repo
  const git = new GitOperations(repoPath);
  if (!(await git.isValidRepo())) {
    return new Response(JSON.stringify({ error: "Invalid git repository" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get commits and optionally slice to a sub-range
  const allCommits = await git.listCommits(branch);

  let commitsToSample = allCommits;
  if (startCommitIndex != null || endCommitIndex != null) {
    // Indices are chronological (0 = oldest). listCommits returns newest-first.
    const chronological = [...allCommits].reverse();
    const start = startCommitIndex ?? 0;
    const end = endCommitIndex ?? chronological.length - 1;
    commitsToSample = [...chronological.slice(start, end + 1)].reverse();
  }

  let sampledCommits;

  switch (sampling.type) {
    case "every-nth":
      sampledCommits = git.sampleEveryNth(commitsToSample, sampling.n);
      break;
    case "time-based":
      sampledCommits = git.sampleByTime(commitsToSample, sampling.interval);
      break;
    case "manual":
      sampledCommits = commitsToSample.filter((c) =>
        sampling.hashes.includes(c.hash)
      );
      break;
    default: {
      const n = Math.max(1, Math.floor(commitsToSample.length / DEFAULT_TARGET_FRAMES));
      sampledCommits = git.sampleEveryNth(commitsToSample, n);
    }
  }

  const config: CaptureConfig = {
    repoPath,
    branch,
    route,
    sampling,
    viewport: viewport ?? DEFAULT_VIEWPORT,
    serverCommand,
    timeout: timeout ?? DEFAULT_TIMEOUT,
    concurrency: concurrency ?? DEFAULT_CONCURRENCY,
    startCommitIndex,
    endCommitIndex,
    safeMode: safeMode !== false,
  };

  const repoName = await git.getRepoName();
  const session = await sessions.create(
    config,
    repoName,
    allCommits.length,
    sampledCommits.length
  );

  // Set up SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const abortController = registerCapture(session.id);

      // Send session ID immediately
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "session", session })}\n\n`)
      );

      runCapture({
        config,
        commits: sampledCommits,
        sessionId: session.id,
        sessionManager: sessions,
        onProgress: (progress) => {
          try {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "progress", progress })}\n\n`
              )
            );
          } catch {
            // Stream closed
          }
        },
        abortSignal: abortController.signal,
      })
        .then(() => {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "complete", sessionId: session.id })}\n\n`
            )
          );
          controller.close();
        })
        .catch((error) => {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`
            )
          );
          controller.close();
        })
        .finally(() => {
          removeCapture(session.id);
        });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
