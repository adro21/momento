"use client";

interface PlayerControlsProps {
  playing: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  currentIndex: number;
  totalFrames: number;
  onToggleFullscreen: () => void;
  onTogglePresentation: () => void;
  onToggleExport: () => void;
}

const SPEEDS = [0.5, 1, 2, 4];

export function PlayerControls({
  playing,
  onTogglePlay,
  speed,
  onSpeedChange,
  currentIndex,
  totalFrames,
  onToggleFullscreen,
  onTogglePresentation,
  onToggleExport,
}: PlayerControlsProps) {
  const nextSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    onSpeedChange(next);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onTogglePlay}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-overlay text-text-primary hover:bg-amber hover:text-surface transition-all"
          title={playing ? "Pause (Space)" : "Play (Space)"}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="1" width="3.5" height="12" rx="1" />
              <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M3 1.5v11l9-5.5L3 1.5z" />
            </svg>
          )}
        </button>
        <button
          onClick={nextSpeed}
          className="rounded-lg bg-surface-overlay px-2.5 py-1.5 font-mono text-xs text-text-secondary hover:text-text-primary transition-colors"
          title="Cycle speed"
        >
          {speed}x
        </button>
        <span className="font-mono text-xs text-text-muted">
          {currentIndex + 1} / {totalFrames}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePresentation}
          className="rounded-lg bg-surface-overlay px-3 py-1.5 font-mono text-xs text-text-secondary hover:text-amber transition-colors"
          title="Presentation mode (P)"
        >
          Present
        </button>
        <button
          onClick={onToggleFullscreen}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-overlay text-text-secondary hover:text-text-primary transition-colors"
          title="Fullscreen (F)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9" />
          </svg>
        </button>
        <button
          onClick={onToggleExport}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-overlay text-text-secondary hover:text-text-primary transition-colors"
          title="Export video"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 1v8M3 6l4 4 4-4M1 11v2h12v-2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
