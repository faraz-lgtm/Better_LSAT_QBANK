import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { PracticeSectionStartCard } from "@/features/student/components/practice-section-start-card"

const { startSection } = vi.hoisted(() => ({
  startSection: vi.fn().mockResolvedValue({ session: { id: "sess-1" } }),
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

vi.mock("@/lib/api/practice", () => ({
  createPracticeApi: () => ({
    listSectionPool: vi.fn().mockImplementation(({ sectionType }: { sectionType: "LR" | "RC" }) =>
      Promise.resolve({
        sections: [
          {
            id: sectionType === "RC" ? "sec-rc" : "sec-lr",
            sectionId: "1",
            sectionNumber: 1,
            sectionType,
            title: sectionType === "RC" ? "Reading Comprehension" : "Logical Reasoning",
            moduleId: "LSAC158",
            prepTestId: "pt-158",
            prepTestTitle: "PrepTest 158",
            questionCount: sectionType === "RC" ? 27 : 25,
            timeMinutes: 35,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 50,
        sectionTypeCounts: { all: 1, lr: sectionType === "LR" ? 1 : 0, rc: sectionType === "RC" ? 1 : 0 },
      }),
    ),
    startSection,
  }),
}))

describe("PracticeSectionStartCard Build My Own", () => {
  it("uses the same Pace menu as drills", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <PracticeSectionStartCard sectionType="LR" />
      </MemoryRouter>,
    )

    expect(screen.getByText("Pace")).toBeInTheDocument()
    expect(screen.getByText("Choose your timing.")).toBeInTheDocument()
    expect(screen.queryByText("Timing")).not.toBeInTheDocument()
    expect(screen.queryByText("Control your Prep pace")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Pace" }))
    expect(screen.getByRole("option", { name: /Standard/ })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /Unlimited/ })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /Target/ })).toBeInTheDocument()
    expect(screen.getByText("SPEED TRAINING")).toBeInTheDocument()
    expect(screen.getByText("CUSTOM")).toBeInTheDocument()

    await user.click(screen.getByRole("option", { name: /Standard/ }))
    startSection.mockClear()
    await user.click(await screen.findByRole("button", { name: "Start LR Section" }))
    await waitFor(() => {
      expect(startSection).toHaveBeenCalledWith({
        sectionId: "sec-lr",
        timing: "pace",
        showAnswers: "end",
        difficulty: "adaptive",
      })
    })
  })

  it("starts an LR section with Answer Check and Challenge when Build My Own is on", async () => {
    const user = userEvent.setup()
    startSection.mockClear()
    render(
      <MemoryRouter>
        <PracticeSectionStartCard sectionType="LR" />
      </MemoryRouter>,
    )

    expect(screen.queryByRole("button", { name: "Answer Check" })).not.toBeInTheDocument()
    await user.click(screen.getByRole("switch", { name: "Build My Own" }))
    await user.click(screen.getByRole("button", { name: "Answer Check" }))
    await user.click(screen.getByRole("option", { name: "After each question" }))
    await user.click(screen.getByRole("button", { name: "Challenge" }))
    await user.click(screen.getByRole("option", { name: "Easy" }))
    await user.click(await screen.findByRole("button", { name: "Start LR Section" }))

    await waitFor(() => {
      expect(startSection).toHaveBeenCalledWith({
        sectionId: "sec-lr",
        timing: "unlimited",
        showAnswers: "each",
        difficulty: "easy",
      })
    })
  })

  it("starts an RC section with the selected Build My Own settings", async () => {
    const user = userEvent.setup()
    startSection.mockClear()
    render(
      <MemoryRouter>
        <PracticeSectionStartCard sectionType="RC" />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("switch", { name: "Build My Own" }))
    await user.click(screen.getByRole("button", { name: "Challenge" }))
    await user.click(screen.getByRole("option", { name: "Hard" }))
    await user.click(await screen.findByRole("button", { name: "Start RC Section" }))

    await waitFor(() => {
      expect(startSection).toHaveBeenCalledWith({
        sectionId: "sec-rc",
        timing: "unlimited",
        showAnswers: "end",
        difficulty: "hard",
      })
    })
  })
})
