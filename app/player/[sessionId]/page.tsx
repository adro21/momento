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
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [showExport, setShowExport] = useState(false);

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

  // Presentation mode
  if (isPresentationMode) {
    return (
      <main className="fixed inset-0 bg-black flex items-center justify-center cursor-none">
        <div className="w-full max-w-6xl px-8">
          <FrameDisplay frame={currentFrame} sessionId={sessionId} />
          {currentFrame && (
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <span className="font-mono text-xs text-text-muted/50">
                {currentFrame.commit.shortHash} &middot; {currentFrame.commit.message}
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

      {/* Frame display */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-5xl">
          <FrameDisplay frame={currentFrame} sessionId={sessionId} />
          {currentFrame && (
            <div className="mt-4 text-center font-mono text-xs text-text-secondary">
              {currentFrame.commit.shortHash} &middot; &quot;{currentFrame.commit.message}&quot; &middot; {new Date(currentFrame.commit.date).toLocaleDateString()}
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
          onToggleExport={() => setShowExport((p) => !p)}
        />
      </div>
    </main>
  );
}
