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

/**
 * Cinematic theater curtain overlay.
 * Uses layered CSS gradients to simulate velvet fabric folds
 * with light catching the peaks and shadows in the valleys.
 */

const VELVET_FOLDS_LEFT = `
  repeating-linear-gradient(
    90deg,
    #10020488 0px,
    #3d0a10cc 12px,
    #6b1520 22px,
    #82202b 28px,
    #6b1520 34px,
    #3d0a10cc 44px,
    #10020488 56px
  )
`;

const VELVET_FOLDS_RIGHT = `
  repeating-linear-gradient(
    270deg,
    #10020488 0px,
    #3d0a10cc 12px,
    #6b1520 22px,
    #82202b 28px,
    #6b1520 34px,
    #3d0a10cc 44px,
    #10020488 56px
  )
`;

function Curtain({ progress, completedFrames, skippedCount }: {
  progress: CaptureProgressType | null;
  completedFrames: number;
  skippedCount: number;
}) {
  const statusText = !progress
    ? "Preparing the stage..."
    : progress.status === "installing"
    ? "Installing dependencies..."
    : progress.status === "starting-server"
    ? "Starting dev server..."
    : progress.status === "screenshotting"
    ? "Capturing frame..."
    : progress.status === "skipped"
    ? "Duplicate — skipped"
    : progress.status === "done"
    ? "Frame captured!"
    : progress.status === "failed"
    ? "Frame failed, moving on..."
    : "Working...";

  return (
    <div className="absolute inset-0 z-10 overflow-hidden">
      {/* Dark void behind the gap between curtain panels */}
      <div className="absolute inset-0 bg-black" />

      {/* ── LEFT CURTAIN PANEL ── */}
      <motion.div
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: "52%",
          background: VELVET_FOLDS_LEFT,
          boxShadow: "inset -8px 0 30px rgba(0,0,0,0.7), inset 4px 0 12px rgba(100,15,20,0.2)",
        }}
        animate={{ x: [0, -1, 0, 1, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Gathering shadow — fabric bunches more toward the center edge */}
        <div
          className="absolute right-0 top-0 bottom-0 w-24"
          style={{
            background: "linear-gradient(to left, rgba(0,0,0,0.6), transparent)",
          }}
        />
        {/* Outer edge shadow */}
        <div
          className="absolute left-0 top-0 bottom-0 w-12"
          style={{
            background: "linear-gradient(to right, rgba(0,0,0,0.4), transparent)",
          }}
        />
        {/* Velvet sheen highlight — a faint warm light from above-left */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 30% 15%, rgba(180,60,60,0.15) 0%, transparent 60%)",
          }}
        />
      </motion.div>

      {/* ── RIGHT CURTAIN PANEL ── */}
      <motion.div
        className="absolute right-0 top-0 bottom-0"
        style={{
          width: "52%",
          background: VELVET_FOLDS_RIGHT,
          boxShadow: "inset 8px 0 30px rgba(0,0,0,0.7), inset -4px 0 12px rgba(100,15,20,0.2)",
        }}
        animate={{ x: [0, 1, 0, -1, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-24"
          style={{
            background: "linear-gradient(to right, rgba(0,0,0,0.6), transparent)",
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-12"
          style={{
            background: "linear-gradient(to left, rgba(0,0,0,0.4), transparent)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 70% 15%, rgba(180,60,60,0.15) 0%, transparent 60%)",
          }}
        />
      </motion.div>

      {/* ── GOLDEN VALANCE (top) ── */}
      <div className="absolute top-0 left-0 right-0 z-20" style={{ height: "48px" }}>
        {/* Rod */}
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{
            background: "linear-gradient(to bottom, #c9a84c, #a07830, #d4b45c, #8a6520)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
          }}
        />
        {/* Valance fabric — draped swags */}
        <div className="absolute top-2 left-0 right-0" style={{ height: "40px" }}>
          <svg
            viewBox="0 0 800 50"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            <defs>
              <linearGradient id="valanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5a1018" />
                <stop offset="40%" stopColor="#7a1f28" />
                <stop offset="100%" stopColor="#3a0810" />
              </linearGradient>
              <linearGradient id="goldFringe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c9a84c" />
                <stop offset="100%" stopColor="#8a6520" />
              </linearGradient>
            </defs>
            {/* Swag shapes */}
            <path d="M0,0 L0,8 Q100,45 200,8 L200,0 Z" fill="url(#valanceGrad)" />
            <path d="M200,0 L200,8 Q300,45 400,8 L400,0 Z" fill="url(#valanceGrad)" />
            <path d="M400,0 L400,8 Q500,45 600,8 L600,0 Z" fill="url(#valanceGrad)" />
            <path d="M600,0 L600,8 Q700,45 800,8 L800,0 Z" fill="url(#valanceGrad)" />
            {/* Gold fringe dots along the swag curves */}
            {Array.from({ length: 32 }, (_, i) => {
              const x = (i / 31) * 800;
              const seg = x % 200;
              const y = 8 + Math.sin((seg / 200) * Math.PI) * 37;
              return (
                <line
                  key={i}
                  x1={x} y1={y}
                  x2={x} y2={y + 6}
                  stroke="url(#goldFringe)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* ── CENTER CONTENT ── */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div className="text-center px-8">
          {/* Subtle spotlight effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 50% 50%, rgba(245,158,11,0.04) 0%, transparent 50%)",
            }}
          />

          {/* Film reel */}
          <motion.div
            className="relative mx-auto mb-5 w-14 h-14"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute inset-0 rounded-full border-2 border-amber/30" />
            <div className="absolute inset-[6px] rounded-full border border-amber/15" />
            <div className="absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber/40" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <div
                key={deg}
                className="absolute w-1.5 h-1.5 rounded-full bg-amber/20"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `rotate(${deg}deg) translate(18px, -50%)`,
                }}
              />
            ))}
          </motion.div>

          <p className="relative font-mono text-sm text-amber/70 mb-2 tracking-wide">
            {statusText}
          </p>
          <div className="relative flex items-center justify-center gap-3 font-mono text-xs text-text-muted/70">
            <span>{completedFrames} captured</span>
            {skippedCount > 0 && (
              <>
                <span className="text-text-muted/30">/</span>
                <span>{skippedCount} dupes removed</span>
              </>
            )}
          </div>

          {progress && (
            <p className="relative mt-4 font-mono text-xs text-text-muted/40 max-w-xs mx-auto truncate">
              {progress.currentCommit.shortHash} &middot; {progress.currentCommit.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
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
  const [skippedCount, setSkippedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [curtainMode, setCurtainMode] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;

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
                if (event.progress.status === "skipped") {
                  setSkippedCount((prev) => prev + 1);
                } else if (event.progress.screenshotPath) {
                  setCurrentScreenshot(event.progress.screenshotPath);
                  setCompletedFrames((prev) => [...prev, event.progress.screenshotPath]);
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
    controllerRef.current?.abort();
  };

  const progressPercent = progress
    ? Math.round(((progress.currentIndex + 1) / progress.totalFrames) * 100)
    : 0;

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      {/* Screenshot display */}
      <div className="relative aspect-video bg-surface rounded-xl border border-surface-border overflow-hidden mb-6">
        {/* Live screenshot (always rendered behind curtain for preloading) */}
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

        {/* Curtain overlay */}
        <AnimatePresence>
          {curtainMode && !done && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Curtain
                progress={progress}
                completedFrames={completedFrames.length}
                skippedCount={skippedCount}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {currentScreenshot && !curtainMode && (
          <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(245,158,11,0.05)] pointer-events-none" />
        )}

        {/* Curtain toggle */}
        {!done && (
          <button
            onClick={() => setCurtainMode((p) => !p)}
            className="absolute top-3 right-3 z-30 rounded-lg bg-surface border border-surface-border px-2.5 py-1.5 font-mono text-xs text-text-secondary hover:text-text-primary shadow-lg transition-colors"
            title={curtainMode ? "Show live preview" : "Hide preview (curtain mode)"}
          >
            {curtainMode ? "Peek" : "Curtain"}
          </button>
        )}
      </div>

      {/* Commit info */}
      {progress && !curtainMode && (
        <div className="text-center mb-4 font-mono text-xs text-text-secondary">
          {progress.currentCommit.shortHash} &middot; &quot;{progress.currentCommit.message}&quot; &middot; {new Date(progress.currentCommit.date).toLocaleDateString()}
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
          <span>{progress ? `${progress.currentIndex + 1} / ${progress.totalFrames}` : "..."}{skippedCount > 0 ? ` · ${skippedCount} dupes removed` : ""}</span>
          <span className="capitalize">{progress?.status === "skipped" ? "duplicate — skipped" : (progress?.status ?? "initializing")}</span>
        </div>
      </div>

      {/* Filmstrip */}
      {completedFrames.length > 0 && !curtainMode && (
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6">
          {completedFrames.map((src, i) => (
            <img key={i} src={src} alt={`Frame ${i + 1}`} className="h-12 w-auto rounded border border-surface-border opacity-60" />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-3">
        {!done && !error && (
          <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
        )}
        {done && sessionId && (
          <Button onClick={() => onComplete(sessionId)}>View in Player</Button>
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
