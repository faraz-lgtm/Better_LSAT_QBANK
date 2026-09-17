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
  tags: [],
  difficulty: "adaptive",
  status: "all",
  manualQuestionIds: [],
  manualPrepTestNumbers: [],
}

const startDrillMock = vi.fn().mockResolvedValue({
  session: { id: "sess-1" },
  metadata: { questionIds: ["q-1"] },
  questions: [],
  answers: [],
})

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

vi.mock("@/lib/api/practice", () => ({
  createPracticeApi: () => ({
    getDrillPoolStats: vi.fn().mockResolvedValue({ selectedCount: 10, totalCount: 20 }),
    startDrill: (...args: unknown[]) => startDrillMock(...args),
    listDrillPickerQuestions: vi.fn().mockResolvedValue({
      questions: [
        {
          id: "q-1",
          label: "PT158.S2.Q1",
          difficulty: 4,
          questionTypeId: "qt-1",
          tagLabel: "Flaw",
          prepTestId: "pt-158",
          moduleId: "LSAC158",
          prepTestNumber: 158,
          status: "fresh",
          result: "untouched",
          timeSpentSeconds: null,
          bookmarked: false,
          hasNotes: false,
          searchText: "pt158.s2.q1 flaw",
        },
      ],
      total: 1,
      page: 1,
      pageSize: 25,
      selectedCount: 1,
    }),
  }),
}))

describe("DrillConfigForm save settings checkbox", () => {
  beforeEach(() => {
    window.localStorage.clear()
    startDrillMock.mockClear()
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
    expect(screen.getByText("Choose up to three reading skills to name this drill.")).toBeInTheDocument()
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
    expect(screen.queryByRole("option", { name: "35 minutes" })).not.toBeInTheDocument()
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

  it("opens the select-questions modal when Pick my own is chosen", async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole("switch", { name: "Build My Own" }))
    await user.click(screen.getByRole("button", { name: "Question Mix" }))
    await user.click(screen.getByRole("option", { name: "Pick my own" }))

    expect(await screen.findByRole("heading", { name: "Select questions" })).toBeInTheDocument()
    expect(await screen.findByText("PT158.S2.Q1")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Start a Drill" })).toBeDisabled()
  })

  it("moves a match into Selected when plus is clicked", async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole("switch", { name: "Build My Own" }))
    await user.click(screen.getByRole("button", { name: "Question Mix" }))
    await user.click(screen.getByRole("option", { name: "Pick my own" }))

    expect(await screen.findByText("0 selected")).toBeInTheDocument()
    await user.click(await screen.findByRole("button", { name: "Add PT158.S2.Q1" }))

    expect(screen.getByText("1 selected")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Remove PT158.S2.Q1" }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole("button", { name: "Start a Drill" })).toBeEnabled()
  })

  it("starts the drill with only the selected question ids", async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole("switch", { name: "Build My Own" }))
    await user.click(screen.getByRole("button", { name: "Question Mix" }))
    await user.click(screen.getByRole("option", { name: "Pick my own" }))

    await user.click(await screen.findByRole("button", { name: "Add PT158.S2.Q1" }))
    await user.click(screen.getByRole("button", { name: "Start a Drill" }))

    expect(startDrillMock).toHaveBeenCalledWith(
      expect.objectContaining({
        selection: "manual",
        questionCount: 1,
        questionIds: ["q-1"],
        title: "1 Question from PT 158",
      }),
    )
  })

  it("restores Question Mix as Priority mix even when manual picks were saved", () => {
    writeSavedDrillConfig("LR", {
      ...savedLrConfig,
      customize: true,
      selection: "manual",
      manualQuestionIds: ["q-1"],
      manualPrepTestNumbers: [158],
    })
    renderForm()

    expect(screen.getByRole("switch", { name: "Build My Own" })).toBeChecked()
    expect(screen.getByRole("button", { name: "Question Mix" })).toHaveTextContent("Priority mix")
  })
})
