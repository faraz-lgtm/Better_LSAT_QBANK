import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { OnboardingPage } from "./onboarding-page"

const updatePassword = vi.fn()
const getCurrentUser = vi.fn()
const getSession = vi.fn()
const getMyProfile = vi.fn()
const getStudyContext = vi.fn()
const saveOnboarding = vi.fn()
const completeFirstLogin = vi.fn()
const signOut = vi.fn()
const clearStudentSessionCaches = vi.fn()
const resetUser = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { signOut },
  }),
}))

vi.mock("@/app/store-ref", () => ({
  getAppStore: () => ({
    dispatch: vi.fn(),
  }),
}))

vi.mock("@/lib/api/auth", () => ({
  createAuthApi: () => ({
    getCurrentUser,
    getSession,
    updatePassword,
  }),
}))

vi.mock("@/lib/api/users", () => ({
  createUsersApi: () => ({
    getMyProfile,
    getStudyContext,
    saveOnboarding,
    completeFirstLogin,
  }),
}))

vi.mock("@/lib/auth/fetch-post-auth-destination", () => ({
  fetchPostAuthDestination: vi.fn(async () => "/app"),
}))

vi.mock("@/lib/auth/clear-student-session-caches", () => ({
  clearStudentSessionCaches: () => clearStudentSessionCaches(),
}))

vi.mock("@/lib/analytics/posthog", () => ({
  AnalyticsEvent: { onboardingCompleted: "onboarding_completed" },
  captureEvent: vi.fn(),
  resetUser: () => resetUser(),
}))

vi.mock("@/lib/analytics/track-checkout-purchase", () => ({
  appendCheckoutSuccessQuery: (destination: string) => destination,
  useTrackCheckoutPurchase: () => undefined,
}))

function sessionWithoutPasswordAuth() {
  const payload = btoa(JSON.stringify({ amr: [{ method: "otp" }] }))
  return { access_token: `hdr.${payload}.sig` }
}

async function fillWelcomeAndContinue(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText(/first name/i), "Ada")
  await user.type(screen.getByPlaceholderText(/last name/i), "Lovelace")
  const passwordFields = screen.getAllByPlaceholderText(/enter your password/i)
  await user.type(passwordFields[0], "same-as-old-password")
  await user.type(passwordFields[1], "same-as-old-password")
  await user.click(screen.getByRole("button", { name: /^continue$/i }))
}

