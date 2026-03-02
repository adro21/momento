"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface RepoStepProps {
  onValidated: (data: {
    repoPath: string;
    repoName: string;
    branch: string;
    branches: { current: string; all: string[] };
  }) => void;
}

export function RepoStep({ onValidated }: RepoStepProps) {
  const [repoPath, setRepoPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<{
    repoName: string;
    branches: { current: string; all: string[] };
  } | null>(null);
  const [selectedBranch, setSelectedBranch] = useState("");

  const validateRepo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/repo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoPath: repoPath.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid repository");
        return;
      }
      setRepoInfo(data);
      setSelectedBranch(data.branches.current);
    } catch {
      setError("Failed to validate repository");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!repoInfo) return;
    onValidated({
      repoPath: repoPath.trim(),
      repoName: repoInfo.repoName,
      branch: selectedBranch,
      branches: repoInfo.branches,
    });
  };

  return (
    <Card className="w-full max-w-lg animate-fade-in">
      <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
        Select Repository
      </h2>
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="/path/to/your/project"
              value={repoPath}
              onChange={(e) => {
                setRepoPath(e.target.value);
                setRepoInfo(null);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && validateRepo()}
              error={error ?? undefined}
            />
          </div>
          <Button
            onClick={validateRepo}
            disabled={!repoPath.trim() || loading}
            variant="secondary"
          >
            {loading ? "Checking..." : "Validate"}
          </Button>
        </div>

        {repoInfo && (
          <div className="animate-slide-up space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-400">●</span>
              <span className="font-mono text-text-primary">{repoInfo.repoName}</span>
            </div>
            <div>
              <label className="block text-sm font-display text-text-secondary mb-1.5">Branch</label>
              <select
                className="w-full rounded-lg border border-surface-border bg-surface-raised px-4 py-2.5 font-mono text-sm text-text-primary focus:border-amber focus:outline-none"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                {repoInfo.branches.all.map((b) => (
                  <option key={b} value={b}>
                    {b} {b === repoInfo.branches.current ? "(current)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleContinue} className="w-full">Continue</Button>
          </div>
        )}
      </div>
    </Card>
  );
}
