import { describe, expect, it } from "vitest"

import {
  countCompletedLessons,
  curriculumStats,
  findLessonLocation,
  lessonProgressPercent,
  normalizeCurriculum,
  shouldFlattenModuleSections,
} from "./prep-course-format"
import type { PrepLesson } from "@/lib/api/prep-course"

const baseLesson: PrepLesson = {
  id: "l1",
  course_id: "c1",
  slug: "intro",
  title: "Intro",
  lesson_type: "video",
  sort_order: 1,
  summary: null,
  duration_minutes: 10,
  video_url: null,
  text_content: null,
  is_published: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

describe("prep-course-format curriculum helpers", () => {
  it("normalizeCurriculum builds fallback module when empty", () => {
    const out = normalizeCurriculum(undefined, [baseLesson], "c1")
    expect(out.modules).toHaveLength(1)
    expect(out.modules[0]?.sections[0]?.lessons[0]?.slug).toBe("intro")
  })

  it("curriculumStats aggregates counts", () => {
    const stats = curriculumStats(
      normalizeCurriculum(undefined, [baseLesson, { ...baseLesson, id: "l2", slug: "two", sort_order: 2 }], "c1"),
    )
    expect(stats.moduleCount).toBe(1)
    expect(stats.lessonCount).toBe(2)
    expect(stats.totalMinutes).toBe(20)
  })

  it("findLessonLocation returns module and section ids", () => {
    const curriculum = normalizeCurriculum(undefined, [baseLesson], "c1")
    const loc = findLessonLocation(curriculum, "intro")
    expect(loc?.moduleId).toBe("fallback-module")
    expect(loc?.sectionId).toBe("fallback-section")
  })

  it("shouldFlattenModuleSections hides default General wrapper", () => {
    const curriculum = normalizeCurriculum(undefined, [baseLesson], "c1")
    expect(shouldFlattenModuleSections(curriculum.modules[0]!)).toBe(true)
    expect(
      shouldFlattenModuleSections({
        id: "m1",
        course_id: "c1",
        title: "Prep Course",
        sort_order: 1,
        duration_minutes: null,
        sections: [
          {
            id: "s1",
            module_id: "m1",
            title: "Introduction",
            sort_order: 1,
            duration_minutes: null,
            lessons: [baseLesson],
          },
          {
            id: "s2",
            module_id: "m1",
            title: "Advanced",
            sort_order: 2,
            duration_minutes: null,
            lessons: [],
          },
        ],
      }),
    ).toBe(false)
  })

  it("countCompletedLessons and lessonProgressPercent", () => {
    const lessons = [baseLesson, { ...baseLesson, id: "l2", slug: "two" }]
    expect(countCompletedLessons(lessons, ["intro"])).toBe(1)
    expect(lessonProgressPercent(1, 2)).toBe(50)
    expect(lessonProgressPercent(0, 0)).toBe(0)
  })
})
