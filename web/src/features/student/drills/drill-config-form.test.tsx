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
    const checkbox = screen.getByRole("checkbox", { name: "Save settings" })
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

    expect(screen.getByRole("checkbox", { name: "Save settings" })).toBeChecked()
    expect(screen.getByRole("button", { name: "Timing" })).toHaveTextContent("35 minutes")
    expect(screen.queryByRole("button", { name: "Show Answers" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("switch", { name: "Customize drill settings" }))
    expect(screen.getByRole("button", { name: "Show Answers" })).toHaveTextContent("After each question")
  })

  it("lays out questions and timing in two columns for LR and RC", () => {
    const { unmount } = renderForm("LR")
    const lrRow = screen.getByRole("button", { name: "Timing" }).closest(".grid")
    expect(lrRow?.className).toMatch(/\bgrid-cols-2\b/)
    expect(lrRow?.className).not.toMatch(/grid-cols-3/)
    unmount()

    renderForm("RC")
    const rcRow = screen.getByRole("button", { name: "Timing" }).closest(".grid")
    expect(rcRow?.className).toMatch(/\bgrid-cols-2\b/)
    expect(rcRow?.className).not.toMatch(/grid-cols-3/)
    expect(screen.getByRole("button", { name: "Number of Passages" })).toBeInTheDocument()
  })

  it("keeps questions and timing visible and puts show answers in Customize", async () => {
    const user = userEvent.setup()
    renderForm()

    expect(screen.getByRole("button", { name: "Number of Questions" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Timing" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show Answers" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Selection" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("switch", { name: "Customize drill settings" }))
    expect(screen.getByRole("button", { name: "Show Answers" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Selection" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Tags" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Difficulty" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Status" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Number of Questions" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Timing" })).toBeInTheDocument()
  })

  it("does not offer Never (blind) in Show answers", async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole("switch", { name: "Customize drill settings" }))
    await user.click(screen.getByRole("button", { name: "Show Answers" }))
    expect(screen.getByRole("option", { name: "At the end" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "After each question" })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "Never (blind)" })).not.toBeInTheDocument()
  })
})