async function advanceToStartingScore(user: ReturnType<typeof userEvent.setup>) {
  // step 2 study days
  expect(await screen.findByRole("heading", { name: /what days do you want to study/i })).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: /^continue$/i }))
  // step 3 study hours
  expect(await screen.findByRole("heading", { name: /how many hours per day/i })).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: /^continue$/i }))
  // step 4 guidance
  expect(await screen.findByText(/1 hour\/day/i)).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: /^continue$/i }))
  // step 5 lessons
  expect(await screen.findByRole("heading", { name: /do you want lessons/i })).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: /^continue$/i }))
  // step 6 goal score
  expect(await screen.findByRole("heading", { name: /what's your goal score/i })).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: /^continue$/i }))
  // step 7 starting score
  expect(await screen.findByRole("heading", { name: /what's your starting score/i })).toBeInTheDocument()
}

function renderOnboarding() {
  return render(
    <MemoryRouter initialEntries={["/onboarding"]}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/app" element={<p>App home</p>} />
        <Route path="/login" element={<p>Login view</p>} />
        <Route path="/diagnostic/start" element={<p>Diagnostic start</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("OnboardingPage password setup", () => {
  beforeEach(() => {
    updatePassword.mockReset()
    getCurrentUser.mockReset()
    getSession.mockReset()
    getMyProfile.mockReset()
    getStudyContext.mockReset()
    saveOnboarding.mockReset()
    completeFirstLogin.mockReset()
    signOut.mockReset()
    clearStudentSessionCaches.mockReset()
    resetUser.mockReset()
    signOut.mockResolvedValue({ error: null })
    window.localStorage.clear()
    window.sessionStorage.clear()

    getCurrentUser.mockResolvedValue({
      id: "user-1",
      email: "invitee@example.com",
      app_metadata: { provider: "email" },
      identities: [{ provider: "email" }],
    })
    getSession.mockResolvedValue(sessionWithoutPasswordAuth())
    getMyProfile.mockResolvedValue({
      is_first_time_login: true,
      first_name: null,
      last_name: null,
      full_name: null,
    })
    getStudyContext.mockResolvedValue({ preferences: null, officialScores: [] })
    saveOnboarding.mockResolvedValue({
      profile: {
        is_first_time_login: true,
        first_name: "Ada",
        last_name: "Lovelace",
        full_name: "Ada Lovelace",
      },
    })
    completeFirstLogin.mockResolvedValue({
      is_first_time_login: false,
      first_name: "Ada",
      last_name: "Lovelace",
      full_name: "Ada Lovelace",
    })
  })

  it("shows logout instead of sign in and signs the user out", async () => {
    const user = userEvent.setup()

    renderOnboarding()

    expect(await screen.findByRole("heading", { name: /welcome to betterlsat/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^logout$/i })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /^logout$/i }))

    await waitFor(() => expect(signOut).toHaveBeenCalledOnce())
    expect(clearStudentSessionCaches).toHaveBeenCalledOnce()
    expect(resetUser).toHaveBeenCalledOnce()
    expect(await screen.findByText(/login view/i)).toBeInTheDocument()
  })

  it("shows same_password error on the welcome step and does not advance", async () => {
    const err = Object.assign(new Error("New password should be different from the old password."), {
      code: "same_password",
    })
    updatePassword.mockRejectedValue(err)
    const user = userEvent.setup()

    renderOnboarding()

    expect(await screen.findByRole("heading", { name: /welcome to betterlsat/i })).toBeInTheDocument()
    expect(screen.getByText(/^password/i)).toBeInTheDocument()

    await fillWelcomeAndContinue(user)

    expect(updatePassword).toHaveBeenCalledWith("same-as-old-password")
    expect(
      await screen.findByText(/that password is the same as your current account password/i),
    ).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /welcome to betterlsat/i })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /what days do you want to study/i })).not.toBeInTheDocument()
  })

  it("updates password on welcome continue and skips updatePassword on complete", async () => {
    updatePassword.mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderOnboarding()

    expect(await screen.findByRole("heading", { name: /welcome to betterlsat/i })).toBeInTheDocument()
    await fillWelcomeAndContinue(user)

    await waitFor(() => expect(updatePassword).toHaveBeenCalledTimes(1))
    expect(updatePassword).toHaveBeenCalledWith("same-as-old-password")

    await advanceToStartingScore(user)

    const startingScoreSelect = screen.getByRole("combobox")
    await user.selectOptions(startingScoreSelect, "150")
    await user.click(screen.getByRole("button", { name: /^continue$/i }))

    expect(await screen.findByText(/app home/i)).toBeInTheDocument()
    expect(updatePassword).toHaveBeenCalledTimes(1)
    expect(saveOnboarding).toHaveBeenCalled()
    expect(completeFirstLogin).toHaveBeenCalled()
  })

  it("saves onboarding before starting the diagnostic from step 8", async () => {
    updatePassword.mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderOnboarding()

    expect(await screen.findByRole("heading", { name: /welcome to betterlsat/i })).toBeInTheDocument()
    await fillWelcomeAndContinue(user)
    await waitFor(() => expect(updatePassword).toHaveBeenCalledTimes(1))

    await advanceToStartingScore(user)
    // Default starting score is "I haven't taken an LSAT yet" → step 8
    await user.click(screen.getByRole("button", { name: /^continue$/i }))

    expect(await screen.findByRole("heading", { name: /so you're a first-timer/i })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /start diagnostic/i }))

    expect(await screen.findByText(/diagnostic start/i)).toBeInTheDocument()
    expect(saveOnboarding).toHaveBeenCalled()
    expect(completeFirstLogin).toHaveBeenCalled()
    expect(updatePassword).toHaveBeenCalledTimes(1)
  })
})
