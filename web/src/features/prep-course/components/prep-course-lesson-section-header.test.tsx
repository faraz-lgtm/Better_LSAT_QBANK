import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PrepCourseLessonSectionHeader } from "@/features/prep-course/components/prep-course-lesson-section-header"

describe("PrepCourseLessonSectionHeader", () => {
  it("uses Figma 24px heading type and top-aligns Save lesson", () => {
    render(
      <PrepCourseLessonSectionHeader
        title="Active Drill: St. Patrick's Day Carnations"
        moduleLessonLine="Module 2 · Lesson 14 of 25"
        subtitle="The Anatomy of an Argument"
        rightMeta="no video"
        lessonSequence={{ current: 14, total: 25 }}
      />,
    )

    const heading = screen.getByRole("heading", { level: 2, name: "Active Drill: St. Patrick's Day Carnations" })
    expect(heading).toHaveClass("text-[24px]", "font-bold", "leading-[1.3]")
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument()
    expect(screen.getByText("The Anatomy of an Argument")).toHaveClass("text-[14px]")
    expect(screen.getByText("Module 2 · Lesson 14 of 25")).toHaveClass("text-[12px]")
    expect(heading.parentElement).toHaveClass("flex-1")
    expect(heading.parentElement?.parentElement).toHaveClass("items-start")
  })
})
