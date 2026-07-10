import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Select } from "@/components/ui/select"
import { AuthCard } from "@/features/auth/components/auth-card"
import {
  ONBOARDING_LSAT_DATE_OPTIONS,
} from "@/features/auth/onboarding/onboarding-lsat-date-options"
import { GuestMarketingPanelLayout } from "@/features/guest/marketing/guest-marketing-panel-layout"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"

type OnboardingWelcomeStepProps = {
  fullName: string
  onFullNameChange: (value: string) => void
  password: string
  onPasswordChange: (value: string) => void
  confirmPassword: string
  onConfirmPasswordChange: (value: string) => void
  plannedLsatDate: string
  onPlannedLsatDateChange: (value: string) => void
  requiresPassword: boolean
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  onContinue: () => void
}

function OnboardingWelcomeStep({
  fullName,
  onFullNameChange,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  plannedLsatDate,
  onPlannedLsatDateChange,
  requiresPassword,
  isLoading,
  isSubmitting,
  error,
  onContinue,
}: OnboardingWelcomeStepProps) {
  return (
    <GuestMarketingPanelLayout headerVariant="signup">
      <AuthCard className="guest-marketing-signup-card">
        <div className="figma-gap-24 flex flex-col">
          <div className="figma-gap-16 flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold leading-[1.3] text-[#062357]">Welcome to BetterLSAT!</h1>
            <p className="figma-text-sm figma-track-sm font-medium text-[#666d80]">
              Here are a few questions to help us improve your study experience.
            </p>
          </div>

          {isLoading ? (
            <StudentPageLoader centered label="Loading…" />
          ) : (
            <>
              <div className="figma-gap-16 flex flex-col">
                <div className="figma-gap-8 flex flex-col">
                  <p className="figma-text-sm figma-track-sm font-medium text-[#062357]">
                    Full Name<span className="text-[#df1c41]">*</span>
                  </p>
                  <Input
                    value={fullName}
                    onChange={(event) => onFullNameChange(event.target.value)}
                    placeholder="Enter your name"
                    disabled={isSubmitting}
                  />
                </div>

                {requiresPassword ? (
                  <>
                    <div className="figma-gap-8 flex flex-col">
                      <p className="figma-text-sm figma-track-sm font-medium text-[#062357]">
                        Password<span className="text-[#df1c41]">*</span>
                      </p>
                      <PasswordInput
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => onPasswordChange(event.target.value)}
                        placeholder="Enter your password"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="figma-gap-8 flex flex-col">
                      <p className="figma-text-sm figma-track-sm font-medium text-[#062357]">
                        Confirm Password<span className="text-[#df1c41]">*</span>
                      </p>
                      <PasswordInput
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => onConfirmPasswordChange(event.target.value)}
                        placeholder="Enter your password"
                        disabled={isSubmitting}
                      />
                    </div>
                  </>
                ) : null}

                <div className="figma-gap-8 flex flex-col">
                  <p className="figma-text-sm figma-track-sm font-medium text-[#062357]">
                    When do you plan to take the LSAT?
                  </p>
                  <Select
                    value={plannedLsatDate}
                    onChange={(event) => onPlannedLsatDateChange(event.target.value)}
                    options={[...ONBOARDING_LSAT_DATE_OPTIONS]}
                    placeholder="Select a test date"
                    className="ds-input h-12 rounded-2xl"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {error ? (
                <p className="figma-text-sm figma-track-sm text-center text-[#df1c41]">{error}</p>
              ) : null}

              <Button
                type="button"
                className="ds-btn w-full"
                onClick={onContinue}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? "Continuing..." : "Continue"}
              </Button>
            </>
          )}
        </div>
      </AuthCard>
    </GuestMarketingPanelLayout>
  )
}

export { OnboardingWelcomeStep }
