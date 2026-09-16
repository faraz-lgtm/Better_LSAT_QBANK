import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PrepCourseLessonPanel } from "@/features/prep-course/components/prep-course-lesson-panel"
import type { PrepCourse, PrepLesson } from "@/lib/api/prep-course"

const course: PrepCourse = {
  id: "c1",
  slug: "core",
  title: "LSAT Essentials Course",
  description: null,
  is_published: true,
  created_at: "",
  updated_at: "",
}

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
  text_content: "<p>The Question:</p><p>Hidden until complete.</p>",
  is_published: true,
  created_at: "",
  updated_at: "",
}

describe("PrepCourseLessonPanel active drill intro", () => {
  it("keeps the current lesson screen instead of replacing it with the start overlay", () => {
    render(
      <PrepCourseLessonPanel
        course={course}
        lesson={lesson}
        inLessonCard
        moduleLessonLine="Module 1 · Lesson 3 of 14"
        lessonSequence={{ current: 2, total: 14 }}
        sectionSubtitle="Let's Dive In! Module"
        onStartDrill={() => {}}
      />,
    )

    expect(screen.getByText("Module 1 · Lesson 3 of 14")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Active Drill - Motivational Posters" })).toBeInTheDocument()
    expect(screen.getByText("Hidden until complete.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Start Active Drill" })).not.toBeInTheDocument()
  })

  it("starts from the current lesson Start button", async () => {
    const user = userEvent.setup()
    const onStartDrill = vi.fn()
    render(
      <PrepCourseLessonPanel
        course={course}
        lesson={lesson}
        inLessonCard
        onStartDrill={onStartDrill}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Start" }))
    expect(onStartDrill).toHaveBeenCalledTimes(1)
  })
})
