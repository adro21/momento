# Momento Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an open-source tool that captures visual progression of a web page through git commit history and presents it as a cinematic interactive player or exportable timelapse video.

**Architecture:** Next.js 15 App Router with API routes handling git operations, Playwright screenshots, and FFmpeg video export. Core capture engine uses git worktrees for isolation, smart node_modules caching, and parallel capture support. Cinematic dark UI with timeline scrubber player.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Framer Motion, Playwright, simple-git, fluent-ffmpeg, Vitest

**Design Doc:** `docs/plans/2026-03-01-momento-design.md`

---

## Phase 1: Project Foundation

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

**Step 1: Initialize Next.js with TypeScript and Tailwind**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src=no --import-alias="@/*" --use-npm
```

Accept defaults. This scaffolds the project.

**Step 2: Install core dependencies**

```bash
npm install simple-git framer-motion uuid
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @types/uuid
```

Note: Playwright and fluent-ffmpeg are installed later in their respective phases.

**Step 3: Add Vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 4: Verify setup**

```bash
npm run dev
```

Expected: Next.js dev server starts on localhost:3000.

```bash
npm test
```

Expected: Vitest runs (no tests yet, exits cleanly).

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with TypeScript, Tailwind, Vitest"
```

---

### Task 2: Set Up Cinematic Dark Theme

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`
- Modify: `app/layout.tsx`
- Create: `app/fonts.ts`

**Step 1: Configure Tailwind theme with cinematic dark palette**

Replace `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0a0a0b",
          raised: "#141416",
          overlay: "#1c1c1f",
          border: "#2a2a2e",
        },
        amber: {
          DEFAULT: "#f59e0b",
          glow: "rgba(245, 158, 11, 0.15)",
          soft: "#fbbf24",
        },
        text: {
          primary: "#e4e4e7",
          secondary: "#a1a1aa",
          muted: "#52525b",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(245, 158, 11, 0.1)" },
          "100%": { boxShadow: "0 0 40px rgba(245, 158, 11, 0.2)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

**Step 2: Set up fonts**

Create `app/fonts.ts`:

```typescript
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";

export const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

export const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});
```

NOTE TO EXECUTOR: The design skill flagged Space Grotesk as potentially generic. During implementation, consider swapping for a more distinctive geometric display font — options: `Outfit`, `Syne`, `Clash Display` (via CDN), or `General Sans`. Use your judgment on what looks most cinematic. The key is: sharp, geometric, modern, NOT the usual suspects.

**Step 3: Update globals.css with dark base styles and noise texture**

Replace `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --noise-opacity: 0.03;
}

body {
  @apply bg-surface text-text-primary antialiased;
  font-family: var(--font-display), sans-serif;
}

/* Subtle noise texture overlay */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
  opacity: var(--noise-opacity);
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #2a2a2e;
  border-radius: 3px;
}

/* Selection color */
::selection {
  background: rgba(245, 158, 11, 0.3);
  color: #e4e4e7;
}
```

**Step 4: Update layout.tsx with fonts and base structure**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { displayFont, monoFont } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Momento",
  description: "Cinematic git history timelapse for your web projects",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${displayFont.variable} ${monoFont.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
```

**Step 5: Replace app/page.tsx with a placeholder home page**

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="font-display text-5xl font-bold tracking-tight text-text-primary">
        MOMENTO
      </h1>
      <p className="mt-4 font-mono text-sm text-text-secondary">
        Cinematic git history timelapse
      </p>
      <button className="mt-8 rounded-lg bg-amber px-6 py-3 font-display text-sm font-semibold text-surface transition-all hover:bg-amber-soft hover:shadow-lg hover:shadow-amber-glow">
        New Capture
      </button>
    </main>
  );
}
```

**Step 6: Verify visually**

```bash
npm run dev
```

Open localhost:3000. Should see: dark background with noise texture, "MOMENTO" heading, amber "New Capture" button with glow hover effect.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: cinematic dark theme with amber accent, noise texture, fonts"
```

---

## Phase 2: Core Libraries

### Task 3: TypeScript Types & Constants

**Files:**
- Create: `lib/types.ts`
- Create: `lib/constants.ts`

**Step 1: Define all shared types**

Create `lib/types.ts`:

```typescript
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
```

**Step 2: Define constants**

Create `lib/constants.ts`:

```typescript
import path from "path";
import os from "os";

export const MOMENTO_DIR = path.join(os.homedir(), ".momento");
export const SESSIONS_DIR = path.join(MOMENTO_DIR, "sessions");
export const WORKTREE_PREFIX = path.join(os.tmpdir(), "momento-wt-");

export const DEFAULT_VIEWPORT = { width: 1280, height: 800 };
export const DEFAULT_TIMEOUT = 60_000; // 60s per commit
export const DEFAULT_CONCURRENCY = 3;
export const DEFAULT_TARGET_FRAMES = 80;

export const SERVER_POLL_INTERVAL = 1_000; // 1s
export const SERVER_POLL_MAX_RETRIES = 60; // 60 retries = 60s with 1s interval

export const PORT_RANGE_START = 4100;
export const PORT_RANGE_END = 4200;
```

**Step 3: Commit**

```bash
git add lib/types.ts lib/constants.ts
git commit -m "feat: define TypeScript types and constants for capture engine"
```

---

### Task 4: Git Operations Library

**Files:**
- Create: `lib/git.ts`
- Create: `lib/__tests__/git.test.ts`

**Step 1: Write failing tests**

Create `lib/__tests__/git.test.ts`:

```typescript
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
    // Init a test repo with commits
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
    expect(sampled).toHaveLength(2); // 1st and 3rd (indices 0, 2 reversed = every 2nd)
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- lib/__tests__/git.test.ts
```

Expected: FAIL — `GitOperations` not found.

**Step 3: Implement git operations**

Create `lib/git.ts`:

```typescript
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
      return true; // assume changed if we can't tell
    }
  }

  async getChangedFiles(fromHash: string, toHash: string): Promise<string[]> {
    const diff = await this.git.diff([
      "--name-only",
      fromHash,
      toHash,
    ]);
    return diff.trim().split("\n").filter(Boolean);
  }

  sampleEveryNth(commits: CommitInfo[], n: number): CommitInfo[] {
    // Commits come in reverse chronological order.
    // We reverse to chronological, sample every Nth, then reverse back.
    const chronological = [...commits].reverse();
    const sampled = chronological.filter((_, i) => i % n === 0);
    // Always include the latest commit
    const latest = chronological[chronological.length - 1];
    if (sampled[sampled.length - 1]?.hash !== latest.hash) {
      sampled.push(latest);
    }
    return sampled; // return in chronological order for capture
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

    // Always include latest
    const latest = chronological[chronological.length - 1];
    if (result[result.length - 1]?.hash !== latest.hash) {
      result.push(latest);
    }
    return result;
  }

  async createWorktree(commitHash: string, targetPath: string): Promise<void> {
    await this.git.raw([
      "worktree",
      "add",
      "--detach",
      targetPath,
      commitHash,
    ]);
  }

  async removeWorktree(targetPath: string): Promise<void> {
    try {
      await this.git.raw(["worktree", "remove", "--force", targetPath]);
    } catch {
      // Worktree may already be removed
    }
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- lib/__tests__/git.test.ts
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add lib/git.ts lib/__tests__/git.test.ts
git commit -m "feat: git operations library with worktree support and sampling"
```

---

### Task 5: Session Management Library

**Files:**
- Create: `lib/session.ts`
- Create: `lib/__tests__/session.test.ts`

**Step 1: Write failing tests**

Create `lib/__tests__/session.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SessionManager } from "../session";
import fs from "fs/promises";
import path from "path";
import os from "os";

describe("SessionManager", () => {
  let sessionsDir: string;
  let manager: SessionManager;

  beforeEach(async () => {
    sessionsDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "momento-sessions-")
    );
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

    // Verify directory structure
    const dir = path.join(sessionsDir, session.id);
    const manifest = JSON.parse(
      await fs.readFile(path.join(dir, "manifest.json"), "utf-8")
    );
    expect(manifest.id).toBe(session.id);

    const framesDir = await fs.stat(path.join(dir, "frames"));
    expect(framesDir.isDirectory()).toBe(true);
  });

  it("lists sessions sorted by creation date (newest first)", async () => {
    const s1 = await manager.create({
      repoPath: "/repo1",
      branch: "main",
      route: "/",
      sampling: { type: "every-nth", n: 1 },
      viewport: { width: 1280, height: 800 },
      timeout: 60000,
      concurrency: 1,
    }, "repo1", 10, 10);

    const s2 = await manager.create({
      repoPath: "/repo2",
      branch: "main",
      route: "/about",
      sampling: { type: "every-nth", n: 1 },
      viewport: { width: 1280, height: 800 },
      timeout: 60000,
      concurrency: 1,
    }, "repo2", 20, 20);

    const sessions = await manager.list();
    expect(sessions).toHaveLength(2);
    expect(sessions[0].id).toBe(s2.id); // newest first
  });

  it("gets a session by ID", async () => {
    const created = await manager.create({
      repoPath: "/repo",
      branch: "main",
      route: "/",
      sampling: { type: "every-nth", n: 1 },
      viewport: { width: 1280, height: 800 },
      timeout: 60000,
      concurrency: 1,
    }, "repo", 10, 10);

    const fetched = await manager.get(created.id);
    expect(fetched).toBeTruthy();
    expect(fetched!.id).toBe(created.id);
  });

  it("updates a session manifest", async () => {
    const session = await manager.create({
      repoPath: "/repo",
      branch: "main",
      route: "/",
      sampling: { type: "every-nth", n: 1 },
      viewport: { width: 1280, height: 800 },
      timeout: 60000,
      concurrency: 1,
    }, "repo", 10, 10);

    await manager.update(session.id, { status: "completed" });
    const updated = await manager.get(session.id);
    expect(updated!.status).toBe("completed");
  });

  it("adds a frame to a session", async () => {
    const session = await manager.create({
      repoPath: "/repo",
      branch: "main",
      route: "/",
      sampling: { type: "every-nth", n: 1 },
      viewport: { width: 1280, height: 800 },
      timeout: 60000,
      concurrency: 1,
    }, "repo", 10, 10);

    await manager.addFrame(session.id, {
      index: 0,
      commit: {
        hash: "abc1234567890",
        shortHash: "abc1234",
        message: "test commit",
        author: "Test",
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
      repoPath: "/repo",
      branch: "main",
      route: "/",
      sampling: { type: "every-nth", n: 1 },
      viewport: { width: 1280, height: 800 },
      timeout: 60000,
      concurrency: 1,
    }, "repo", 10, 10);

    await manager.delete(session.id);
    const sessions = await manager.list();
    expect(sessions).toHaveLength(0);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- lib/__tests__/session.test.ts
```

Expected: FAIL — `SessionManager` not found.

**Step 3: Implement session manager**

Create `lib/session.ts`:

```typescript
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { CaptureConfig, SessionManifest, FrameMetadata } from "./types";

export class SessionManager {
  private sessionsDir: string;

  constructor(sessionsDir: string) {
    this.sessionsDir = sessionsDir;
  }

  async create(
    config: CaptureConfig,
    repoName: string,
    totalCommits: number,
    sampledCommits: number
  ): Promise<SessionManifest> {
    const id = uuidv4();
    const sessionDir = path.join(this.sessionsDir, id);

    await fs.mkdir(path.join(sessionDir, "frames"), { recursive: true });
    await fs.mkdir(path.join(sessionDir, "exports"), { recursive: true });

    const manifest: SessionManifest = {
      id,
      createdAt: new Date().toISOString(),
      config,
      repoName,
      totalCommits,
      sampledCommits,
      frames: [],
      status: "capturing",
    };

    await fs.writeFile(
      path.join(sessionDir, "manifest.json"),
      JSON.stringify(manifest, null, 2)
    );

    return manifest;
  }

  async list(): Promise<SessionManifest[]> {
    try {
      const entries = await fs.readdir(this.sessionsDir, {
        withFileTypes: true,
      });
      const sessions: SessionManifest[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const manifest = await this.get(entry.name);
          if (manifest) sessions.push(manifest);
        }
      }

      return sessions.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch {
      return [];
    }
  }

  async get(id: string): Promise<SessionManifest | null> {
    try {
      const data = await fs.readFile(
        path.join(this.sessionsDir, id, "manifest.json"),
        "utf-8"
      );
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async update(
    id: string,
    updates: Partial<SessionManifest>
  ): Promise<void> {
    const manifest = await this.get(id);
    if (!manifest) throw new Error(`Session ${id} not found`);

    const updated = { ...manifest, ...updates };
    await fs.writeFile(
      path.join(this.sessionsDir, id, "manifest.json"),
      JSON.stringify(updated, null, 2)
    );
  }

  async addFrame(id: string, frame: FrameMetadata): Promise<void> {
    const manifest = await this.get(id);
    if (!manifest) throw new Error(`Session ${id} not found`);

    manifest.frames.push(frame);
    await fs.writeFile(
      path.join(this.sessionsDir, id, "manifest.json"),
      JSON.stringify(manifest, null, 2)
    );
  }

  async delete(id: string): Promise<void> {
    await fs.rm(path.join(this.sessionsDir, id), {
      recursive: true,
      force: true,
    });
  }

  getFramesDir(id: string): string {
    return path.join(this.sessionsDir, id, "frames");
  }

  getExportsDir(id: string): string {
    return path.join(this.sessionsDir, id, "exports");
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- lib/__tests__/session.test.ts
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add lib/session.ts lib/__tests__/session.test.ts
git commit -m "feat: session manager with CRUD operations and frame tracking"
```

---

### Task 6: Server Detection Library

**Files:**
- Create: `lib/server-detect.ts`
- Create: `lib/__tests__/server-detect.test.ts`

**Step 1: Write failing tests**

Create `lib/__tests__/server-detect.test.ts`:

```typescript
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
    expect(result.command).toBe("npx next dev -p 4100");
    expect(result.framework).toBe("nextjs");
  });

  it("detects Vite project", async () => {
    await fs.writeFile(path.join(tmpDir, "vite.config.ts"), "export default {}");
    await fs.writeFile(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ scripts: { dev: "vite" } })
    );
    const result = await detectServerCommand(tmpDir, 4100);
    expect(result.command).toBe("npx vite --port 4100");
    expect(result.framework).toBe("vite");
  });

  it("falls back to package.json dev script", async () => {
    await fs.writeFile(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ scripts: { dev: "some-custom-server" } })
    );
    const result = await detectServerCommand(tmpDir, 4100);
    expect(result.command).toContain("npm run dev");
    expect(result.framework).toBe("unknown");
  });

  it("returns null when no package.json", async () => {
    const result = await detectServerCommand(tmpDir, 4100);
    expect(result).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- lib/__tests__/server-detect.test.ts
```

Expected: FAIL.

**Step 3: Implement server detection**

Create `lib/server-detect.ts`:

```typescript
import fs from "fs/promises";
import path from "path";

export interface ServerConfig {
  command: string;
  framework: "nextjs" | "vite" | "unknown";
  port: number;
}

export async function detectServerCommand(
  projectPath: string,
  port: number
): Promise<ServerConfig | null> {
  // Check for package.json first
  const pkgPath = path.join(projectPath, "package.json");
  let hasPackageJson = false;
  try {
    await fs.access(pkgPath);
    hasPackageJson = true;
  } catch {
    return null;
  }

  // Check for Next.js
  const nextConfigs = [
    "next.config.js",
    "next.config.mjs",
    "next.config.ts",
  ];
  for (const config of nextConfigs) {
    try {
      await fs.access(path.join(projectPath, config));
      return {
        command: `npx next dev -p ${port}`,
        framework: "nextjs",
        port,
      };
    } catch {
      continue;
    }
  }

  // Check for Vite
  const viteConfigs = [
    "vite.config.ts",
    "vite.config.js",
    "vite.config.mjs",
  ];
  for (const config of viteConfigs) {
    try {
      await fs.access(path.join(projectPath, config));
      return {
        command: `npx vite --port ${port}`,
        framework: "vite",
        port,
      };
    } catch {
      continue;
    }
  }

  // Fallback: check for dev script in package.json
  if (hasPackageJson) {
    try {
      const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
      if (pkg.scripts?.dev) {
        return {
          command: `npm run dev -- --port ${port}`,
          framework: "unknown",
          port,
        };
      }
    } catch {
      // malformed package.json
    }
  }

  return null;
}
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- lib/__tests__/server-detect.test.ts
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add lib/server-detect.ts lib/__tests__/server-detect.test.ts
git commit -m "feat: auto-detect dev server framework (Next.js, Vite, fallback)"
```

---

## Phase 3: Screenshot & Capture Engine

### Task 7: Screenshot Library (Playwright)

**Files:**
- Create: `lib/screenshot.ts`

**Step 1: Install Playwright**

```bash
npm install playwright
npx playwright install chromium
```

**Step 2: Implement screenshot module**

Create `lib/screenshot.ts`:

```typescript
import { chromium, Browser, Page } from "playwright";

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

export async function takeScreenshot(options: {
  url: string;
  outputPath: string;
  viewport: { width: number; height: number };
  waitTimeout?: number;
}): Promise<void> {
  const b = await getBrowser();
  const page = await b.newPage({
    viewport: options.viewport,
  });

  try {
    await page.goto(options.url, {
      waitUntil: "networkidle",
      timeout: options.waitTimeout ?? 30_000,
    });

    // Extra stability wait — let animations/renders settle
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: options.outputPath,
      fullPage: false,
      type: "png",
    });
  } finally {
    await page.close();
  }
}
```

Note: Playwright screenshot tests require a real browser and are slow. We'll validate this module through integration testing in Task 9 rather than unit tests.

**Step 3: Commit**

```bash
git add lib/screenshot.ts
git commit -m "feat: Playwright screenshot module with browser lifecycle management"
```

---

### Task 8: Dev Server Manager

**Files:**
- Create: `lib/dev-server.ts`
- Create: `lib/__tests__/dev-server.test.ts`

**Step 1: Write failing test for server readiness polling**

Create `lib/__tests__/dev-server.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { pollForReady } from "../dev-server";
import http from "http";

describe("Dev Server Manager", () => {
  it("polls until server is ready", async () => {
    // Start a simple HTTP server
    const server = http.createServer((_, res) => {
      res.writeHead(200);
      res.end("ok");
    });
    await new Promise<void>((resolve) => server.listen(4199, resolve));

    try {
      const ready = await pollForReady(4199, 5000, 500);
      expect(ready).toBe(true);
    } finally {
      server.close();
    }
  });

  it("returns false when server never starts", async () => {
    // Use a port where nothing is listening
    const ready = await pollForReady(4198, 2000, 500);
    expect(ready).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- lib/__tests__/dev-server.test.ts
```

**Step 3: Implement dev server manager**

Create `lib/dev-server.ts`:

```typescript
import { spawn, ChildProcess } from "child_process";
import http from "http";

export interface ManagedServer {
  process: ChildProcess;
  port: number;
  kill: () => void;
}

export function startDevServer(
  command: string,
  cwd: string,
  port: number
): ManagedServer {
  const [cmd, ...args] = command.split(" ");
  const proc = spawn(cmd, args, {
    cwd,
    shell: true,
    stdio: "pipe",
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: "development",
      BROWSER: "none", // prevent auto-open
    },
  });

  return {
    process: proc,
    port,
    kill: () => {
      proc.kill("SIGTERM");
      // Force kill after 5s if still alive
      setTimeout(() => {
        try {
          proc.kill("SIGKILL");
        } catch {
          // already dead
        }
      }, 5000);
    },
  };
}

export async function pollForReady(
  port: number,
  timeout: number,
  interval: number = 1000
): Promise<boolean> {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(`http://localhost:${port}`, (res) => {
          res.resume();
          resolve();
        });
        req.on("error", reject);
        req.setTimeout(2000, () => {
          req.destroy();
          reject(new Error("timeout"));
        });
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, interval));
    }
  }
  return false;
}
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- lib/__tests__/dev-server.test.ts
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add lib/dev-server.ts lib/__tests__/dev-server.test.ts
git commit -m "feat: dev server manager with start, poll, and kill lifecycle"
```

---

### Task 9: Capture Engine (Orchestrator)

**Files:**
- Create: `lib/capture-engine.ts`

This is the core orchestrator that ties together git worktrees, npm install, dev server, and screenshots for each commit.

**Step 1: Implement the capture engine**

Create `lib/capture-engine.ts`:

```typescript
import path from "path";
import fs from "fs/promises";
import { execSync } from "child_process";
import { GitOperations } from "./git";
import { SessionManager } from "./session";
import { detectServerCommand } from "./server-detect";
import { startDevServer, pollForReady } from "./dev-server";
import { takeScreenshot, closeBrowser } from "./screenshot";
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

          // 6. Record success
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
          // Best effort cleanup
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
```

**Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No type errors.

**Step 3: Commit**

```bash
git add lib/capture-engine.ts
git commit -m "feat: capture engine orchestrating worktrees, install, server, and screenshots"
```

---

## Phase 4: API Routes

### Task 10: Sessions API

**Files:**
- Create: `app/api/sessions/route.ts`
- Create: `app/api/sessions/[id]/route.ts`
- Create: `app/api/sessions/[id]/frames/[filename]/route.ts`

**Step 1: Implement session list and get endpoints**

Create `app/api/sessions/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { SessionManager } from "@/lib/session";
import { SESSIONS_DIR } from "@/lib/constants";

const sessions = new SessionManager(SESSIONS_DIR);

export async function GET() {
  const list = await sessions.list();
  return NextResponse.json(list);
}
```

Create `app/api/sessions/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { SessionManager } from "@/lib/session";
import { SESSIONS_DIR } from "@/lib/constants";

const sessions = new SessionManager(SESSIONS_DIR);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await sessions.get(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await sessions.delete(id);
  return NextResponse.json({ ok: true });
}
```

**Step 2: Implement frame image serving**

Create `app/api/sessions/[id]/frames/[filename]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { SESSIONS_DIR } from "@/lib/constants";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  const { id, filename } = await params;
  const filePath = path.join(SESSIONS_DIR, id, "frames", filename);

  try {
    const buffer = await fs.readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Frame not found" }, { status: 404 });
  }
}
```

**Step 3: Commit**

```bash
git add app/api/sessions/
git commit -m "feat: sessions API with list, get, delete, and frame serving"
```

---

### Task 11: Capture API with SSE

**Files:**
- Create: `app/api/capture/start/route.ts`
- Create: `app/api/capture/stop/route.ts`
- Create: `lib/active-captures.ts`

**Step 1: Create active captures registry**

Create `lib/active-captures.ts`:

```typescript
const activeCaptures = new Map<string, AbortController>();

