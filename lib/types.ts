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
