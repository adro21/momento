"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/ui/step-indicator";
import { RepoStep } from "@/components/wizard/repo-step";
import { ConfigureStep } from "@/components/wizard/configure-step";
import { CaptureProgress } from "@/components/wizard/capture-progress";

const STEPS = ["Repository", "Configure", "Capture"];

interface WizardState {
  repoPath: string;
  repoName: string;
  branch: string;
  branches: { current: string; all: string[] };
  route: string;
  samplingN: number;
  startCommitIndex?: number;
  endCommitIndex?: number;
  safeMode?: boolean;
}

export default function CapturePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<Partial<WizardState>>({});

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-16">
      <div className="mb-12">
        <StepIndicator steps={STEPS} currentStep={step} />
      </div>

      {step === 0 && (
        <RepoStep
          onValidated={(data) => {
            setState((prev) => ({ ...prev, ...data }));
            setStep(1);
          }}
        />
      )}

      {step === 1 && state.repoPath && (
        <ConfigureStep
          repoPath={state.repoPath}
          branch={state.branch ?? "main"}
          onConfigured={(data) => {
            setState((prev) => ({ ...prev, ...data }));
            setStep(2);
          }}
          onBack={() => setStep(0)}
        />
      )}

      {step === 2 && state.repoPath && (
        <CaptureProgress
          repoPath={state.repoPath}
          branch={state.branch ?? "main"}
          route={state.route ?? "/"}
          samplingN={state.samplingN ?? 5}
          startCommitIndex={state.startCommitIndex}
          endCommitIndex={state.endCommitIndex}
          safeMode={state.safeMode}
          onComplete={(sessionId) => router.push(`/player/${sessionId}`)}
        />
      )}
    </main>
  );
}
