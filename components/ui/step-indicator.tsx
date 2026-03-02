"use client";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-mono font-medium transition-all ${
                i < currentStep
                  ? "bg-amber text-surface"
                  : i === currentStep
                  ? "bg-amber/20 text-amber border border-amber/50"
                  : "bg-surface-overlay text-text-muted border border-surface-border"
              }`}
            >
              {i < currentStep ? "\u2713" : i + 1}
            </div>
            <span
              className={`text-xs font-display ${
                i <= currentStep ? "text-text-primary" : "text-text-muted"
              }`}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-px w-8 ${
                i < currentStep ? "bg-amber" : "bg-surface-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
