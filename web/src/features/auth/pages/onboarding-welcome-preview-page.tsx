import { useState } from "react"

import { ONBOARDING_RECOMMENDED_LSAT_DATE } from "@/features/auth/onboarding/onboarding-lsat-date-options"
import { OnboardingWelcomeStep } from "@/features/auth/onboarding/onboarding-welcome-step"

function OnboardingWelcomePreviewPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [plannedLsatDate, setPlannedLsatDate] = useState(ONBOARDING_RECOMMENDED_LSAT_DATE)

  return (
    <OnboardingWelcomeStep
      firstName={firstName}
      onFirstNameChange={setFirstName}
      lastName={lastName}
      onLastNameChange={setLastName}
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
