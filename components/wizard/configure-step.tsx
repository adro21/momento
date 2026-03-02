"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { countSampledFrames, buildFrameOptions } from "@/lib/sampling";
import type { CommitInfo } from "@/lib/types";

interface ConfigureStepProps {
  repoPath: string;
  branch: string;
  onConfigured: (data: {
    route: string;
    samplingN: number;
    totalCommits: number;
    sampledCount: number;
    startCommitIndex?: number;
    endCommitIndex?: number;
    safeMode?: boolean;
  }) => void;
  onBack: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

const THUMB_CLASSES =
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0";

export function ConfigureStep({ repoPath, branch, onConfigured, onBack }: ConfigureStepProps) {
  const [route, setRoute] = useState("/");
  const [safeMode, setSafeMode] = useState(true);
  const [samplingN, setSamplingN] = useState(1);
  const [totalCommits, setTotalCommits] = useState(0);
  const [commits, setCommits] = useState<CommitInfo[]>([]); // newest-first from API
  const [loading, setLoading] = useState(true);

  // Range state — chronological indices (0 = oldest)
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(0);

  useEffect(() => {
    async function fetchCommits() {
      setLoading(true);
      try {
        const res = await fetch("/api/repo/commits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoPath, branch }),
        });
        const data = await res.json();
        setTotalCommits(data.total);
        setCommits(data.commits ?? []);
        setRangeStart(0);
        setRangeEnd(data.total - 1);
        setSamplingN(data.suggestedN);
      } finally {
        setLoading(false);
      }
    }
    fetchCommits();
  }, [repoPath, branch]);

  // Derived: range size drives frame options and sampling
  const rangeSize = rangeEnd - rangeStart + 1;
  const frameOptions = buildFrameOptions(rangeSize);
  const sampledCount = countSampledFrames(rangeSize, samplingN);

  // Clamp samplingN when range changes
  const clampedN = Math.min(samplingN, rangeSize || 1);
  if (clampedN !== samplingN && rangeSize > 0) {
    setSamplingN(clampedN);
  }

  // Find the slider index that matches current samplingN
  const sliderIndex = frameOptions.findIndex((o) => o.n === samplingN);
  const currentSliderIndex = sliderIndex >= 0 ? sliderIndex : 0;

  // Get commit at a chronological index. commits[] is newest-first.
  const commitAt = useCallback(
    (chronIdx: number): CommitInfo | undefined =>
      commits[commits.length - 1 - chronIdx],
    [commits],
  );

  const startCommit = commitAt(rangeStart);
  const endCommit = commitAt(rangeEnd);

  const isSubRange = rangeStart !== 0 || rangeEnd !== totalCommits - 1;