export function registerCapture(sessionId: string): AbortController {
  const controller = new AbortController();
  activeCaptures.set(sessionId, controller);
  return controller;
}

export function cancelCapture(sessionId: string): boolean {
  const controller = activeCaptures.get(sessionId);
  if (controller) {
    controller.abort();
    activeCaptures.delete(sessionId);
    return true;
  }
  return false;
}

export function removeCapture(sessionId: string): void {
  activeCaptures.delete(sessionId);
}
```

**Step 2: Implement capture start with SSE**

Create `app/api/capture/start/route.ts`:

```typescript
import { SessionManager } from "@/lib/session";
import { GitOperations } from "@/lib/git";
import { runCapture } from "@/lib/capture-engine";
import { registerCapture, removeCapture } from "@/lib/active-captures";
import { SESSIONS_DIR, DEFAULT_VIEWPORT, DEFAULT_TIMEOUT, DEFAULT_CONCURRENCY, DEFAULT_TARGET_FRAMES } from "@/lib/constants";
import type { CaptureConfig, SamplingStrategy } from "@/lib/types";

const sessions = new SessionManager(SESSIONS_DIR);

export async function POST(request: Request) {
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
  } = body as {
    repoPath: string;
    branch: string;
    route: string;
    sampling: SamplingStrategy;
    viewport?: { width: number; height: number };
    serverCommand?: string;
    timeout?: number;
    concurrency?: number;
  };

  // Validate repo
  const git = new GitOperations(repoPath);
  if (!(await git.isValidRepo())) {
    return new Response(JSON.stringify({ error: "Invalid git repository" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get commits and apply sampling
  const allCommits = await git.listCommits(branch);
  let sampledCommits;

  switch (sampling.type) {
    case "every-nth":
      sampledCommits = git.sampleEveryNth(allCommits, sampling.n);
      break;
    case "time-based":
      sampledCommits = git.sampleByTime(allCommits, sampling.interval);
      break;
    case "manual":
      sampledCommits = allCommits.filter((c) =>
        sampling.hashes.includes(c.hash)
      );
      break;
    default: {
      // Auto-calculate N to target ~DEFAULT_TARGET_FRAMES
      const n = Math.max(1, Math.floor(allCommits.length / DEFAULT_TARGET_FRAMES));
      sampledCommits = git.sampleEveryNth(allCommits, n);
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
```

**Step 3: Implement capture stop**

Create `app/api/capture/stop/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { cancelCapture } from "@/lib/active-captures";

export async function POST(request: Request) {
  const { sessionId } = await request.json();
  const cancelled = cancelCapture(sessionId);
  return NextResponse.json({ cancelled });
}
```

**Step 4: Verify compilation**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add app/api/capture/ lib/active-captures.ts
git commit -m "feat: capture API with SSE progress streaming and cancellation"
```

---

### Task 12: Validate Repo API (for wizard)

**Files:**
- Create: `app/api/repo/validate/route.ts`
- Create: `app/api/repo/commits/route.ts`

**Step 1: Implement repo validation endpoint**

Create `app/api/repo/validate/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { GitOperations } from "@/lib/git";

export async function POST(request: Request) {
  const { repoPath } = await request.json();

  const git = new GitOperations(repoPath);
  const valid = await git.isValidRepo();

  if (!valid) {
    return NextResponse.json(
      { valid: false, error: "Not a valid git repository" },
      { status: 400 }
    );
  }

  const repoName = await git.getRepoName();
  const branches = await git.listBranches();

  return NextResponse.json({
    valid: true,
    repoName,
    branches,
  });
}
```

**Step 2: Implement commits listing endpoint**

Create `app/api/repo/commits/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { GitOperations } from "@/lib/git";
import { DEFAULT_TARGET_FRAMES } from "@/lib/constants";

export async function POST(request: Request) {
  const { repoPath, branch } = await request.json();

  const git = new GitOperations(repoPath);
  const commits = await git.listCommits(branch);

  const suggestedN = Math.max(1, Math.floor(commits.length / DEFAULT_TARGET_FRAMES));

  return NextResponse.json({
    total: commits.length,
    suggestedN,
    commits: commits.slice(0, 200), // limit for preview
  });
}
```

**Step 3: Commit**

```bash
git add app/api/repo/
git commit -m "feat: repo validation and commits listing API for wizard"
```

---

## Phase 5: Wizard UI

### Task 13: Shared UI Components

**Files:**
- Create: `components/ui/button.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/card.tsx`
- Create: `components/ui/step-indicator.tsx`

**Step 1: Build base UI components**

Create `components/ui/button.tsx`:

```tsx
"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    const base = "font-display font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
      primary: "bg-amber text-surface hover:bg-amber-soft hover:shadow-lg hover:shadow-amber-glow active:scale-[0.98]",
      secondary: "bg-surface-raised text-text-primary border border-surface-border hover:bg-surface-overlay",
      ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-raised",
    };
    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-5 py-2.5 text-sm",
      lg: "px-7 py-3.5 text-base",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
```

Create `components/ui/input.tsx`:

```tsx
"use client";

import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-display text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-lg border bg-surface-raised px-4 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber/50 transition-colors ${
            error ? "border-red-500" : "border-surface-border"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400 font-mono">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
```

Create `components/ui/card.tsx`:

```tsx
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`rounded-xl border border-surface-border bg-surface-raised p-6 ${className}`}>
      {children}
    </div>
  );
}
```

Create `components/ui/step-indicator.tsx`:

```tsx
"use client";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-mono font-medium transition-all ${
                i < currentStep
                  ? "bg-amber text-surface"
                  : i === currentStep
                  ? "bg-amber/20 text-amber border border-amber/50"
                  : "bg-surface-overlay text-text-muted border border-surface-border"
              }`}
            >
              {i < currentStep ? "✓" : i + 1}
            </div>
            <span
              className={`text-xs font-display ${
                i <= currentStep ? "text-text-primary" : "text-text-muted"
              }`}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-px w-8 ${
                i < currentStep ? "bg-amber" : "bg-surface-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/ui/
git commit -m "feat: shared UI components (button, input, card, step-indicator)"
```

---

### Task 14: Wizard Page — Step 1 (Select Repo)

**Files:**
- Create: `app/capture/page.tsx`
- Create: `components/wizard/repo-step.tsx`

**Step 1: Implement repo selection step**

Create `components/wizard/repo-step.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface RepoStepProps {
  onValidated: (data: {
    repoPath: string;
    repoName: string;
    branch: string;
    branches: { current: string; all: string[] };
  }) => void;
}

export function RepoStep({ onValidated }: RepoStepProps) {
  const [repoPath, setRepoPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<{
    repoName: string;
    branches: { current: string; all: string[] };
  } | null>(null);
  const [selectedBranch, setSelectedBranch] = useState("");

  const validateRepo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/repo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoPath: repoPath.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid repository");
        return;
      }
      setRepoInfo(data);
      setSelectedBranch(data.branches.current);
    } catch {
      setError("Failed to validate repository");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!repoInfo) return;
    onValidated({
      repoPath: repoPath.trim(),
      repoName: repoInfo.repoName,
      branch: selectedBranch,
      branches: repoInfo.branches,
    });
  };

  return (
    <Card className="w-full max-w-lg animate-fade-in">
      <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
        Select Repository
      </h2>

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="/path/to/your/project"
              value={repoPath}
              onChange={(e) => {
                setRepoPath(e.target.value);
                setRepoInfo(null);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && validateRepo()}
              error={error ?? undefined}
            />
          </div>
          <Button
            onClick={validateRepo}
            disabled={!repoPath.trim() || loading}
            variant="secondary"
            className="mt-0"
          >
            {loading ? "Checking..." : "Validate"}
          </Button>
        </div>

        {repoInfo && (
          <div className="animate-slide-up space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-400">●</span>
              <span className="font-mono text-text-primary">{repoInfo.repoName}</span>
            </div>

            <div>
              <label className="block text-sm font-display text-text-secondary mb-1.5">
                Branch
              </label>
              <select
                className="w-full rounded-lg border border-surface-border bg-surface-raised px-4 py-2.5 font-mono text-sm text-text-primary focus:border-amber focus:outline-none"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                {repoInfo.branches.all.map((b) => (
                  <option key={b} value={b}>
                    {b} {b === repoInfo.branches.current ? "(current)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <Button onClick={handleContinue} className="w-full">
              Continue
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
```

**Step 2: Create wizard page with step routing**

Create `app/capture/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { StepIndicator } from "@/components/ui/step-indicator";
import { RepoStep } from "@/components/wizard/repo-step";

const STEPS = ["Repository", "Configure", "Capture"];

interface WizardState {
  repoPath: string;
  repoName: string;
  branch: string;
  branches: { current: string; all: string[] };
  route: string;
  samplingN: number;
}

export default function CapturePage() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<Partial<WizardState>>({});

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-16">
      <div className="mb-12">
        <StepIndicator steps={STEPS} currentStep={step} />
      </div>

      {step === 0 && (
        <RepoStep
          onValidated={(data) => {
            setState((prev) => ({ ...prev, ...data }));
            setStep(1);
          }}
        />
      )}

      {step === 1 && (
        <div className="text-text-secondary font-mono text-sm">
          Configure step — implemented in next task
        </div>
      )}

      {step === 2 && (
        <div className="text-text-secondary font-mono text-sm">
          Capture step — implemented in next task
        </div>
      )}
    </main>
  );
}
```

**Step 3: Verify visually**

```bash
npm run dev
```

Navigate to localhost:3000/capture. Should see step indicator and repo input.

**Step 4: Commit**

```bash
git add app/capture/ components/wizard/
git commit -m "feat: wizard page with repo selection step"
```

---

### Task 15: Wizard Page — Step 2 (Configure)

**Files:**
- Create: `components/wizard/configure-step.tsx`
- Modify: `app/capture/page.tsx`

**Step 1: Implement configure step**

Create `components/wizard/configure-step.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ConfigureStepProps {
  repoPath: string;
  branch: string;
  onConfigured: (data: {
    route: string;
    samplingN: number;
    totalCommits: number;
    sampledCount: number;
  }) => void;
  onBack: () => void;
}

export function ConfigureStep({ repoPath, branch, onConfigured, onBack }: ConfigureStepProps) {
  const [route, setRoute] = useState("/");
  const [samplingN, setSamplingN] = useState(1);
  const [totalCommits, setTotalCommits] = useState(0);
  const [suggestedN, setSuggestedN] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommits() {
      setLoading(true);
      try {
        const res = await fetch("/api/repo/commits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoPath, branch }),
        });
        const data = await res.json();
        setTotalCommits(data.total);
        setSuggestedN(data.suggestedN);
        setSamplingN(data.suggestedN);
      } finally {
        setLoading(false);
      }
    }
    fetchCommits();
  }, [repoPath, branch]);

  const sampledCount = Math.ceil(totalCommits / samplingN);

  return (
    <Card className="w-full max-w-lg animate-fade-in">
      <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
        Configure Capture
      </h2>

      {loading ? (
        <div className="text-text-muted font-mono text-sm py-8 text-center">
          Loading commit history...
        </div>
      ) : (
        <div className="space-y-5">
          <Input
            label="Page Route"
            placeholder="/dashboard"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-display text-text-secondary">
              Sampling — every Nth commit
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={Math.max(totalCommits, 1)}
                value={samplingN}
                onChange={(e) => setSamplingN(Number(e.target.value))}
                className="flex-1 accent-amber"
              />
              <span className="font-mono text-sm text-text-primary w-12 text-right">
                {samplingN}
              </span>
            </div>
            <div className="flex justify-between text-xs font-mono text-text-muted">
              <span>{totalCommits} total commits</span>
              <span>~{sampledCount} frames</span>
            </div>
            {suggestedN > 1 && samplingN === 1 && (
              <button
                onClick={() => setSamplingN(suggestedN)}
                className="text-xs text-amber hover:underline font-mono"
              >
                Use suggested: every {suggestedN}th (~{Math.ceil(totalCommits / suggestedN)} frames)
              </button>
            )}
          </div>

          <div className="rounded-lg bg-surface p-3 border border-surface-border">
            <div className="text-xs font-mono text-text-muted space-y-1">
              <div className="flex justify-between">
                <span>Route</span>
                <span className="text-text-secondary">{route || "/"}</span>
              </div>
              <div className="flex justify-between">
                <span>Frames</span>
                <span className="text-text-secondary">~{sampledCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Est. time</span>
                <span className="text-text-secondary">
                  ~{Math.ceil(sampledCount * 0.75)} min
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={onBack}>
              Back
            </Button>
            <Button onClick={() => onConfigured({ route, samplingN, totalCommits, sampledCount })} className="flex-1">
              Begin Capture
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
```

**Step 2: Update wizard page to include ConfigureStep**

In `app/capture/page.tsx`, add the import and replace the step 1 placeholder:

```tsx
import { ConfigureStep } from "@/components/wizard/configure-step";
```

Replace the `{step === 1 && ...}` block:

```tsx
{step === 1 && state.repoPath && (
  <ConfigureStep
    repoPath={state.repoPath}
    branch={state.branch ?? "main"}
    onConfigured={(data) => {
      setState((prev) => ({ ...prev, ...data }));
      setStep(2);
    }}
    onBack={() => setStep(0)}
  />
)}
```

**Step 3: Verify visually and commit**

```bash
npm run dev
```

Test the flow: enter repo path → validate → select branch → continue → see configure step with route input and sampling slider.

```bash
git add components/wizard/configure-step.tsx app/capture/page.tsx
git commit -m "feat: wizard configure step with route input, sampling slider, time estimate"
```

---

## Phase 6: Capture Progress UI

### Task 16: Capture Progress Screen

**Files:**
- Create: `components/wizard/capture-progress.tsx`
- Modify: `app/capture/page.tsx`

**Step 1: Implement capture progress component**

Create `components/wizard/capture-progress.tsx`:

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { CaptureProgress as CaptureProgressType } from "@/lib/types";

interface CaptureProgressProps {
  repoPath: string;
  branch: string;
  route: string;
  samplingN: number;
  onComplete: (sessionId: string) => void;
}

export function CaptureProgress({
  repoPath,
  branch,
  route,
  samplingN,
  onComplete,
}: CaptureProgressProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [progress, setProgress] = useState<CaptureProgressType | null>(null);
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);
  const [completedFrames, setCompletedFrames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const eventSourceRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    eventSourceRef.current = controller;

    async function startCapture() {
      try {
        const res = await fetch("/api/capture/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repoPath,
            branch,
            route,
            sampling: { type: "every-nth", n: samplingN },
          }),
          signal: controller.signal,
        });

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) return;

        let buffer = "";
        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const dataMatch = line.match(/^data: (.+)$/m);
            if (!dataMatch) continue;

            try {
              const event = JSON.parse(dataMatch[1]);

              if (event.type === "session") {
                setSessionId(event.session.id);
              } else if (event.type === "progress") {
                setProgress(event.progress);
                if (event.progress.screenshotPath) {
                  setCurrentScreenshot(event.progress.screenshotPath);
                  setCompletedFrames((prev) => [
                    ...prev,
                    event.progress.screenshotPath,
                  ]);
                }
              } else if (event.type === "complete") {
                setDone(true);
              } else if (event.type === "error") {
                setError(event.error);
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Capture failed");
      }
    }

    startCapture();
    return () => controller.abort();
  }, [repoPath, branch, route, samplingN]);

  const handleCancel = async () => {
    if (sessionId) {
      await fetch("/api/capture/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    }
    eventSourceRef.current?.abort();
  };

  const progressPercent = progress
    ? Math.round(((progress.currentIndex + 1) / progress.totalFrames) * 100)
    : 0;

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      {/* Screenshot display */}
      <div className="relative aspect-video bg-surface rounded-xl border border-surface-border overflow-hidden mb-6">
        <AnimatePresence mode="wait">
          {currentScreenshot ? (
            <motion.img
              key={currentScreenshot}
              src={currentScreenshot}
              alt="Current capture"
              className="w-full h-full object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <motion.div
              className="flex items-center justify-center h-full text-text-muted font-mono text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error ? "Capture error" : "Starting capture..."}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Glow effect */}
        {currentScreenshot && (
          <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(245,158,11,0.05)] pointer-events-none" />
        )}
      </div>

      {/* Commit info */}
      {progress && (
        <div className="text-center mb-4 font-mono text-xs text-text-secondary">
          {progress.currentCommit.shortHash} · &quot;{progress.currentCommit.message}&quot; · {new Date(progress.currentCommit.date).toLocaleDateString()}
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-1 bg-surface-overlay rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-amber rounded-full"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs font-mono text-text-muted">
          <span>
            {progress ? `${progress.currentIndex + 1} / ${progress.totalFrames}` : "..."}
          </span>
          <span className="capitalize">{progress?.status ?? "initializing"}</span>
        </div>
      </div>

      {/* Filmstrip */}
      {completedFrames.length > 0 && (
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6">
          {completedFrames.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Frame ${i + 1}`}
              className="h-12 w-auto rounded border border-surface-border opacity-60"
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-3">
        {!done && !error && (
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        )}
        {done && sessionId && (
          <Button onClick={() => onComplete(sessionId)}>
            View in Player
          </Button>
        )}
        {error && (
          <div className="text-center">
            <p className="text-red-400 font-mono text-sm mb-3">{error}</p>
            {sessionId && completedFrames.length > 0 && (
              <Button onClick={() => onComplete(sessionId)}>
                View {completedFrames.length} captured frames
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Wire into wizard page**

In `app/capture/page.tsx`, add the import:

```tsx
import { CaptureProgress } from "@/components/wizard/capture-progress";
import { useRouter } from "next/navigation";
```

Add `const router = useRouter();` inside the component, and replace the step 2 block:

```tsx
{step === 2 && state.repoPath && (
  <CaptureProgress
    repoPath={state.repoPath}
    branch={state.branch ?? "main"}
    route={state.route ?? "/"}
    samplingN={state.samplingN ?? 5}
    onComplete={(sessionId) => router.push(`/player/${sessionId}`)}
  />
)}
```

**Step 3: Commit**

```bash
git add components/wizard/capture-progress.tsx app/capture/page.tsx
git commit -m "feat: capture progress screen with live screenshots, filmstrip, and SSE"
```

---

## Phase 7: Player UI (The Hero)

### Task 17: Player Page & Frame Display

**Files:**
- Create: `app/player/[sessionId]/page.tsx`
- Create: `components/player/frame-display.tsx`

**Step 1: Implement frame display component**

Create `components/player/frame-display.tsx`:

```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { FrameMetadata } from "@/lib/types";

interface FrameDisplayProps {
  frame: FrameMetadata | null;
  sessionId: string;
}

export function FrameDisplay({ frame, sessionId }: FrameDisplayProps) {
  if (!frame || frame.status !== "captured") {
    return (
      <div className="flex items-center justify-center aspect-video bg-surface rounded-xl border border-surface-border">
        <span className="text-text-muted font-mono text-sm">
          {frame?.status === "failed" ? "Frame failed to capture" : "No frame"}
        </span>
      </div>
    );
  }

  const src = `/api/sessions/${sessionId}/frames/${frame.filename}`;

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.img
          key={frame.filename}
          src={src}
          alt={`${frame.commit.shortHash} — ${frame.commit.message}`}
          className="w-full h-full object-contain bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        />
      </AnimatePresence>

      {/* Cinematic glow */}
      <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(245,158,11,0.04)] pointer-events-none rounded-xl" />
    </div>
  );
}
```

**Step 2: Implement player page**

Create `app/player/[sessionId]/page.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback, use } from "react";
import { FrameDisplay } from "@/components/player/frame-display";
import { Timeline } from "@/components/player/timeline";
import { PlayerControls } from "@/components/player/player-controls";
import type { SessionManifest } from "@/lib/types";

export default function PlayerPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<SessionManifest | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // frames per second
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then(setSession);
  }, [sessionId]);

  const capturedFrames = session?.frames.filter((f) => f.status === "captured") ?? [];
  const currentFrame = capturedFrames[currentIndex] ?? null;

  // Playback loop
  useEffect(() => {
    if (!playing || capturedFrames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= capturedFrames.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / speed);

    return () => clearInterval(interval);
  }, [playing, speed, capturedFrames.length]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ":
          e.preventDefault();
          setPlaying((p) => !p);
          break;
        case "ArrowLeft":
          e.preventDefault();
          setPlaying(false);
          setCurrentIndex((p) => Math.max(0, p - 1));
          break;
        case "ArrowRight":
          e.preventDefault();
          setPlaying(false);
          setCurrentIndex((p) => Math.min(capturedFrames.length - 1, p + 1));
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case "p":
        case "P":
          setIsPresentationMode((p) => !p);
          break;
        case "Escape":
          setIsPresentationMode(false);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [capturedFrames.length]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="text-text-muted font-mono text-sm">Loading session...</span>
      </main>
    );
  }

  // Presentation mode: just the frame on black
  if (isPresentationMode) {
    return (
      <main className="fixed inset-0 bg-black flex items-center justify-center cursor-none">
        <div className="w-full max-w-6xl px-8">
          <FrameDisplay frame={currentFrame} sessionId={sessionId} />
          {currentFrame && (
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <span className="font-mono text-xs text-text-muted/50">
                {currentFrame.commit.shortHash} · {currentFrame.commit.message}
              </span>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <a href="/" className="font-display text-sm font-bold text-text-primary hover:text-amber transition-colors">
            MOMENTO
          </a>
          <span className="text-text-muted">/</span>
          <span className="font-mono text-sm text-text-secondary">{session.repoName}</span>
          <span className="font-mono text-xs text-text-muted">{session.config.route}</span>
        </div>
      </div>

      {/* Frame display area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-5xl">
          <FrameDisplay frame={currentFrame} sessionId={sessionId} />

          {/* Commit info */}
          {currentFrame && (
            <div className="mt-4 text-center font-mono text-xs text-text-secondary">
              {currentFrame.commit.shortHash} · &quot;{currentFrame.commit.message}&quot; · {new Date(currentFrame.commit.date).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Timeline and controls */}
      <div className="border-t border-surface-border px-6 py-4 space-y-3">
        <Timeline
          frames={capturedFrames}
          currentIndex={currentIndex}
          onSeek={setCurrentIndex}
        />
        <PlayerControls
          playing={playing}
          onTogglePlay={() => setPlaying((p) => !p)}
          speed={speed}
          onSpeedChange={setSpeed}
          currentIndex={currentIndex}
          totalFrames={capturedFrames.length}
          onToggleFullscreen={toggleFullscreen}
          onTogglePresentation={() => setIsPresentationMode(true)}
          sessionId={sessionId}
        />
      </div>
    </main>
  );
}
```

**Step 3: Commit (the sub-components will be built in the next tasks)**

Note: This page references `Timeline` and `PlayerControls` which are built in Tasks 18-19. The page will have TypeScript errors until those are created. That's expected — build them immediately next.

```bash
git add app/player/ components/player/frame-display.tsx
git commit -m "feat: player page with frame display, keyboard shortcuts, presentation mode"
```

---

### Task 18: Timeline Component

**Files:**
- Create: `components/player/timeline.tsx`

**Step 1: Implement timeline with commit dots and scrubber**

Create `components/player/timeline.tsx`:

```tsx
"use client";

import { useRef, useCallback } from "react";
import type { FrameMetadata } from "@/lib/types";

interface TimelineProps {
  frames: FrameMetadata[];
  currentIndex: number;
  onSeek: (index: number) => void;
}

export function Timeline({ frames, currentIndex, onSeek }: TimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current || frames.length === 0) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = x / rect.width;
      const index = Math.round(percent * (frames.length - 1));
      onSeek(Math.max(0, Math.min(frames.length - 1, index)));
    },
    [frames.length, onSeek]
  );

  const handleDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.buttons !== 1) return; // only left click
      handleClick(e);
    },
    [handleClick]
  );

  const progressPercent =
    frames.length > 1 ? (currentIndex / (frames.length - 1)) * 100 : 0;

  return (
    <div className="space-y-1">
      {/* Scrub track */}
      <div
        ref={trackRef}
        className="relative h-2 bg-surface-overlay rounded-full cursor-pointer group"
        onClick={handleClick}
        onMouseMove={handleDrag}
      >
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 bg-amber/60 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Scrub handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-amber rounded-full shadow-[0_0_10px_rgba(245,158,11,0.4)] transition-transform group-hover:scale-125"
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      {/* Commit dots */}
      <div className="relative h-2 flex items-center">
        {frames.map((frame, i) => {
          const left =
            frames.length > 1 ? (i / (frames.length - 1)) * 100 : 50;
          return (
            <div
              key={i}
              className={`absolute w-1 h-1 rounded-full -translate-x-1/2 cursor-pointer transition-all hover:scale-150 ${
                frame.status === "captured"
                  ? i <= currentIndex
                    ? "bg-amber"
                    : "bg-text-muted/40"
                  : "bg-red-500/40"
              }`}
              style={{ left: `${left}%` }}
              onClick={() => onSeek(i)}
              title={`${frame.commit.shortHash}: ${frame.commit.message}`}
            />
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/player/timeline.tsx
git commit -m "feat: timeline component with scrub track, progress bar, and commit dots"
```

---

### Task 19: Player Controls

**Files:**
- Create: `components/player/player-controls.tsx`

**Step 1: Implement player controls bar**

Create `components/player/player-controls.tsx`:

```tsx
"use client";

interface PlayerControlsProps {
  playing: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  currentIndex: number;
  totalFrames: number;
  onToggleFullscreen: () => void;
  onTogglePresentation: () => void;
  sessionId: string;
}

const SPEEDS = [0.5, 1, 2, 4];

export function PlayerControls({
  playing,
  onTogglePlay,
  speed,
  onSpeedChange,
  currentIndex,
  totalFrames,
  onToggleFullscreen,
  onTogglePresentation,
  sessionId,
}: PlayerControlsProps) {
  const nextSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    onSpeedChange(next);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <button
          onClick={onTogglePlay}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-overlay text-text-primary hover:bg-amber hover:text-surface transition-all"
          title={playing ? "Pause (Space)" : "Play (Space)"}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="1" width="3.5" height="12" rx="1" />
              <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M3 1.5v11l9-5.5L3 1.5z" />
            </svg>
          )}
        </button>

        {/* Speed */}
        <button
          onClick={nextSpeed}
          className="rounded-lg bg-surface-overlay px-2.5 py-1.5 font-mono text-xs text-text-secondary hover:text-text-primary transition-colors"
          title="Cycle speed"
        >
          {speed}x
        </button>

        {/* Frame counter */}
        <span className="font-mono text-xs text-text-muted">
          {currentIndex + 1} / {totalFrames}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Present */}
        <button
          onClick={onTogglePresentation}
          className="rounded-lg bg-surface-overlay px-3 py-1.5 font-mono text-xs text-text-secondary hover:text-amber transition-colors"
          title="Presentation mode (P)"
        >
          Present
        </button>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-overlay text-text-secondary hover:text-text-primary transition-colors"
          title="Fullscreen (F)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9" />
          </svg>
        </button>

        {/* Export (navigates to export) */}
        <a
          href={`/player/${sessionId}/export`}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-overlay text-text-secondary hover:text-text-primary transition-colors"
          title="Export video"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 1v8M3 6l4 4 4-4M1 11v2h12v-2" />
          </svg>
        </a>
      </div>
    </div>
  );
}
```

**Step 2: Verify the player compiles and renders**

```bash
npx tsc --noEmit
npm run dev
```

Visit `/player/some-fake-id` — should show "Loading session..." then "Session not found" behavior. Once you've run a real capture, the full player should work.

**Step 3: Commit**

```bash
git add components/player/player-controls.tsx
git commit -m "feat: player controls with play/pause, speed, fullscreen, presentation, export"
```

---

## Phase 8: Home Page

### Task 20: Home Page with Session List

**Files:**
- Modify: `app/page.tsx`
- Create: `components/session-card.tsx`

**Step 1: Build session card component**

Create `components/session-card.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import type { SessionManifest } from "@/lib/types";

interface SessionCardProps {
  session: SessionManifest;
  onDelete: (id: string) => void;
}

export function SessionCard({ session, onDelete }: SessionCardProps) {
  const capturedFrames = session.frames.filter((f) => f.status === "captured");
  const firstFrame = capturedFrames[0];
  const lastFrame = capturedFrames[capturedFrames.length - 1];

  return (
    <motion.a
      href={`/player/${session.id}`}
      className="group block rounded-xl border border-surface-border bg-surface-raised overflow-hidden hover:border-amber/30 transition-all"
      whileHover={{ y: -2 }}
    >
      {/* Thumbnail strip: first and last frame */}
      <div className="relative aspect-video bg-surface flex">
        {firstFrame && (
          <img
            src={`/api/sessions/${session.id}/frames/${firstFrame.filename}`}
            alt="First frame"
            className="w-1/2 h-full object-cover opacity-40"
          />
        )}
        {lastFrame && lastFrame !== firstFrame && (
          <img
            src={`/api/sessions/${session.id}/frames/${lastFrame.filename}`}
            alt="Last frame"
            className="w-1/2 h-full object-cover"
          />
        )}
        {/* Gradient overlay from left (old) to right (new) */}
        <div className="absolute inset-0 bg-gradient-to-r from-surface/60 to-transparent" />

        {/* Frame count badge */}
        <div className="absolute bottom-2 right-2 rounded-md bg-surface/80 px-2 py-0.5 font-mono text-xs text-text-secondary">
          {capturedFrames.length} frames
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-semibold text-text-primary group-hover:text-amber transition-colors">
              {session.repoName}
            </h3>
            <p className="font-mono text-xs text-text-muted mt-0.5">
              {session.config.route} · {session.config.branch}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (confirm("Delete this session?")) onDelete(session.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all p-1"
            title="Delete session"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4h10M5 4V2h4v2M3 4l1 8h6l1-8" />
            </svg>
          </button>
        </div>
        <p className="font-mono text-xs text-text-muted mt-2">
          {new Date(session.createdAt).toLocaleDateString()} · {session.status}
        </p>
      </div>
    </motion.a>
  );
}
```

**Step 2: Update home page**

Replace `app/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SessionCard } from "@/components/session-card";
import type { SessionManifest } from "@/lib/types";

export default function Home() {
  const [sessions, setSessions] = useState<SessionManifest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <main className="min-h-screen px-6 py-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16">
        <motion.h1
          className="font-display text-5xl font-bold tracking-tight text-text-primary"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          MOMENTO
        </motion.h1>
        <motion.p
          className="mt-3 font-mono text-sm text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Cinematic git history timelapse
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            size="lg"
            className="mt-8"
            onClick={() => (window.location.href = "/capture")}
          >
            New Capture
          </Button>
        </motion.div>
      </div>

      {/* Sessions grid */}
      {loading ? (
        <div className="text-center text-text-muted font-mono text-sm">
          Loading sessions...
        </div>
      ) : sessions.length > 0 ? (
        <div>
          <h2 className="font-display text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Past Sessions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <SessionCard session={session} onDelete={handleDelete} />
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="font-mono text-sm text-text-muted">
            No sessions yet. Start your first capture!
          </p>
        </div>
      )}
    </main>
  );
}
```

**Step 3: Verify visually and commit**

```bash
npm run dev
```

Home page should show "MOMENTO" heading, "New Capture" button, and empty state message.

```bash
git add app/page.tsx components/session-card.tsx
git commit -m "feat: home page with session grid, animated entrance, session cards"
```

---

## Phase 9: Video Export

### Task 21: Video Export Backend

**Files:**
- Create: `lib/video-export.ts`
- Create: `app/api/export/route.ts`

**Step 1: Install FFmpeg bindings**

```bash
npm install fluent-ffmpeg @types/fluent-ffmpeg
```

**Step 2: Implement video export module**

Create `lib/video-export.ts`:

```typescript
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs/promises";
import { SessionManager } from "./session";
import type { SessionManifest } from "./types";

export interface ExportOptions {
  format: "mp4" | "webm" | "gif";
  fps: number;
  resolution?: { width: number; height: number };
}

export async function exportVideo(
  session: SessionManifest,
  sessionsDir: string,
  options: ExportOptions
): Promise<string> {
  const framesDir = path.join(sessionsDir, session.id, "frames");
  const exportsDir = path.join(sessionsDir, session.id, "exports");
  await fs.mkdir(exportsDir, { recursive: true });

  const capturedFrames = session.frames
    .filter((f) => f.status === "captured")
    .sort((a, b) => a.index - b.index);

  if (capturedFrames.length === 0) {
    throw new Error("No captured frames to export");
  }

  // Create a temporary file list for ffmpeg concat
  const listPath = path.join(exportsDir, "frames.txt");
  const listContent = capturedFrames
    .map((f) => {
      const framePath = path.join(framesDir, f.filename);
      const duration = 1 / options.fps;
      return `file '${framePath}'\nduration ${duration}`;
    })
    .join("\n");
  // FFmpeg concat requires the last file listed again
  const lastFrame = capturedFrames[capturedFrames.length - 1];
  const fullList = `${listContent}\nfile '${path.join(framesDir, lastFrame.filename)}'`;
  await fs.writeFile(listPath, fullList);

  const ext = options.format === "gif" ? "gif" : options.format;
  const outputFilename = `timelapse-${Date.now()}.${ext}`;
  const outputPath = path.join(exportsDir, outputFilename);

  return new Promise((resolve, reject) => {
    let cmd = ffmpeg()
      .input(listPath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions(["-pix_fmt", "yuv420p"]);

    if (options.resolution) {
      cmd = cmd.size(`${options.resolution.width}x${options.resolution.height}`);
    }

    if (options.format === "gif") {
      cmd = cmd.outputOptions([
        "-vf",
        `fps=${options.fps},scale=640:-1:flags=lanczos`,
      ]);
    } else {
      cmd = cmd.videoCodec(options.format === "webm" ? "libvpx-vp9" : "libx264");
    }

    cmd
      .output(outputPath)
      .on("end", async () => {
        // Clean up temp list file
        try { await fs.unlink(listPath); } catch {}
        resolve(`/api/sessions/${session.id}/exports/${outputFilename}`);
      })
      .on("error", (err) => reject(err))
      .run();
  });
}
```

**Step 3: Implement export API route**

Create `app/api/export/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { SessionManager } from "@/lib/session";
import { exportVideo, ExportOptions } from "@/lib/video-export";
import { SESSIONS_DIR } from "@/lib/constants";

const sessions = new SessionManager(SESSIONS_DIR);

export async function POST(request: Request) {
  const { sessionId, format, fps, resolution } = await request.json();

  const session = await sessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    const options: ExportOptions = {
      format: format ?? "mp4",
      fps: fps ?? 2,
      resolution,
    };
    const exportUrl = await exportVideo(session, SESSIONS_DIR, options);
    return NextResponse.json({ url: exportUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    );
  }
}
```

**Step 4: Add export file serving route**

Create `app/api/sessions/[id]/exports/[filename]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { SESSIONS_DIR } from "@/lib/constants";

const CONTENT_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  gif: "image/gif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  const { id, filename } = await params;
  const filePath = path.join(SESSIONS_DIR, id, "exports", filename);
  const ext = filename.split(".").pop() ?? "mp4";

  try {
    const buffer = await fs.readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Export not found" }, { status: 404 });
  }
}
```

**Step 5: Commit**

```bash
git add lib/video-export.ts app/api/export/ app/api/sessions/\[id\]/exports/
git commit -m "feat: video export via FFmpeg with MP4, WebM, GIF support"
```

---

### Task 22: Export Panel UI

**Files:**
- Create: `components/player/export-panel.tsx`
- Modify: `components/player/player-controls.tsx` — change export link to toggle panel
- Modify: `app/player/[sessionId]/page.tsx` — add export panel state

**Step 1: Build export panel**

Create `components/player/export-panel.tsx`:

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ExportPanelProps {
  sessionId: string;
  open: boolean;
  onClose: () => void;
}

export function ExportPanel({ sessionId, open, onClose }: ExportPanelProps) {
  const [format, setFormat] = useState<"mp4" | "webm" | "gif">("mp4");
  const [fps, setFps] = useState(2);
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, format, fps }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExportUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed right-0 top-0 bottom-0 w-80 bg-surface-raised border-l border-surface-border p-6 z-40 flex flex-col"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-sm font-semibold text-text-primary">
              Export Video
            </h3>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>

          <div className="space-y-5 flex-1">
            {/* Format */}
            <div>
              <label className="block text-xs font-display text-text-secondary mb-2">Format</label>
              <div className="grid grid-cols-3 gap-2">
                {(["mp4", "webm", "gif"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`rounded-lg border px-3 py-2 font-mono text-xs uppercase transition-all ${
                      format === f
                        ? "border-amber bg-amber/10 text-amber"
                        : "border-surface-border text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Speed */}
            <div>
              <label className="block text-xs font-display text-text-secondary mb-2">
                Speed — {fps} fps ({fps === 1 ? "1 sec" : `${(1 / fps).toFixed(1)}s`} per frame)
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="w-full accent-amber"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 font-mono">{error}</p>
            )}

            {exportUrl && (
              <div className="rounded-lg bg-surface p-3 border border-amber/20">
                <p className="text-xs text-green-400 font-mono mb-2">Export complete!</p>
                <a
                  href={exportUrl}
                  download
                  className="text-xs text-amber hover:underline font-mono"
                >
                  Download {format.toUpperCase()}
                </a>
              </div>
            )}
          </div>

          <Button
            onClick={handleExport}
            disabled={exporting}
            className="w-full"
          >
            {exporting ? "Encoding..." : `Export as ${format.toUpperCase()}`}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Step 2: Wire export panel into player page**

In `app/player/[sessionId]/page.tsx`:

- Add import: `import { ExportPanel } from "@/components/player/export-panel";`
- Add state: `const [showExport, setShowExport] = useState(false);`
- Add before closing `</main>`: `<ExportPanel sessionId={sessionId} open={showExport} onClose={() => setShowExport(false)} />`

Update `PlayerControls` usage to pass `onToggleExport`:
- Add `onToggleExport={() => setShowExport((p) => !p)}` prop
- In `player-controls.tsx`, replace the export `<a>` with a `<button>` that calls `onToggleExport`

**Step 3: Commit**

```bash
git add components/player/export-panel.tsx components/player/player-controls.tsx app/player/
git commit -m "feat: export panel with format selection, speed config, and download"
```

---

## Phase 10: Polish & Final Integration

### Task 23: Ensure ~/.momento Directory Exists

**Files:**
- Create: `lib/ensure-dirs.ts`
- Modify: `app/layout.tsx` — call ensureDirs on server side

**Step 1: Create directory initialization**

Create `lib/ensure-dirs.ts`:

```typescript
import fs from "fs/promises";
import { MOMENTO_DIR, SESSIONS_DIR } from "./constants";

let initialized = false;

export async function ensureDirs(): Promise<void> {
  if (initialized) return;
  await fs.mkdir(SESSIONS_DIR, { recursive: true });
  initialized = true;
}
```

**Step 2: Call from layout or a server-side initialization**

Add to each API route that accesses sessions (alternatively, add a middleware). Simplest approach: add `await ensureDirs()` at the top of `app/api/sessions/route.ts` and `app/api/capture/start/route.ts`.

**Step 3: Commit**

```bash
git add lib/ensure-dirs.ts app/api/
git commit -m "feat: auto-create ~/.momento directory structure on first use"
```

---

### Task 24: FFmpeg Availability Check

**Files:**
- Create: `lib/ffmpeg-check.ts`
- Modify: `components/player/export-panel.tsx` — show warning if FFmpeg missing

**Step 1: Implement FFmpeg check**

Create `lib/ffmpeg-check.ts`:

```typescript
import { execSync } from "child_process";

let cachedResult: boolean | null = null;

export function isFFmpegAvailable(): boolean {
  if (cachedResult !== null) return cachedResult;
  try {
    execSync("ffmpeg -version", { stdio: "pipe" });
    cachedResult = true;
  } catch {
    cachedResult = false;
  }
  return cachedResult;
}
```

**Step 2: Add an API endpoint to check FFmpeg**

Create `app/api/system/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { isFFmpegAvailable } from "@/lib/ffmpeg-check";

export async function GET() {
  return NextResponse.json({
    ffmpeg: isFFmpegAvailable(),
  });
}
```

**Step 3: Update export panel to check and warn**

In `components/player/export-panel.tsx`, add a useEffect that calls `/api/system` and shows a message if FFmpeg is not found:

```
"FFmpeg not found. Install it to enable video export:
  brew install ffmpeg (macOS)
  sudo apt install ffmpeg (Linux)"
```

**Step 4: Commit**

```bash
git add lib/ffmpeg-check.ts app/api/system/ components/player/export-panel.tsx
git commit -m "feat: FFmpeg availability check with user-friendly install instructions"
```

---

### Task 25: Run Full Integration Test

**Step 1: Start the dev server**

```bash
npm run dev
```

**Step 2: Manual integration test**

1. Visit `localhost:3000` — verify home page renders with "MOMENTO" and "New Capture"
2. Click "New Capture" → navigate to `/capture`
3. Enter a real repo path (e.g., any small local Next.js project)
4. Validate → select branch → continue
5. Set route to `/` and sampling to every 3rd commit
6. Click "Begin Capture" — watch progress with live screenshots
7. When complete, click "View in Player"
8. Test: play/pause, arrow keys, scrubbing, speed toggle
9. Test presentation mode (P key)
10. Test export panel (if FFmpeg installed)

**Step 3: Fix any issues found during integration**

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix: integration test fixes and polish"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-2 | Project scaffold, cinematic dark theme |
| 2 | 3-6 | Core libraries: types, git, sessions, server detection |
| 3 | 7-9 | Screenshot, dev server, capture engine |
| 4 | 10-12 | API routes: sessions, capture SSE, repo validation |
| 5 | 13-15 | Wizard UI: components, repo step, configure step |
| 6 | 16 | Capture progress with live SSE updates |
| 7 | 17-19 | Player: frame display, timeline, controls |
| 8 | 20 | Home page with session grid |
| 9 | 21-22 | Video export backend + panel UI |
| 10 | 23-25 | Polish: directory init, FFmpeg check, integration test |

**Total: 25 tasks across 10 phases.**
