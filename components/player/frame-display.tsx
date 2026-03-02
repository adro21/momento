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
      <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(245,158,11,0.04)] pointer-events-none rounded-xl" />
    </div>
  );
}
