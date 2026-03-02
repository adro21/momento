import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`rounded-xl border border-surface-border bg-surface-raised p-6 ${className}`}>
      {children}
    </div>
  );
}
