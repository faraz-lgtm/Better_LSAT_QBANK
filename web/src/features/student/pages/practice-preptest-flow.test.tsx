import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

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

function renderPrepTestRoutes(initialPath: string) {
  const router = createMemoryRouter(
    [
      { path: "/app/practice/preptest/:testId", element: <PracticePrepTestPage /> },
      {
        path: "/app/practice/preptest/:testId/section/:sectionId",
        element: <div>Section intro</div>,
      },
      { path: "/app/practice/sections/session/:sessionId", element: <div>Section session</div> },
    ],
    { initialEntries: [initialPath] },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe("PracticePrepTestPage + section navigation", () => {
  it("shows hub content and navigates to section session on Start section", async () => {
    mockGetPrepTestDetail.mockResolvedValue(mockDetail)
    mockStartPrepTest.mockResolvedValue({ prepTestSession: { id: "pt-sess" }, detail: mockDetail })
    mockStartSection.mockResolvedValue({ session: { id: "section-sess-1" } })

    const user = userEvent.setup()
    const router = renderPrepTestRoutes("/app/practice/preptest/pt-900")

    expect(await screen.findByRole("heading", { name: /Ready to begin your test/i })).toBeInTheDocument()
    expect(within(screen.getByRole("main")).getByText("PT 900")).toBeInTheDocument()
    expect(screen.getByText("Control your practice pace")).toBeInTheDocument()
    expect(screen.getByText("Select format")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Test Section" })).toBeInTheDocument()
    expect(screen.getByText("Section 1")).toBeInTheDocument()
    expect(screen.getByText("35:00")).toBeInTheDocument()
    expect(screen.getByText("3 Questions")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Start Section/i }))

    expect(mockStartSection).toHaveBeenCalledWith(
      expect.objectContaining({ sectionId: "sec-lr", timing: "35" }),
    )
    expect(router.state.location.pathname).toBe("/app/practice/preptest/pt-900/section/sec-lr")
    expect(router.state.location.search).toBe("?sessionId=section-sess-1")
  })
})
