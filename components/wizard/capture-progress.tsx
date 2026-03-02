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
                if (event.progress.screenshotPath) {
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
        {currentScreenshot && (
          <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(245,158,11,0.05)] pointer-events-none" />
        )}
      </div>

      {/* Commit info */}
      {progress && (
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
          <span>{progress ? `${progress.currentIndex + 1} / ${progress.totalFrames}` : "..."}</span>
          <span className="capitalize">{progress?.status ?? "initializing"}</span>
        </div>
      </div>

      {/* Filmstrip */}
      {completedFrames.length > 0 && (
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
