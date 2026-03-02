"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ConfigureStepProps {
  repoPath: string;
  branch: string;
  onConfigured: (data: {
    route: string;
    samplingN: number;
    totalCommits: number;
    sampledCount: number;
  }) => void;
  onBack: () => void;
}

// Build distinct frame-count options for a given total
function buildFrameOptions(total: number): { n: number; frames: number }[] {
  const seen = new Set<number>();
  const options: { n: number; frames: number }[] = [];
  for (let n = total; n >= 1; n--) {
    const frames = Math.ceil(total / n);
    if (!seen.has(frames)) {
      seen.add(frames);
      options.push({ n, frames });
    }
  }
  return options; // sorted ascending by frames
}

export function ConfigureStep({ repoPath, branch, onConfigured, onBack }: ConfigureStepProps) {
  const [route, setRoute] = useState("/");
  const [samplingN, setSamplingN] = useState(1);
  const [totalCommits, setTotalCommits] = useState(0);
  const [suggestedN, setSuggestedN] = useState(1);
  const [loading, setLoading] = useState(true);
  const [frameOptions, setFrameOptions] = useState<{ n: number; frames: number }[]>([]);

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
        setSuggestedN(data.suggestedN);
        setSamplingN(data.suggestedN);
        setFrameOptions(buildFrameOptions(data.total));
      } finally {
        setLoading(false);
      }
    }
    fetchCommits();
  }, [repoPath, branch]);

  const sampledCount = Math.ceil(totalCommits / samplingN);

  // Find the slider index that matches current samplingN
  const sliderIndex = frameOptions.findIndex((o) => o.n === samplingN);
  const currentSliderIndex = sliderIndex >= 0 ? sliderIndex : 0;

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
          <div className="space-y-1.5">
            <label className="block text-sm font-display text-text-secondary">
              Frames to capture
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={frameOptions.length - 1}
                step={1}
                value={currentSliderIndex}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  const option = frameOptions[idx];
                  if (option) setSamplingN(option.n);
                }}
                className="flex-1 accent-amber"
              />
              <span className="font-mono text-sm text-text-primary w-16 text-right">
                {sampledCount}
              </span>
            </div>
            <div className="flex justify-between text-xs font-mono text-text-muted">
              <span>{totalCommits} total commits</span>
              <span>
                {samplingN === 1
                  ? "every commit"
                  : `every ${samplingN}${samplingN === 2 ? "nd" : samplingN === 3 ? "rd" : "th"} commit`}
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-surface p-3 border border-surface-border">
            <div className="text-xs font-mono text-text-muted space-y-1">
              <div className="flex justify-between">
                <span>Route</span>
                <span className="text-text-secondary">{route || "/"}</span>
              </div>
              <div className="flex justify-between">
                <span>Frames</span>
                <span className="text-text-secondary">~{sampledCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Est. time</span>
                <span className="text-text-secondary">~{Math.ceil(sampledCount * 0.75)} min</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onBack}>Back</Button>
            <Button onClick={() => onConfigured({ route, samplingN, totalCommits, sampledCount })} className="flex-1">
              Begin Capture
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
