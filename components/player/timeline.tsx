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

  const seekFromEvent = useCallback(
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
      if (e.buttons !== 1) return;
      seekFromEvent(e);
    },
    [seekFromEvent]
  );

  const progressPercent =
    frames.length > 1 ? (currentIndex / (frames.length - 1)) * 100 : 0;

  return (
    <div className="space-y-1">
      <div
        ref={trackRef}
        className="relative h-2 bg-surface-overlay rounded-full cursor-pointer group"
        onClick={seekFromEvent}
        onMouseMove={handleDrag}
      >
        <div
          className="absolute inset-y-0 left-0 bg-amber/60 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-amber rounded-full shadow-[0_0_10px_rgba(245,158,11,0.4)] transition-transform group-hover:scale-125"
          style={{ left: `${progressPercent}%` }}
        />
      </div>
      <div className="relative h-2 flex items-center">
        {frames.map((frame, i) => {
          const left = frames.length > 1 ? (i / (frames.length - 1)) * 100 : 50;
          return (
            <div
              key={i}
              className={`absolute w-1 h-1 rounded-full -translate-x-1/2 cursor-pointer transition-all hover:scale-150 ${
                frame.status === "captured"
                  ? i <= currentIndex ? "bg-amber" : "bg-text-muted/40"
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
