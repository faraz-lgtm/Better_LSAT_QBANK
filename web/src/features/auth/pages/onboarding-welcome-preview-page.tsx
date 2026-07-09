import { useState } from "react"

import { ONBOARDING_RECOMMENDED_LSAT_DATE } from "@/features/auth/onboarding/onboarding-lsat-date-options"
import { OnboardingWelcomeStep } from "@/features/auth/onboarding/onboarding-welcome-step"

function OnboardingWelcomePreviewPage() {
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [plannedLsatDate, setPlannedLsatDate] = useState(ONBOARDING_RECOMMENDED_LSAT_DATE)

  return (
    <OnboardingWelcomeStep
      fullName={fullName}
      onFullNameChange={setFullName}
      password={password}
      onPasswordChange={setPassword}
      confirmPassword={confirmPassword}
      onConfirmPasswordChange={setConfirmPassword}
      plannedLsatDate={plannedLsatDate}
      onPlannedLsatDateChange={setPlannedLsatDate}
      requiresPassword
      isLoading={false}
      isSubmitting={false}
      error={null}
      onContinue={() => undefined}
    />
  )
}

export { OnboardingWelcomePreviewPage }
