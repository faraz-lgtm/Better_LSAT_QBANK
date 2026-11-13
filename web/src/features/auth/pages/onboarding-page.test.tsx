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
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {},
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

vi.mock("@/lib/analytics/posthog", () => ({
  AnalyticsEvent: { onboardingCompleted: "onboarding_completed" },
  captureEvent: vi.fn(),
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
  await user.type(screen.getByPlaceholderText(/phone number/i), "+1 555 123 4567")
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

  it("hides logout and sign-in CTAs on the welcome step", async () => {
    renderOnboarding()

    expect(await screen.findByRole("heading", { name: /welcome to betterlsat/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^logout$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument()
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
    expect(saveOnboarding).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Ada",
        lastName: "Lovelace",
        phone: "+1 555 123 4567",
      }),
    )
    expect(completeFirstLogin).toHaveBeenCalled()
  })

  it("requires a phone number on the welcome step", async () => {
    const user = userEvent.setup()

    renderOnboarding()

    expect(await screen.findByRole("heading", { name: /welcome to betterlsat/i })).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText(/first name/i), "Ada")
    await user.type(screen.getByPlaceholderText(/last name/i), "Lovelace")
    const passwordFields = screen.getAllByPlaceholderText(/enter your password/i)
    await user.type(passwordFields[0], "same-as-old-password")
    await user.type(passwordFields[1], "same-as-old-password")
    await user.click(screen.getByRole("button", { name: /^continue$/i }))

    expect(await screen.findByText(/phone is required/i)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /welcome to betterlsat/i })).toBeInTheDocument()
    expect(updatePassword).not.toHaveBeenCalled()
    expect(saveOnboarding).not.toHaveBeenCalled()
  })

  it("keeps typed values and shows live name and phone errors", async () => {
    const user = userEvent.setup()

    renderOnboarding()

    expect(await screen.findByRole("heading", { name: /welcome to betterlsat/i })).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText(/first name/i), "Assad1212")
    expect(screen.getByPlaceholderText(/first name/i)).toHaveValue("Assad1212")
    expect(screen.getByText(/name cannot include numbers/i)).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText(/phone number/i), "sdsdd3434")
    expect(screen.getByPlaceholderText(/phone number/i)).toHaveValue("sdsdd3434")
    expect(screen.getByText(/phone number cannot include letters/i)).toBeInTheDocument()
  })

  it("rejects phone numbers with letters on continue", async () => {
    const user = userEvent.setup()

    renderOnboarding()

    expect(await screen.findByRole("heading", { name: /welcome to betterlsat/i })).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText(/first name/i), "Ada")
    await user.type(screen.getByPlaceholderText(/last name/i), "Lovelace")
    await user.type(screen.getByPlaceholderText(/phone number/i), "sdsdd3434")
    const passwordFields = screen.getAllByPlaceholderText(/enter your password/i)
    await user.type(passwordFields[0], "same-as-old-password")
    await user.type(passwordFields[1], "same-as-old-password")
    await user.click(screen.getByRole("button", { name: /^continue$/i }))

    expect(screen.getAllByText(/phone number cannot include letters/i).length).toBeGreaterThan(0)
    expect(updatePassword).not.toHaveBeenCalled()
    expect(saveOnboarding).not.toHaveBeenCalled()
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