  return (
    <Card className="w-full max-w-lg animate-fade-in">
      <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
        Configure Capture
      </h2>
      {loading ? (
        <div className="text-text-muted font-mono text-sm py-8 text-center">
          Loading commit history...
        </div>
      ) : (
        <div className="space-y-5">
          <Input
            label="Page Route"
            placeholder="/dashboard"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
          />

          {/* ── Commit range + sampling (unified control) ── */}
          <div className="space-y-3">
            <label className="block text-sm font-display text-text-secondary">
              Commits
            </label>

            {/* Dual-handle range slider */}
            {totalCommits > 1 && (
              <div>
                <div className="relative h-6">
                  {/* Track background */}
                  <div className="absolute top-1/2 -translate-y-1/2 h-1 w-full bg-surface-overlay rounded-full pointer-events-none" />
                  {/* Amber fill between handles */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-1 bg-amber/40 rounded-full pointer-events-none"
                    style={{
                      left: `${(rangeStart / (totalCommits - 1)) * 100}%`,
                      right: `${100 - (rangeEnd / (totalCommits - 1)) * 100}%`,
                      zIndex: 1,
                    }}
                  />
                  {/* Start handle */}
                  <input
                    type="range"
                    min={0}
                    max={totalCommits - 1}
                    value={rangeStart}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setRangeStart(Math.min(v, rangeEnd));
                    }}
                    className={`absolute inset-0 w-full appearance-none bg-transparent pointer-events-none ${THUMB_CLASSES}`}
                    style={{ zIndex: rangeStart > totalCommits - 1 - rangeEnd ? 3 : 2 }}
                  />
                  {/* End handle */}
                  <input
                    type="range"
                    min={0}
                    max={totalCommits - 1}
                    value={rangeEnd}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setRangeEnd(Math.max(v, rangeStart));
                    }}
                    className={`absolute inset-0 w-full appearance-none bg-transparent pointer-events-none ${THUMB_CLASSES}`}
                    style={{ zIndex: rangeEnd < totalCommits - 1 - rangeStart ? 3 : 2 }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-text-muted mt-1">
                  <span>
                    {startCommit
                      ? `${startCommit.shortHash} · ${formatDate(startCommit.date)}`
                      : "oldest"}
                  </span>
                  <span>
                    {endCommit
                      ? `${endCommit.shortHash} · ${formatDate(endCommit.date)}`
                      : "newest"}
                  </span>
                </div>
              </div>
            )}

            {/* Sampling density + frame count (compact row) */}
            <div className="flex items-center gap-3">
              <select
                value={currentSliderIndex}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  const option = frameOptions[idx];
                  if (option) setSamplingN(option.n);
                }}
                className="bg-surface border border-surface-border rounded-md px-2 py-1 text-xs font-mono text-text-secondary focus:outline-none focus:border-amber/50"
              >
                {frameOptions.map((opt, idx) => (
                  <option key={idx} value={idx}>
                    {opt.n === 1
                      ? "every commit"
                      : `every ${opt.n}${opt.n === 2 ? "nd" : opt.n === 3 ? "rd" : "th"}`}
                  </option>
                ))}
              </select>
              <span className="font-mono text-sm text-text-primary">
                {sampledCount} <span className="text-text-muted text-xs">frames</span>
              </span>
              {isSubRange && (
                <span className="text-xs font-mono text-text-muted ml-auto">
                  {rangeSize} of {totalCommits} commits
                </span>
              )}
            </div>
          </div>

          {/* ── Summary ── */}
          <div className="rounded-lg bg-surface p-3 border border-surface-border">
            <div className="text-xs font-mono text-text-muted space-y-1">
              <div className="flex justify-between">
                <span>Route</span>
                <span className="text-text-secondary">{route || "/"}</span>
              </div>
              <div className="flex justify-between">
                <span>Frames</span>
                <span className="text-text-secondary">{sampledCount}</span>
              </div>
              <button
                type="button"
                onClick={() => setSafeMode((s) => !s)}
                className="flex justify-between items-center w-full"
              >
                <span className="flex items-center gap-1.5">
                  Mode
                  <span className="relative group/info">
                    <span className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full border border-text-muted/30 text-text-muted/50 text-[9px] leading-none cursor-help">i</span>
                    <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-48 px-2.5 py-1.5 rounded-md bg-surface-overlay border border-surface-border text-[10px] font-mono text-text-muted shadow-lg opacity-0 pointer-events-none group-hover/info:opacity-100 transition-opacity duration-150 z-10 text-center">
                      {safeMode
                        ? "Clones to temp directory — your repo is never modified."
                        : "Operates on your repo directly — writes temporary metadata to .git/worktrees/, cleaned up after."}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-text-secondary">{safeMode ? "Safe" : "Direct"}</span>
                  <span
                    className={`relative inline-flex h-3.5 w-6 shrink-0 items-center rounded-full transition-colors ${
                      safeMode ? "bg-amber" : "bg-surface-overlay"
                    }`}
                  >
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full bg-white shadow-sm transition-transform ${
                        safeMode ? "translate-x-[11px]" : "translate-x-[2px]"
                      }`}
                    />
                  </span>
                </span>
              </button>
              <div className="flex justify-between">
                <span>Est. time</span>
                <span className="text-text-secondary">~{Math.ceil(sampledCount * 0.75)} min</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onBack}>Back</Button>
            <Button
              onClick={() =>
                onConfigured({
                  route,
                  samplingN,
                  totalCommits,
                  sampledCount,
                  safeMode,
                  ...(isSubRange
                    ? { startCommitIndex: rangeStart, endCommitIndex: rangeEnd }
                    : {}),
                })
              }
              className="flex-1"
            >
              Begin Capture
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
