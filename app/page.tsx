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

      {loading ? (
        <div className="text-center text-text-muted font-mono text-sm">Loading sessions...</div>
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
