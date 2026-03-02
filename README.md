# Momento

Cinematic git history timelapse for your web projects.

Momento walks through a repository's commit history, captures screenshots of a specific page at each point in time, and presents the progression as an interactive cinematic player or exportable timelapse video.

## Features

- **Capture wizard** — point at any local git repo, pick a page route, configure sampling, and start capturing
- **Smart sampling** — every Nth commit with an intuitive frame-count slider that shows every distinct option
- **Duplicate detection** — automatically skips frames that look identical to the previous (saves time and storage)
- **Cinematic player** — dark, minimal timeline scrubber with play/pause, speed control, and keyboard shortcuts
- **Presentation mode** — full-black immersive view, perfect for live demos and talks
- **Video export** — render to MP4, WebM, or GIF via FFmpeg
- **Curtain mode** — optional theater curtain overlay during capture for the patient types
- **Resilient** — failed builds are skipped, captures can be cancelled, partial sessions are still viewable
- **Fast** — git worktrees for isolation (never touches your working copy), smart node_modules caching between commits

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Git](https://git-scm.com/)
- [FFmpeg](https://ffmpeg.org/) (optional, for video export)

```bash
# macOS
brew install ffmpeg

# Linux
sudo apt install ffmpeg
```

## Getting Started

```bash
git clone https://github.com/adro21/momento.git
cd momento
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **New Capture**, and point it at any local Next.js or Vite project.

## How It Works

1. **Select a repo** — paste the path to a local git repository
2. **Configure** — choose the page route (e.g. `/dashboard`) and how many frames to capture
3. **Capture** — Momento creates git worktrees, installs dependencies, starts the dev server, and takes Playwright screenshots for each sampled commit
4. **Watch** — scrub through the timeline, play it back at different speeds, or enter presentation mode
5. **Export** — render the frames to MP4, WebM, or GIF

### Optimizations

- **node_modules caching** — if `package.json` hasn't changed between commits, node_modules are reused (~80% of commits skip install)
- **Duplicate detection** — frames that are visually identical to the previous are automatically detected and skipped using pixelmatch
- **Git worktrees** — each commit is checked out in an isolated temporary directory, so your working copy is never touched

## Keyboard Shortcuts (Player)

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `Left Arrow` | Previous frame |
| `Right Arrow` | Next frame |
| `P` | Presentation mode |
| `F` | Fullscreen |
| `Escape` | Exit presentation mode |

## Tech Stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Playwright](https://playwright.dev/) (screenshot capture)
- [Framer Motion](https://www.framer.com/motion/) (animations)
- [simple-git](https://github.com/steveukx/git-js) (git operations)
- [FFmpeg](https://ffmpeg.org/) via fluent-ffmpeg (video export)
- [pixelmatch](https://github.com/mapbox/pixelmatch) (duplicate detection)

## Supported Project Types

Momento auto-detects:

- **Next.js** (`next.config.*`)
- **Vite** (`vite.config.*`)
- **Custom** — any project with a `dev` script in `package.json`

## License

MIT
