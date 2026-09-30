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
  it("shows shared intro copy without unlocking lesson body HTML", () => {
    render(<ActiveDrillIntroCard lesson={lesson} hideTitle onStartDrill={() => {}} />)

    expect(
      screen.getByText("Work through this LSAT question with the concepts you've learned so far."),
    ).toBeInTheDocument()
    expect(screen.queryByText("Stimulus Analysis")).not.toBeInTheDocument()
    expect(screen.queryByText("Hidden until complete.")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Start Active Drill" })).toBeInTheDocument()
  })

  it("starts from Start Active Drill", async () => {
    const user = userEvent.setup()
    const onStartDrill = vi.fn()
    render(<ActiveDrillIntroCard lesson={lesson} hideTitle onStartDrill={onStartDrill} />)

    await user.click(screen.getByRole("button", { name: "Start Active Drill" }))
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
