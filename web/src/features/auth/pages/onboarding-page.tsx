import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { ONBOARDING_RECOMMENDED_LSAT_DATE } from "@/features/auth/onboarding/onboarding-lsat-date-options"
import { OnboardingWelcomeStep } from "@/features/auth/onboarding/onboarding-welcome-step"
import { isGuestDiagnosticIntentId } from "@/features/guest/diagnostic/guest-diagnostic-test-config"
import { createAuthApi } from "@/lib/api/auth"
import { createUsersApi } from "@/lib/api/users"
import { fetchPostAuthDestination } from "@/lib/auth/fetch-post-auth-destination"
import { hasPendingDiagnosticIntent, isInDiagnosticAcquisitionFunnel, readDiagnosticIntent } from "@/lib/auth/diagnostic-intent"
import { userNeedsPasswordSetup } from "@/lib/auth/password-setup"
import { splitFullName } from "@/lib/lawhub-identity"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatSupabaseCallError } from "@/lib/supabase/format-call-error"

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [plannedLsatDate, setPlannedLsatDate] = useState(ONBOARDING_RECOMMENDED_LSAT_DATE)
  const [studyDays, setStudyDays] = useState<string[]>(days.slice(0, 5))
  const [studyHours, setStudyHours] = useState("1-2 hours/day")
  const [wantsLessons, setWantsLessons] = useState<"no" | "yes">("no")
  const [goalScore, setGoalScore] = useState("180")
  const [lawSchoolCycle, setLawSchoolCycle] = useState("")
  const [startingScore, setStartingScore] = useState("I haven't taken an LSAT yet")
  const [predictedScore, setPredictedScore] = useState(25)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authApi = useMemo(() => {
    try {
      return createAuthApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const usersApi = useMemo(() => {
    try {
      return createUsersApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let alive = true
    async function load() {
      if (!authApi || !usersApi) {
        if (alive) {
          setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
          setIsLoading(false)
        }
        return
      }
      try {
        const [user, session, profile] = await Promise.all([
          authApi.getCurrentUser(),
          authApi.getSession(),
          usersApi.getMyProfile(),
        ])
        if (!alive) return
        if (!user) return navigate("/login", { replace: true })
        if (profile && (isInDiagnosticAcquisitionFunnel() || (profile.is_first_time_login && hasPendingDiagnosticIntent()))) {
          navigate("/diagnostic/start", { replace: true })
          return
        }
        if (profile && !profile.is_first_time_login) {
          navigate(await fetchPostAuthDestination(usersApi), { replace: true })
          return
        }
        setRequiresPassword(userNeedsPasswordSetup(user, session))
        if (profile?.first_name || profile?.last_name) {
          setFirstName(profile.first_name?.trim() ?? "")
          setLastName(profile.last_name?.trim() ?? "")
        } else if (profile?.full_name) {
          const names = splitFullName(profile.full_name)
          setFirstName(names.firstName)
          setLastName(names.lastName)
        }
      } catch (e) {
        if (!alive) return
        setError(e instanceof Error ? formatSupabaseCallError(e) : "Unable to load onboarding details.")
      } finally {
        if (alive) setIsLoading(false)
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [authApi, navigate, usersApi])

  function validateStep1(): boolean {
    if (!firstName.trim() || !lastName.trim()) {
      return setError("First and last name are required for LawHub registration."), false
    }
    if (!plannedLsatDate) return setError("Please select when you plan to take the LSAT."), false
    if (requiresPassword) {
      if (password.length < 8) return setError("Password must be at least 8 characters."), false
      if (password !== confirmPassword) return setError("Password and confirm password do not match."), false
    }
    setError(null)
    return true
  }

  async function completeOnboarding() {
    if (!authApi || !usersApi) {
      setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      return
    }
    if (!validateStep1()) return
    setIsSubmitting(true)
    setError(null)
    try {
      if (requiresPassword) await authApi.updatePassword(password)
      await usersApi.saveOnboarding({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        plannedLsatDate: plannedLsatDate === "not_sure" ? null : plannedLsatDate,
        plannedLsatWindow: plannedLsatDate === "not_sure" ? "not_sure" : null,
        lawSchoolCycle: lawSchoolCycle.trim() || null,
        goalScore,
        startingScore,
        studyDays,
        studyHoursLabel: studyHours,
        wantsLessons: wantsLessons === "yes",
      })
      await usersApi.completeFirstLogin()
      navigate(await fetchPostAuthDestination(usersApi), { replace: true })
    } catch (e) {
      setError(e instanceof Error ? formatSupabaseCallError(e) : "Unable to complete onboarding.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleWelcomeContinue() {
    if (!validateStep1()) return

    const storedIntent = readDiagnosticIntent()
    if (!isGuestDiagnosticIntentId(storedIntent)) {
      next()
      return
    }

    if (!authApi || !usersApi) {
      setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      if (requiresPassword) await authApi.updatePassword(password)
      await usersApi.saveOnboarding({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        plannedLsatDate: plannedLsatDate === "not_sure" ? null : plannedLsatDate,
        plannedLsatWindow: plannedLsatDate === "not_sure" ? "not_sure" : null,
      })
      navigate("/diagnostic/start", { replace: true })
    } catch (e) {
      setError(e instanceof Error ? formatSupabaseCallError(e) : "Unable to continue to diagnostic.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function next() {
    if (step === 1 && !validateStep1()) return
    if (step === 7) {
      if (startingScore === "I haven't taken an LSAT yet") return setStep(8)
      void completeOnboarding()
      return
    }
    if (step === 11) {
      void completeOnboarding()
      return
    }
    if (step === 13) return setStep(12)
    if (step < 13) setStep((step + 1) as Step)
  }

  function back() {
    if (step > 1) setStep((step - 1) as Step)
  }

  function title() {
    if (step === 2) return "What days do you want to study?"
    if (step === 3 || step === 4) return "How many hours per day will you study?"
    if (step === 5) return "Do you want lessons in your plan?"
    if (step === 6) return "What's your goal score?"
    if (step === 7) return "What's your starting score?"
    if (step === 8 || step === 9) return "So you're a first-timer!"
    if (step === 10) return "Submit Section"
    if (step === 11) return "All finished"
    if (step === 12) return "Time's Up!"
    return "Test"
  }

  if (step === 1) {
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
        requiresPassword={requiresPassword}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        error={error}
        onContinue={() => void handleWelcomeContinue()}
      />
    )
  }

  return (
    <AuthLayout ctaLabel="Log In" ctaHref="/login" headerVariant="app">
      <AuthCard className="mx-auto w-full max-w-[600px]">
        <div className="figma-gap-24 flex flex-col">
          <h1 className="figma-track-md text-center">{title()}</h1>
          {isLoading ? (
            <StudentPageLoader centered label="Loading…" />
          ) : (
            <>
              {step === 2 && (
                <div className="flex flex-col gap-2 rounded-2xl border border-[#dfe1e7] bg-[#f2f7ff] p-4">
                  {days.map((d) => (
                    <label key={d} className="inline-flex items-center gap-2 text-[#0d47a1]">
                      <input
                        type="checkbox"
                        checked={studyDays.includes(d)}
                        onChange={() =>
                          setStudyDays((curr) => curr.includes(d) ? curr.filter((x) => x !== d) : [...curr, d])
                        }
                      />
                      <span className="capitalize">{d}</span>
                    </label>
                  ))}
                </div>
              )}
              {step === 3 && (
                <>
                  <p className="text-sm text-[#082c6b]">Typical students dedicate 1 to 4 hours/day for 3 to 6 months.</p>
                  <Select value={studyHours} onChange={(e) => setStudyHours(e.target.value)} options={[
                    { label: "1-2 hours/day", value: "1-2 hours/day" },
                    { label: "3-4 hours/day", value: "3-4 hours/day" },
                    { label: "5-6 hours/day", value: "5-6 hours/day" },
                  ]} className="ds-input" />
                  <Button type="button" variant="ghost" className="text-[#0d47a1]" onClick={() => setStep(4)}>How much should I study</Button>
                </>
              )}
              {step === 4 && (
                <p className="text-sm text-[#666d80]">1 hour/day: ~6 months. 4 hours/day: ~3-4 months. 6 hours/day: ~2-3 months.</p>
              )}
              {step === 5 && (
                <>
                  <label className="inline-flex items-start gap-2"><input type="radio" checked={wantsLessons === "no"} onChange={() => setWantsLessons("no")} /><span><strong>No, just practice.</strong> Skip lessons and learn by doing.</span></label>
                  <label className="inline-flex items-start gap-2"><input type="radio" checked={wantsLessons === "yes"} onChange={() => setWantsLessons("yes")} /><span><strong>Yes, include lessons.</strong> Build foundation first.</span></label>
                </>
              )}
              {step === 6 && (
                <>
                  <Select value={goalScore} onChange={(e) => setGoalScore(e.target.value)} options={Array.from({ length: 61 }).map((_, i) => ({ label: String(120 + i), value: String(120 + i) }))} className="ds-input" />
                  <Input
                    value={lawSchoolCycle}
                    onChange={(e) => setLawSchoolCycle(e.target.value)}
                    placeholder="Law school admission cycle (e.g. 2027)"
                  />
                </>
              )}
              {step === 7 && (
                <Select value={startingScore} onChange={(e) => setStartingScore(e.target.value)} options={[
                  { label: "I haven't taken an LSAT yet", value: "I haven't taken an LSAT yet" },
                  ...Array.from({ length: 61 }).map((_, i) => ({ label: String(120 + i), value: String(120 + i) })),
                ]} className="ds-input" />
              )}
              {step === 8 && (
                <>
                  <p className="text-sm text-[#082c6b]">Take a diagnostic LR section to personalize your study plan. About 35 minutes.</p>
                  <Button type="button" className="ds-btn w-full" onClick={() => navigate("/diagnostic/start")}>Start Diagnostic</Button>
                  <Button type="button" variant="ghost" className="w-full text-[#0d47a1]" onClick={() => setStep(9)}>Skip</Button>
                </>
              )}
              {step === 9 && (
                <p className="text-center text-sm text-[#082c6b]">Are you sure you want to skip the diagnostic?</p>
              )}
              {step === 13 && (
                <div className="rounded-2xl border border-[#dfe1e7] bg-[#f6f8fa] p-4 text-sm text-[#082c6b]">Diagnostic test screen preview</div>
              )}
              {step === 12 && (
                <>
                  <p className="text-center text-sm text-[#082c6b]">How do you think you scored?</p>
                  <p className="text-center text-3xl font-semibold text-[#082c6b]">-{predictedScore}</p>
                  <input type="range" min={0} max={40} value={predictedScore} onChange={(e) => setPredictedScore(Number(e.target.value))} className="w-full accent-[#0d47a1]" />
                </>
              )}
              {step === 10 && <p className="text-center text-sm text-[#082c6b]">Are you sure you want to submit this section?</p>}
              {step === 11 && (
                <>
                  <p className="text-center text-sm text-[#666d80]">YOUR SCORE</p>
                  <p className="text-center text-3xl font-semibold text-[#082c6b]">-{predictedScore}</p>
                </>
              )}

              {error && <p className="text-center text-sm text-[#df1c41]">{error}</p>}

              <div className="flex w-full gap-3">
                {step > 1 && step !== 8 && step !== 11 && (
                  <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={back} disabled={isSubmitting}>Back</Button>
                )}
                {step === 9 ? (
                  <>
                    <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={() => setStep(8)}>Cancel</Button>
                    <Button type="button" className="ds-btn flex-1" onClick={() => void completeOnboarding()} disabled={isSubmitting}>Skip</Button>
                  </>
                ) : (
                  <Button type="button" className="ds-btn flex-1" onClick={next} disabled={isSubmitting}>
                    {isSubmitting ? "Completing..." : "Continue"}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </AuthCard>
    </AuthLayout>
  )
}

export { OnboardingPage }
