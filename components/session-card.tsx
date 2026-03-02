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
        <div className="absolute inset-0 bg-gradient-to-r from-surface/60 to-transparent" />
        <div className="absolute bottom-2 right-2 rounded-md bg-surface/80 px-2 py-0.5 font-mono text-xs text-text-secondary">
          {capturedFrames.length} frames
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-semibold text-text-primary group-hover:text-amber transition-colors">
              {session.repoName}
            </h3>
            <p className="font-mono text-xs text-text-muted mt-0.5">
              {session.config.route} &middot; {session.config.branch}
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
          {new Date(session.createdAt).toLocaleDateString()} &middot; {session.status}
        </p>
      </div>
    </motion.a>
  );
}
