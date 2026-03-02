"use client";

import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-display text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-lg border bg-surface-raised px-4 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber/50 transition-colors ${
            error ? "border-red-500" : "border-surface-border"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400 font-mono">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
