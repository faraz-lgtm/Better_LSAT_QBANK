import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ActiveDrillStartScreen } from "@/features/prep-course/components/active-drill/active-drill-start-screen"
import type { PrepLesson } from "@/lib/api/prep-course"

const lesson: PrepLesson = {
  id: "l1",
  course_id: "c1",
  slug: "active-drill-motivational-posters",
  title: "Active Drill - Motivational Posters",
  lesson_type: "active_drill",
  sort_order: 3,
  summary: "Work through this LSAT question with the concepts you've learned so far.",
  duration_minutes: 7,
  video_url: null,
  text_content: "<p>The Question:</p><h3>Stimulus Analysis</h3><p>Hidden until complete.</p>",
  is_published: true,
  created_at: "",
  updated_at: "",
}

describe("ActiveDrillStartScreen", () => {
  it("renders the Figma pre-test screen without lesson analysis HTML", () => {
    render(
      <ActiveDrillStartScreen
        lesson={lesson}
        moduleLessonLine="Module 1 · Lesson 3 of 14"
        sectionSubtitle="Let's Dive In! Module"
        lessonSequence={{ current: 2, total: 14 }}
        onStartDrill={() => {}}
      />,
    )

    expect(screen.getByText("Module 1 · Lesson 3 of 14")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Active Drill - Motivational Posters" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Active Drill - Motivational Posters" })).toHaveClass("text-[24px]")
    expect(screen.getByText("Let's Dive In! Module")).toBeInTheDocument()
    expect(screen.getByText("7 min read · no video")).toBeInTheDocument()
    expect(screen.getByText("2 / 14")).toBeInTheDocument()
    expect(
      screen.getByText("Work through this LSAT question with the concepts you've learned so far."),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Start Active Drill" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Start Active Drill" }).querySelector("img")).toHaveAttribute(
      "src",
      "/figma/active-drill/chevron-right.svg",
    )
    expect(screen.getByRole("button", { name: "Save lesson" }).querySelector("img")).toHaveAttribute(
      "src",
      "/figma/active-drill/bookmark.svg",
    )
    expect(screen.queryByText("Stimulus Analysis")).not.toBeInTheDocument()
    expect(screen.queryByText("Hidden until complete.")).not.toBeInTheDocument()
  })

  it("starts the linked question from Start Active Drill", async () => {
    const user = userEvent.setup()
    const onStartDrill = vi.fn()
    render(<ActiveDrillStartScreen lesson={lesson} onStartDrill={onStartDrill} />)

    await user.click(screen.getByRole("button", { name: "Start Active Drill" }))
    expect(onStartDrill).toHaveBeenCalledTimes(1)
  })

  it("shows starting and error states", () => {
    const { rerender } = render(
      <ActiveDrillStartScreen lesson={lesson} onStartDrill={() => {}} startingDrill />,
    )
    expect(screen.getByRole("button", { name: "Starting…" })).toBeDisabled()

    rerender(
      <ActiveDrillStartScreen lesson={lesson} onStartDrill={() => {}} drillStartError="Could not start drill" />,
    )
    expect(screen.getByRole("alert")).toHaveTextContent("Could not start drill")
  })
})
