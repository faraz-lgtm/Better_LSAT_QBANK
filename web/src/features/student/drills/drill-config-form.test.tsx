import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DrillConfigForm } from "@/features/student/drills/drill-config-form"
import {
  drillConfigSettingsKey,
  writeSavedDrillConfig,
  type SavedDrillConfig,
} from "@/features/student/drills/drill-config-saved-settings"

const savedLrConfig: SavedDrillConfig = {
  questionCount: "10",
  passageCount: "1",
  timing: "35",
  showAnswers: "each",
  customize: false,
  selection: "auto",
  tags: "any",
  difficulty: "adaptive",
  status: "all",
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

vi.mock("@/lib/api/practice", () => ({
  createPracticeApi: () => ({
    getDrillPoolStats: vi.fn().mockResolvedValue({ selectedCount: 10, totalCount: 20 }),
    startDrill: vi.fn(),
  }),
}))

describe("DrillConfigForm save settings checkbox", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  function renderForm(sectionType: "LR" | "RC" = "LR") {
    return render(
      <MemoryRouter>
        <DrillConfigForm sectionType={sectionType} />
      </MemoryRouter>,
    )
  }

  it("replaces the save button with a checkbox that persists settings", async () => {
    const user = userEvent.setup()
    renderForm()

    expect(screen.queryByRole("button", { name: /save setting/i })).not.toBeInTheDocument()
    const checkbox = screen.getByRole("checkbox", { name: "Remember setup" })
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)
    expect(checkbox).toBeChecked()
    expect(window.localStorage.getItem(drillConfigSettingsKey("LR"))).toContain("\"timing\":\"unlimited\"")

    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
    expect(window.localStorage.getItem(drillConfigSettingsKey("LR"))).toBeNull()
  })

  it("restores saved settings and keeps the checkbox checked", async () => {
    const user = userEvent.setup()
    writeSavedDrillConfig("LR", savedLrConfig)
    renderForm()

    expect(screen.getByRole("checkbox", { name: "Remember setup" })).toBeChecked()
    expect(screen.getByRole("button", { name: "Pace" })).toHaveTextContent("35 minutes")
    expect(screen.queryByRole("button", { name: "Answer Check" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("switch", { name: "Build My Own" }))
    expect(screen.getByRole("button", { name: "Answer Check" })).toHaveTextContent("After each question")
  })

  it("lays out questions and timing in two columns for LR and RC", async () => {
    const user = userEvent.setup()
    const { unmount } = renderForm("LR")
    const lrRow = screen.getByRole("button", { name: "Pace" }).closest(".grid")
    expect(lrRow?.className).toMatch(/\bgrid-cols-2\b/)
    expect(lrRow?.className).not.toMatch(/grid-cols-3/)
    unmount()

    renderForm("RC")
    const rcRow = screen.getByRole("button", { name: "Pace" }).closest(".grid")
    expect(rcRow?.className).toMatch(/\bgrid-cols-2\b/)
    expect(rcRow?.className).not.toMatch(/grid-cols-3/)
    expect(screen.getByRole("button", { name: "Passages" })).toBeInTheDocument()

    await user.click(screen.getByRole("switch", { name: "Build My Own" }))
    expect(screen.getByRole("button", { name: "Reading Focus" })).toBeInTheDocument()
    expect(screen.getByText("Choose the reading skills to practise.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Skill Focus" })).not.toBeInTheDocument()
  })

  it("keeps questions and timing visible and puts show answers in Build My Own", async () => {
    const user = userEvent.setup()
    renderForm()

    expect(
      screen.getByRole("heading", {
        name: "Practice With More Clarity About Your Weaknesses & Strengths",
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Drill Size" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Pace" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Answer Check" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Question Mix" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("switch", { name: "Build My Own" }))
    expect(screen.getByRole("button", { name: "Answer Check" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Question Mix" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Skill Focus" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Challenge" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Question History" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Drill Size" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Pace" })).toBeInTheDocument()
  })

  it("opens the timing menu with Standard, speed training, and per-question options", async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole("button", { name: "Pace" }))
    expect(screen.getByRole("option", { name: /Standard/ })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /Target/ })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "35 minutes" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Per question (1:20)" })).toBeInTheDocument()
    expect(screen.getByText("SPEED TRAINING")).toBeInTheDocument()
    expect(screen.getByText("CUSTOM")).toBeInTheDocument()

    await user.click(screen.getByRole("option", { name: /Standard/ }))
    expect(screen.getByRole("button", { name: "Pace" })).toHaveTextContent("Standard")
  })

  it("does not offer Never (blind) in Show answers", async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole("switch", { name: "Build My Own" }))
    await user.click(screen.getByRole("button", { name: "Answer Check" }))
    expect(screen.getByRole("option", { name: "After the drill" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "After each question" })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "Never (blind)" })).not.toBeInTheDocument()
  })
})
