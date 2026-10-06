import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthCard } from "@/features/auth/components/auth-card"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { createUsersApi } from "@/lib/api/users"
import { parseSignupPlan } from "@/lib/auth/pending-checkout-plan"
import { profileHasLawHubName, splitFullName } from "@/lib/lawhub-identity"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatSupabaseCallError } from "@/lib/supabase/format-call-error"

function CheckoutDetailsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const parsedPlan = parseSignupPlan(searchParams.get("plan"))
  const plan = parsedPlan && parsedPlan !== "free" ? parsedPlan : null
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(
    plan ? null : "This checkout plan is not available.",
  )

  const usersApi = useMemo(() => {
    try {
      return createUsersApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let alive = true

    async function loadProfile() {
      if (!plan || !usersApi) {
        if (alive) {
          if (!usersApi) setError("Account details are not available.")
          setIsLoading(false)
        }
        return
      }

      try {
        const nextProfile = await usersApi.getMyProfile()
        if (!alive) return
        if (!nextProfile) {
          return
        }
        if (profileHasLawHubName(nextProfile)) {
          navigate(`/checkout?plan=${plan}`, { replace: true })
          return
        }

        const fullName = splitFullName(nextProfile.full_name)
        setFirstName(nextProfile.first_name?.trim() || fullName.firstName)
        setLastName(nextProfile.last_name?.trim() || fullName.lastName)
      } catch (loadError) {
        if (!alive) return
        setError(
          loadError instanceof Error
            ? formatSupabaseCallError(loadError)
            : "Unable to load account details.",
        )
      } finally {
        if (alive) setIsLoading(false)
      }
    }

    void loadProfile()
    return () => {
      alive = false
    }
  }, [navigate, plan, usersApi])

  async function continueToCheckout() {
    if (!plan || !usersApi || isSubmitting) return
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await usersApi.updateAccountProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })
      navigate(`/checkout?plan=${plan}`, { replace: true })
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? formatSupabaseCallError(submitError)
          : "Unable to save account details.",
      )
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--primary-0)] px-4 py-10">
      <AuthCard className="w-full max-w-md">
        <div className="flex flex-col gap-5">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#062357]">One last detail</h1>
            <p className="mt-2 text-sm text-[#666d80]">
              Enter your legal name to continue to secure checkout.
            </p>
          </div>

          {isLoading ? (
            <StudentPageLoader centered label="Loading account details…" />
          ) : (
            <>
              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-2 text-sm font-medium text-[#062357]">
                  First name
                  <Input
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    disabled={isSubmitting}
                    autoComplete="given-name"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-[#062357]">
                  Last name
                  <Input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    disabled={isSubmitting}
                    autoComplete="family-name"
                  />
                </label>
              </div>

              {error ? (
                <p className="text-center text-sm text-[#df1c41]" role="alert">
                  {error}
                </p>
              ) : null}

              <Button
                type="button"
                className="ds-btn w-full"
                disabled={!plan || isSubmitting}
                onClick={() => void continueToCheckout()}
              >
                {isSubmitting ? "Saving…" : "Continue to checkout"}
              </Button>
            </>
          )}
        </div>
      </AuthCard>
    </main>
  )
}

export { CheckoutDetailsPage }
