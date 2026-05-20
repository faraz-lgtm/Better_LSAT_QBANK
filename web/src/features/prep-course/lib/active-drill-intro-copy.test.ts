import { describe, expect, it } from "vitest"

import { activeDrillIntroCopy } from "@/features/prep-course/lib/active-drill-intro-copy"
import type { PrepLesson } from "@/lib/api/prep-course"

function lesson(overrides: Partial<PrepLesson> = {}): PrepLesson {
  return {
    id: "l1",
    course_id: "c1",
    slug: "drill",
    title: "Drill",
    lesson_type: "active_drill",
    sort_order: 1,
    summary: null,
    duration_minutes: 0,
    video_url: null,
    text_content: null,
    is_published: true,
    created_at: "",
    updated_at: "",
    ...overrides,
  }
}

describe("activeDrillIntroCopy", () => {
  it("prefers lesson summary when not a PT reference", () => {
    expect(activeDrillIntroCopy(lesson({ summary: "Short intro." }))).toBe("Short intro.")
  })

  it("uses default copy when summary is a PT reference", () => {
    expect(
      activeDrillIntroCopy(
        lesson({ summary: "This Active Drill will be PT133.S2.Q5. This is a principle question." }),
      ),
    ).toContain("Work through this LSAT question")
  })

  it("uses text before The Question marker", () => {
    expect(
      activeDrillIntroCopy(
        lesson({
          text_content:
            "<p>This Active Drill will be PT102.S2.Q1.</p><p>The Question:</p><p>Stem here</p>",
        }),
      ),
    ).toContain("PT102.S2.Q1")
    expect(activeDrillIntroCopy(lesson({ text_content: "<p>The Question:</p><p>Stem</p>" }))).not.toContain("Stem")
  })

  it("falls back to default copy", () => {
    expect(activeDrillIntroCopy(lesson())).toContain("Work through this LSAT question")
  })
})
