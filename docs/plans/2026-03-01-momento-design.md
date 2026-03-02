# Momento Design Document

**Date:** 2026-03-01
**Status:** Approved

## Overview

Momento is an open-source tool that captures the visual progression of a web page through a git repository's commit history and presents it as an interactive cinematic player or exportable timelapse video.

**Primary use cases:** Presentations, portfolio showcases, dev team retrospectives, social media content creation, and general developer tooling.

**Target projects:** Next.js / React SPAs (with auto-detection for Vite and other frameworks).

## Architecture

### Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Screenshot Engine:** Playwright
- **Video Export:** FFmpeg via `fluent-ffmpeg`
- **Git Operations:** `simple-git`
- **Real-time Progress:** Server-Sent Events (SSE)
- **Styling:** Tailwind CSS + CSS variables
- **Animations:** Framer Motion

### Core Data Flow

```
Wizard UI (select repo, route, sampling)
  → POST /api/capture/start
  → Capture Engine (per commit: worktree → install → dev server → screenshot → cleanup)
  → SSE progress stream to frontend
  → Session stored at ~/.momento/sessions/{id}/
  → Player UI loads session for viewing
  → Export to MP4/WebM/GIF via FFmpeg
```

### Capture Engine (per commit)

1. Create git worktree in `/tmp/momento-{hash}`
2. Check if package.json changed since previous commit
   - If unchanged: symlink/copy node_modules from previous worktree
   - If changed: run `npm install`
3. Auto-detect and start dev server (Next.js, Vite, or custom command)
4. Wait for server ready (poll health endpoint, configurable timeout: 60s)
5. Playwright: navigate to target route, wait for network idle + DOM stable
6. Take viewport screenshot, save as PNG
7. Record metadata (commit hash, date, message, author)
8. Kill dev server, cleanup worktree

### Smart Sampling Strategies

- **Every Nth commit** (default: auto-calculated to target ~50-100 frames)
- **Time-based** (one per day, one per week)
- **Change-detection** (only commits touching files in the target route's directory)
- **Manual picks** (user selects specific commits from a list)

### Optimizations

- **node_modules caching:** Diff package.json + lockfile between consecutive commits. Skip install when unchanged (~80%+ of commits).
- **Parallel captures:** Up to N concurrent worktrees (default 3), each on its own port.
- **Failure resilience:** Failed builds are skipped, not blocking. Capture continues.
- **Resume support:** Interrupted captures can resume from the last successful frame.

### Dev Server Detection

Auto-detect project type:
- `next.config.*` → `npx next dev -p {port}`
- `vite.config.*` → `npx vite --port {port}`
- `package.json` → look for `dev` or `start` script
- Fallback: user specifies custom start command in wizard

## UI Design

### Aesthetic: Cinematic Dark

- **Background:** Deep charcoal/near-black with subtle noise texture
- **Typography:** Distinctive geometric display font for headings, JetBrains Mono for data/commit info
- **Accent color:** Warm amber/gold (evoking film, light, time) — used sparingly for active states, scrub handle, progress indicators
- **Elevation:** Screenshots float with a subtle warm glow, like a projected image
- **Motion:** Smooth cinematic transitions, frames crossfade, controls fade in/out

### Screens

#### 1. Home / Sessions List

- Dark canvas, centered layout
- "MOMENTO" wordmark in distinctive display typeface
- "New Capture" as primary action (glowing amber button)
- Past sessions as a grid of thumbnail strips (first → last frame gradient)
- Each card: repo name, route, date, frame count

#### 2. Capture Wizard (3 steps)

- **Step 1 — Select Repo:** Paste or browse for local path, shows repo name + branch selector once validated
- **Step 2 — Configure:** Enter route (e.g., `/dashboard`), choose sampling strategy with smart defaults, preview commit list
- **Step 3 — Review & Start:** Summary of settings, estimated capture time, "Begin Capture" button

Dark cards floating on dark background, each step slides in smoothly.

#### 3. Capture Progress

- Latest captured screenshot displayed large and centered, updates live
- Progress bar with commit dots filling in as they complete
- Filmstrip preview of captured thumbnails building at the bottom edge
- Current commit info in mono: `abc1234 · "Add sidebar navigation" · Jan 15, 2025`
- Failed commits shown as dim/skipped dots

#### 4. Player

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│              ┌────────────────────────────┐                  │
│              │                            │                  │
│              │      SCREENSHOT            │                  │
│              │      (floating, glowing)   │                  │
│              │                            │                  │
│              └────────────────────────────┘                  │
│                                                              │
│   abc1234 · "Add dashboard layout" · Jan 15, 2025           │
│                                                              │
│  ▶ ─────●──────────────────────────────── 12/87  1x  ⛶  📥  │
│    ·  · ·· ·  ··· · ·  · ··  · · ·· · ·  · ·  · ·  ·       │
└──────────────────────────────────────────────────────────────┘
```

- Timeline bar with commit dots, amber scrub handle
- Controls: Play/Pause, speed (0.5x / 1x / 2x / 4x), fullscreen, export
- Frame info fades in below screenshot
- Hover on timeline dots shows commit tooltip
- Keyboard: Space (play/pause), Arrow keys (step), F (fullscreen), Esc (exit)

#### 5. Presentation Mode

- Triggered by "Present" button or P key
- Pure black background, screenshot only
- Auto-play at configurable speed
- Commit info as subtle fade-in/out overlay at bottom

#### 6. Export Panel

- Slide-out panel from player
- Format: MP4 (default), WebM, GIF
- Resolution: match source, 1080p, 720p
- Speed: configurable FPS / seconds per frame
- Optional overlays: commit info text, timestamp watermark
- Progress bar for FFmpeg encoding

## Edge Cases

- **Commit doesn't build:** Skip frame, mark as failed in manifest, continue
- **Dev server timeout:** Configurable (default 60s), skip on timeout
- **Route doesn't exist at commit:** Screenshot whatever renders (404 is valid progression data)
- **Massive repos (10k+ commits):** Auto-suggest sampling, default heuristic targets ~100 frames
- **Cancellation:** User can stop anytime, captured frames are saved and playable
- **Resume:** Interrupted captures resume from last successful frame

## Data Storage

```
~/.momento/
  └── sessions/
      └── {session-id}/
          ├── manifest.json
          ├── frames/
          │   ├── 001-abc1234.png
          │   └── ...
          └── exports/
              └── timelapse.mp4
```

Sessions are self-contained and portable (zip and share).

## Project Structure

```
momento/
├── app/
│   ├── page.tsx                    # Home / sessions list
│   ├── capture/page.tsx            # Wizard flow
│   ├── player/[sessionId]/page.tsx # Player
│   └── api/
│       ├── capture/
│       │   ├── start/route.ts      # Start capture (SSE stream)
│       │   └── stop/route.ts       # Cancel capture
│       ├── sessions/route.ts       # List/get sessions
│       └── export/route.ts         # Video export
├── lib/
│   ├── capture-engine.ts           # Core capture orchestration
│   ├── git.ts                      # Git operations
│   ├── server-detect.ts            # Auto-detect dev server
│   ├── screenshot.ts               # Playwright screenshot logic
│   ├── video-export.ts             # FFmpeg encoding
│   └── session.ts                  # Session CRUD & manifest
├── components/
│   ├── player/                     # Timeline, controls, frame display
│   ├── wizard/                     # Step-by-step capture setup
│   └── ui/                         # Shared UI components
└── public/
```

## Prerequisites

- Node.js 18+
- Git
- FFmpeg (for video export; helpful error message + install instructions if missing)
- Playwright installs its own Chromium automatically
