import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PracticePrepTestPage } from "@/features/student/pages/practice-preptest-page"

const mockGetPrepTestDetail = vi.fn()
const mockStartPrepTest = vi.fn()
const mockStartSection = vi.fn()

vi.mock("@/lib/api/practice", () => ({
  createPracticeApi: () => ({
    getPrepTestDetail: mockGetPrepTestDetail,
    startPrepTest: mockStartPrepTest,
    startSection: mockStartSection,
    completePrepTest: vi.fn(),
  }),
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

const mockDetail = {
  prepTest: {
    id: "pt-900",
    moduleId: "LSAC900",
    title: "PrepTest Alpha",
    prepTestNumber: "900",
    label: "PT 900",
    questionCount: 5,
    totalMinutes: 70,
    sectionCount: 3,
    practiceableSectionCount: 2,
  },
  sections: [
    {
      id: "sec-lr",
      sectionId: "SEED900-LR-1",
      sectionNumber: 1,
      sectionType: "LR" as const,
      title: "Logical Reasoning",
      questionCount: 3,
      timeMinutes: 35,
      practiceable: true,
      unlocked: true,
      onBreak: false,
      answeredCount: 0,
      completed: false,
      activeSectionSessionId: null,
    },
  ],
  sectionBreak: null,
  prepTestSession: null,
  status: "fresh" as const,
  allPracticeableSectionsComplete: false,
  timingOptions: [{ id: "standard", label: "Standard" }],
  formatOptions: [{ id: "four", label: "4 sections" }],
  defaultTimingId: "standard",
  defaultFormatId: "four",
}

function renderPrepTestRoutes(
  initialEntry:
    | string
    | {
        pathname: string
        state?: Record<string, unknown>
      },
) {
  const router = createMemoryRouter(
    [
      { path: "/app/preptest/:testId", element: <PracticePrepTestPage /> },
      {
        path: "/app/preptest/:testId/section/:sectionId",
        element: <div>Section intro</div>,
      },
      { path: "/app/practice/sections/session/:sessionId", element: <div>Section session</div> },
    ],
    { initialEntries: [initialEntry] },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe("PracticePrepTestPage + section navigation", () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it("shows hub content and navigates to section session on Start section", async () => {
    mockGetPrepTestDetail.mockResolvedValue(mockDetail)
    mockStartPrepTest.mockResolvedValue({ prepTestSession: { id: "pt-sess" }, detail: mockDetail })
    mockStartSection.mockResolvedValue({ session: { id: "section-sess-1" } })

    const user = userEvent.setup()
    const router = renderPrepTestRoutes("/app/preptest/pt-900")

    expect(await screen.findByText(/Ready to begin your test/i)).toBeInTheDocument()
    expect(within(screen.getByRole("main")).getByText("PT 900")).toBeInTheDocument()
    expect(screen.getByText("Control your Prep pace")).toBeInTheDocument()
    expect(screen.getByText("Select Format")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Test Section" })).toBeInTheDocument()
    expect(screen.getByText("Section 1")).toBeInTheDocument()
    expect(screen.getByText("35:00")).toBeInTheDocument()
    expect(screen.getByText("3 Questions")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Start Section/i }))

    expect(mockStartSection).toHaveBeenCalledWith(
      expect.objectContaining({ sectionId: "sec-lr", timing: "standard" }),
    )
    expect(router.state.location.pathname).toBe("/app/practice/sections/session/section-sess-1")
    expect(router.state.location.search).toBe("?prepTestId=pt-900")
  })

  it("shows only the first unlocked section during retake, same as a fresh attempt", async () => {
    mockGetPrepTestDetail.mockResolvedValue({
      ...mockDetail,
      sections: [
        { ...mockDetail.sections[0], unlocked: true, completed: false },
        {
          id: "sec-rc",
          sectionId: "SEED900-RC-1",
          sectionNumber: 2,
          sectionType: "RC" as const,
          title: "Reading Comprehension",
          questionCount: 2,
          timeMinutes: 35,
          practiceable: true,
          unlocked: false,
          onBreak: false,
          answeredCount: 0,
          completed: false,
          activeSectionSessionId: null,
        },
      ],
    })

    renderPrepTestRoutes("/app/preptest/pt-900?retake=1")

    await screen.findByRole("heading", { name: "Test Section" })
    expect(screen.getAllByRole("button", { name: /Start Section/i })).toHaveLength(1)
    expect(screen.queryByRole("button", { name: /Continue Section/i })).not.toBeInTheDocument()
  })

  it("navigates to the section intro during retake", async () => {
    mockGetPrepTestDetail.mockResolvedValue(mockDetail)
    mockStartPrepTest.mockResolvedValue({ prepTestSession: { id: "pt-sess" }, detail: mockDetail })
    mockStartSection.mockResolvedValue({ session: { id: "section-sess-1" } })

    const user = userEvent.setup()
    const router = renderPrepTestRoutes("/app/preptest/pt-900?retake=1")

    await screen.findByRole("button", { name: /Start Section/i })
    await user.click(screen.getByRole("button", { name: /Start Section/i }))

    expect(router.state.location.pathname).toBe("/app/practice/sections/session/section-sess-1")
    expect(router.state.location.search).toBe("?prepTestId=pt-900&retake=1")
  })

  it("hides the action button on completed sections during an in-progress attempt", async () => {
    mockGetPrepTestDetail.mockResolvedValue({
      ...mockDetail,
      sections: [
        {
          ...mockDetail.sections[0],
          completed: true,
          answeredCount: 3,
          activeSectionSessionId: null,
        },
        {
          id: "sec-rc",
          sectionId: "SEED900-RC-1",
          sectionNumber: 2,
          sectionType: "RC" as const,
          title: "Reading Comprehension",
          questionCount: 2,
          timeMinutes: 35,
          practiceable: true,
          unlocked: true,
          onBreak: false,
          answeredCount: 0,
          completed: false,
          activeSectionSessionId: null,
        },
      ],
    })

    renderPrepTestRoutes("/app/preptest/pt-900")

    await screen.findByRole("heading", { name: "Test Section" })
    expect(screen.getAllByRole("button", { name: /Start Section/i })).toHaveLength(1)
  })

  it("does not show a button on locked sections during a normal attempt", async () => {
    mockGetPrepTestDetail.mockResolvedValue({
      ...mockDetail,
      sections: [
        { ...mockDetail.sections[0], unlocked: true, completed: false },
        {
          id: "sec-rc",
          sectionId: "SEED900-RC-1",
          sectionNumber: 2,
          sectionType: "RC" as const,
          title: "Reading Comprehension",
          questionCount: 2,
          timeMinutes: 35,
          practiceable: true,
          unlocked: false,
          onBreak: false,
          answeredCount: 0,
          completed: false,
          activeSectionSessionId: null,
        },
      ],
    })

    renderPrepTestRoutes("/app/preptest/pt-900")

    await screen.findByRole("heading", { name: "Test Section" })
    expect(screen.getAllByRole("button", { name: /Start Section/i })).toHaveLength(1)
  })

  it("shows Continue Section when the open session has answers", async () => {
    mockGetPrepTestDetail.mockResolvedValue({
      ...mockDetail,
      sections: [
        {
          ...mockDetail.sections[0],
          activeSectionSessionId: "in-progress-sess",
          answeredCount: 2,
        },
      ],
    })

    renderPrepTestRoutes("/app/preptest/pt-900")

    expect(await screen.findByRole("button", { name: /Continue Section/i })).toBeInTheDocument()
  })

  it("shows Continue Section after exit when a section session exists without answers", async () => {
    mockGetPrepTestDetail.mockResolvedValue({
      ...mockDetail,
      sections: [
        {
          ...mockDetail.sections[0],
          activeSectionSessionId: "exited-sess",
          answeredCount: 0,
        },
      ],
    })

    renderPrepTestRoutes("/app/preptest/pt-900")

    expect(await screen.findByRole("button", { name: /Continue Section/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Start Section/i })).not.toBeInTheDocument()
  })

  it("hides timing and format selectors after the first section has started", async () => {
    mockGetPrepTestDetail.mockResolvedValue({
      ...mockDetail,
      prepTestSession: { id: "pt-sess", metadata: { timing: "standard", format: "four" } },
      sections: [
        {
          ...mockDetail.sections[0],
          activeSectionSessionId: "in-progress-sess",
          answeredCount: 1,
        },
      ],
    })

    renderPrepTestRoutes("/app/preptest/pt-900")

    await screen.findByRole("heading", { name: "Test Section" })
    expect(screen.getByText("Continue your PT 900 test")).toBeInTheDocument()
    expect(screen.queryByText(/Ready to begin your test/i)).not.toBeInTheDocument()
    expect(within(screen.getByRole("main")).queryByText("PT 900")).not.toBeInTheDocument()
    expect(screen.queryByText("Control your Prep pace")).not.toBeInTheDocument()
    expect(screen.queryByText("Select Format")).not.toBeInTheDocument()
  })

  it("hides timing and format selectors when returning after completing the first section", async () => {
    mockGetPrepTestDetail.mockResolvedValue({
      ...mockDetail,
      prepTestSession: { id: "pt-sess", metadata: { timing: "unlimited", format: "four" } },
      sections: [
        {
          ...mockDetail.sections[0],
          completed: true,
          answeredCount: 3,
          activeSectionSessionId: null,
        },
        {
          id: "sec-rc",
          sectionId: "SEED900-RC-1",
          sectionNumber: 2,
          sectionType: "RC" as const,
          title: "Reading Comprehension",
          questionCount: 2,
          timeMinutes: 35,
          practiceable: true,
          unlocked: true,
          onBreak: false,
          answeredCount: 0,
          completed: false,
          activeSectionSessionId: null,
        },
      ],
    })

    renderPrepTestRoutes("/app/preptest/pt-900")

    await screen.findByRole("heading", { name: "Test Section" })
    expect(screen.getByText("Continue your PT 900 test")).toBeInTheDocument()
    expect(screen.queryByText(/Ready to begin your test/i)).not.toBeInTheDocument()
    expect(within(screen.getByRole("main")).queryByText("PT 900")).not.toBeInTheDocument()
    expect(screen.queryByText("Control your Prep pace")).not.toBeInTheDocument()
    expect(screen.queryByText("Select Format")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Start Section/i })).toBeInTheDocument()
  })

  it("hides timing and format selectors when only a later section is unlocked", async () => {
    mockGetPrepTestDetail.mockResolvedValue({
      ...mockDetail,
      sections: [
        {
          ...mockDetail.sections[0],
          completed: true,
          answeredCount: 3,
          activeSectionSessionId: null,
        },
        {
          id: "sec-rc",
          sectionId: "SEED900-RC-1",
          sectionNumber: 2,
          sectionType: "RC" as const,
          title: "Reading Comprehension",
          questionCount: 2,
          timeMinutes: 35,
          practiceable: true,
          unlocked: true,
          onBreak: false,
          answeredCount: 0,
          completed: false,
          activeSectionSessionId: "section-sess-2",
        },
      ],
    })

    renderPrepTestRoutes("/app/preptest/pt-900")

    await screen.findByRole("button", { name: /Continue Section/i })
    expect(screen.queryByText("Control your Prep pace")).not.toBeInTheDocument()
    expect(screen.queryByText("Select Format")).not.toBeInTheDocument()
  })
})
