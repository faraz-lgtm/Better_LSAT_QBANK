import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { SectionConfigForm } from "@/features/student/sections/section-config-form"

const { startSection } = vi.hoisted(() => ({
  startSection: vi.fn().mockResolvedValue({ session: { id: "sess-1" } }),
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

vi.mock("@/lib/api/practice", () => ({
  createPracticeApi: () => ({
    listSectionPool: vi.fn().mockResolvedValue({
      sections: [
        {
          id: "sec-1",
          sectionId: "1",
          sectionNumber: 1,
          sectionType: "LR",
          title: "Logical Reasoning",
          moduleId: "LSAC129",
          prepTestId: "pt-129",
          prepTestTitle: "PrepTest 129",
          questionCount: 25,
          timeMinutes: 35,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 50,
      sectionTypeCounts: { all: 1, lr: 1, rc: 0 },
    }),
    startSection,
  }),
}))

function renderForm(sectionType: "LR" | "RC" = "LR") {
  return render(
    <MemoryRouter>
      <SectionConfigForm sectionType={sectionType} />
    </MemoryRouter>,
  )
}

describe("SectionConfigForm Build My Own", () => {
  it("uses the same Pace menu as drills", async () => {
    const user = userEvent.setup()
    renderForm()

    expect(screen.getByRole("heading", { name: "Spend More Time Where You Need It" })).toBeInTheDocument()
    expect(screen.getByText("Choose a section to target your practice.")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Dismiss banner" }))
    expect(screen.queryByText("Choose a section to target your practice.")).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Spend More Time Where You Need It" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Pace" }))
    expect(screen.getByText("Choose your timing.")).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /Standard/ })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /Unlimited/ })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /Target/ })).toBeInTheDocument()
    expect(screen.getByText("SPEED TRAINING")).toBeInTheDocument()
    expect(screen.getByText("CUSTOM")).toBeInTheDocument()
    expect(screen.queryByText("Control your Prep pace")).not.toBeInTheDocument()
  })

  it("hides Answer Check and Challenge until Build My Own is on", async () => {
    const user = userEvent.setup()
    renderForm()

    expect(screen.getByRole("switch", { name: "Build My Own" })).not.toBeChecked()
    expect(screen.queryByRole("button", { name: "Answer Check" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Challenge" })).not.toBeInTheDocument()
    expect(await screen.findByText("25 new questions ready")).toBeInTheDocument()

    await user.click(screen.getByRole("switch", { name: "Build My Own" }))
    expect(screen.getByRole("button", { name: "Answer Check" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Challenge" })).toBeInTheDocument()
    expect(screen.getByText("Choose when to check your work.")).toBeInTheDocument()
    expect(screen.getByText("Choose your level.")).toBeInTheDocument()
  })

  it("offers After the section and does not offer Never (blind)", async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole("switch", { name: "Build My Own" }))
    await user.click(screen.getByRole("button", { name: "Answer Check" }))
    expect(screen.getByRole("option", { name: "After the section" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "After each question" })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "After the drill" })).not.toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "Never (blind)" })).not.toBeInTheDocument()
  })

  it("starts with default Answer Check and Challenge when the toggle is off", async () => {
    const user = userEvent.setup()
    startSection.mockClear()
    renderForm()

    await user.click(await screen.findByRole("button", { name: "Start Section" }))
    await waitFor(() => {
      expect(startSection).toHaveBeenCalledWith({
        sectionId: "sec-1",
        timing: "unlimited",
        showAnswers: "end",
        difficulty: "adaptive",
      })
    })
  })

  it("passes Answer Check and Challenge when starting an LR section", async () => {
    const user = userEvent.setup()
    startSection.mockClear()
    renderForm("LR")

    await user.click(screen.getByRole("switch", { name: "Build My Own" }))
    await user.click(screen.getByRole("button", { name: "Answer Check" }))
    await user.click(screen.getByRole("option", { name: "After each question" }))
    await user.click(screen.getByRole("button", { name: "Challenge" }))
    await user.click(screen.getByRole("option", { name: "Hard" }))
    await user.click(screen.getByRole("button", { name: "Start Section" }))

    await waitFor(() => {
      expect(startSection).toHaveBeenCalledWith({
        sectionId: "sec-1",
        timing: "unlimited",
        showAnswers: "each",
        difficulty: "hard",
      })
    })
  })

  it("shows Build My Own on RC section setup", async () => {
    const user = userEvent.setup()
    renderForm("RC")

    expect(screen.getByRole("switch", { name: "Build My Own" })).toBeInTheDocument()
    await user.click(screen.getByRole("switch", { name: "Build My Own" }))
    expect(screen.getByRole("button", { name: "Answer Check" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Challenge" })).toBeInTheDocument()
  })
})
