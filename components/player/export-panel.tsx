"use client";

import { useState, useEffect } from "react";
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
  const [ffmpegAvailable, setFfmpegAvailable] = useState(true);

  useEffect(() => {
    fetch("/api/system")
      .then((r) => r.json())
      .then((data) => setFfmpegAvailable(data.ffmpeg))
      .catch(() => setFfmpegAvailable(false));
  }, []);

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
            <h3 className="font-display text-sm font-semibold text-text-primary">Export Video</h3>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>

          {!ffmpegAvailable && (
            <div className="rounded-lg bg-surface p-3 border border-amber/20 mb-4">
              <p className="text-xs text-amber font-mono mb-1">FFmpeg not found</p>
              <p className="text-xs text-text-muted font-mono">
                Install it to enable video export:<br />
                brew install ffmpeg (macOS)<br />
                sudo apt install ffmpeg (Linux)
              </p>
            </div>
          )}

          <div className="space-y-5 flex-1">
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

            {error && <p className="text-xs text-red-400 font-mono">{error}</p>}

            {exportUrl && (
              <div className="rounded-lg bg-surface p-3 border border-amber/20">
                <p className="text-xs text-green-400 font-mono mb-2">Export complete!</p>
                <a href={exportUrl} download className="text-xs text-amber hover:underline font-mono">
                  Download {format.toUpperCase()}
                </a>
              </div>
            )}
          </div>

          <Button
            onClick={handleExport}
            disabled={exporting || !ffmpegAvailable}
            className="w-full"
          >
            {exporting ? "Encoding..." : `Export as ${format.toUpperCase()}`}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
