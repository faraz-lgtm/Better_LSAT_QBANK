import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"

import { GuestDiagnosticExamLayout } from "@/features/guest/diagnostic/guest-diagnostic-exam-layout"
import { getGuestDiagnosticTestConfig } from "@/features/guest/diagnostic/guest-diagnostic-test-config"
import { ThemeProvider } from "@/features/theme/theme-provider"

const timerState = vi.hoisted(() => ({
  countdown: null as number | null,
  paused: false,
  pauseTimer: vi.fn(),
  resumeTimer: vi.fn(),
  setInitialCountdown: vi.fn(),
}))

vi.mock("@/features/student/practice-session/use-practice-session-timer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/student/practice-session/use-practice-session-timer")>()
  return {
    ...actual,
    usePracticeSessionTimer: () => ({
      elapsed: 0,
      countdown: timerState.countdown,
      paused: timerState.paused,
      togglePause: vi.fn(),
      pauseTimer: timerState.pauseTimer,
      resumeTimer: timerState.resumeTimer,
      resetElapsed: vi.fn(),
      setPaused: vi.fn(),
      setInitialCountdown: timerState.setInitialCountdown,
    }),
  }
})

function renderExam(ui: ReactNode) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/diagnostic/start"]}>
        <Routes>
          <Route path="*" element={ui} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe("GuestDiagnosticExamLayout time up", () => {
  beforeAll(() => {
    Element.prototype.scrollTo = () => undefined
  })

  beforeEach(() => {
    timerState.countdown = null
    timerState.paused = false
    timerState.pauseTimer.mockClear()
    timerState.resumeTimer.mockClear()
    timerState.setInitialCountdown.mockClear()
    sessionStorage.clear()
  })

  it("shows Time's Up modal and auto-submits when Next is clicked", async () => {
    const user = userEvent.setup()
    const onSubmitted = vi.fn()
    const config = getGuestDiagnosticTestConfig("mini")
    timerState.countdown = 0

    renderExam(<GuestDiagnosticExamLayout config={config} interactive onSubmitted={onSubmitted} />)

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Time's Up!" })).toBeInTheDocument()
    })

    await user.click(screen.getByRole("button", { name: "Next" }))

    await waitFor(() => {
      expect(onSubmitted).toHaveBeenCalledTimes(1)
    })
  })

  it("does not show Time's Up while the countdown is still running", () => {
    const config = getGuestDiagnosticTestConfig("mini")
    timerState.countdown = 12 * 60 + 40

    renderExam(<GuestDiagnosticExamLayout config={config} interactive />)

    expect(screen.queryByRole("heading", { name: "Time's Up!" })).not.toBeInTheDocument()
  })
})
