import path from "path";
import os from "os";

export const MOMENTO_DIR = path.join(os.homedir(), ".momento");
export const SESSIONS_DIR = path.join(MOMENTO_DIR, "sessions");
export const WORKTREE_PREFIX = path.join(os.tmpdir(), "momento-wt-");
export const CLONE_PREFIX = path.join(os.tmpdir(), "momento-clone-");

export const DEFAULT_VIEWPORT = { width: 1280, height: 800 };
export const DEFAULT_TIMEOUT = 60_000; // 60s per commit
export const DEFAULT_CONCURRENCY = 3;
export const DEFAULT_TARGET_FRAMES = 80;

export const SERVER_POLL_INTERVAL = 1_000; // 1s
export const SERVER_POLL_MAX_RETRIES = 60; // 60 retries = 60s with 1s interval

export const PORT_RANGE_START = 4100;
export const PORT_RANGE_END = 4200;
