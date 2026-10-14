import { useState } from "react"

import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { Button } from "@/components/ui/button"

type PreviewStep = "prompt" | "confirm"

function OnboardingDiagnosticPreviewPage() {
  const [step, setStep] = useState<PreviewStep>("prompt")

  return (
    <AuthLayout ctaLabel="Log In" ctaHref="/login" headerVariant="app">
      <AuthCard className="mx-auto w-full max-w-[600px]">
        <div className="figma-gap-24 flex flex-col">
          <h1 className="figma-track-md text-center">So you're a first-timer!</h1>
          {step === "prompt" ? (
            <>
              <p className="text-sm text-[#082c6b]">
                Take a diagnostic LR section to personalize your study plan. About 35 minutes.
              </p>
              <Button type="button" className="ds-btn w-full">
                Start Diagnostic
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-2xl"
                onClick={() => setStep("confirm")}
              >
                Skip
              </Button>
            </>
          ) : (
            <>
              <p className="text-center text-sm text-[#082c6b]">
                Are you sure you want to skip the diagnostic?
              </p>
              <div className="flex w-full gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-2xl"
                  onClick={() => setStep("prompt")}
                >
                  Cancel
                </Button>
                <Button type="button" className="ds-btn flex-1">
                  Skip
                </Button>
              </div>
            </>
          )}
        </div>
      </AuthCard>
    </AuthLayout>
  )
}

export { OnboardingDiagnosticPreviewPage }
