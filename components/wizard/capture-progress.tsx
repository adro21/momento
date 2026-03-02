"use client";

interface CaptureProgressProps {
  repoPath: string;
  branch: string;
  route: string;
  samplingN: number;
  onComplete: (sessionId: string) => void;
}

export function CaptureProgress(props: CaptureProgressProps) {
  return (
    <div className="text-text-muted font-mono text-sm">
      Capture in progress... (component built in next task)
    </div>
  );
}
