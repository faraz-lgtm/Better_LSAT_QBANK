import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ActiveDrillIntroCard } from "@/features/prep-course/components/active-drill/active-drill-intro-card"
import type { PrepLesson } from "@/lib/api/prep-course"

const lesson: PrepLesson = {
  id: "l1",
  course_id: "c1",
  slug: "active-drill-1",
  title: "Active Drill - Motivational Posters",
  lesson_type: "active_drill",
  sort_order: 1,
  summary: "Work through this LSAT question with the concepts you've learned so far.",
  duration_minutes: 7,
  video_url: null,
  text_content: "<p>The Question:</p><h3>Stimulus Analysis</h3><p>Hidden until complete.</p>",
  is_published: true,
  created_at: "",
  updated_at: "",
}

describe("ActiveDrillIntroCard", () => {
  it("keeps the current lesson body and Start CTA", () => {
    render(<ActiveDrillIntroCard lesson={lesson} hideTitle onStartDrill={() => {}} />)

    expect(screen.getByText("Stimulus Analysis")).toBeInTheDocument()
    expect(screen.getByText("Hidden until complete.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Start Active Drill" })).not.toBeInTheDocument()
  })

  it("starts from the current lesson Start button", async () => {
    const user = userEvent.setup()
    const onStartDrill = vi.fn()
    render(<ActiveDrillIntroCard lesson={lesson} hideTitle onStartDrill={onStartDrill} />)

    await user.click(screen.getByRole("button", { name: "Start" }))
    expect(onStartDrill).toHaveBeenCalledTimes(1)
  })

  it("shows starting and error states", () => {
    const { rerender } = render(
      <ActiveDrillIntroCard lesson={lesson} hideTitle onStartDrill={() => {}} startingDrill />,
    )
    expect(screen.getByRole("button", { name: "Starting…" })).toBeDisabled()

    rerender(
      <ActiveDrillIntroCard
        lesson={lesson}
        hideTitle
        onStartDrill={() => {}}
        drillStartError="Could not start drill"
      />,
    )
    expect(screen.getByRole("alert")).toHaveTextContent("Could not start drill")
  })
})
