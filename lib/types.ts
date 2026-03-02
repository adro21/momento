export interface CommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string; // ISO 8601
}

export interface FrameMetadata {
  index: number;
  commit: CommitInfo;
  filename: string;
  status: "captured" | "failed" | "skipped";
  error?: string;
  capturedAt?: string; // ISO 8601
}

export type SamplingStrategy =
  | { type: "every-nth"; n: number }
  | { type: "time-based"; interval: "daily" | "weekly" }
  | { type: "change-detection"; paths: string[] }
  | { type: "manual"; hashes: string[] };

export interface CaptureConfig {
  repoPath: string;
  branch: string;
  route: string;
  sampling: SamplingStrategy;
  viewport: { width: number; height: number };
  serverCommand?: string; // custom override
  timeout: number; // ms per commit
  concurrency: number;
  startCommitIndex?: number; // 0-based chronological (0 = oldest). Absent = full range.
  endCommitIndex?: number; // 0-based chronological (0 = oldest). Absent = full range.
  safeMode?: boolean; // default true — clone repo to /tmp so original is never touched
}

export interface SessionManifest {
  id: string;
  createdAt: string;
  config: CaptureConfig;
  repoName: string;
  totalCommits: number;
  sampledCommits: number;
  frames: FrameMetadata[];
  status: "capturing" | "completed" | "cancelled" | "error";
  error?: string;
}

export interface CaptureProgress {
  sessionId: string;
  currentIndex: number;
  totalFrames: number;
  currentCommit: CommitInfo;
  status: "installing" | "starting-server" | "screenshotting" | "done" | "failed" | "skipped";
  screenshotPath?: string;
  error?: string;
}
