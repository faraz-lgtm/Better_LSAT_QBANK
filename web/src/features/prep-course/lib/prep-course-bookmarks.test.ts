import { describe, expect, it } from "vitest"

import {
  loadPrepCourseBookmarks,
  moduleMatchesBookmarkFilter,
  savePrepCourseBookmarks,
} from "@/features/prep-course/lib/prep-course-bookmarks"
import type { PrepCourseModule } from "@/lib/api/prep-course"

const moduleOne: PrepCourseModule = {
  id: "m1",
  course_id: "c1",
  title: "Module One",
  sort_order: 1,
  duration_minutes: null,
  sections: [
    {
      id: "s1",
      module_id: "m1",
      title: "Section",
      sort_order: 1,
      duration_minutes: null,
      lessons: [
        {
          id: "l1",
          course_id: "c1",
          slug: "lesson-a",
          title: "Lesson A",
          lesson_type: "video",
          sort_order: 1,
          summary: null,
          duration_minutes: 5,
          video_url: "https://example.com/v.mp4",
          text_content: null,
          is_published: true,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ],
    },
  ],
}

describe("prep-course-bookmarks", () => {
  it("persists module and lesson bookmarks in localStorage", () => {
    savePrepCourseBookmarks("c1", { moduleIds: ["m1"], lessonSlugs: ["lesson-b"] })
    expect(loadPrepCourseBookmarks("c1")).toEqual({ moduleIds: ["m1"], lessonSlugs: ["lesson-b"] })
  })

  it("matches module by module id or bookmarked lesson slug", () => {
    expect(moduleMatchesBookmarkFilter(moduleOne, { moduleIds: ["m1"], lessonSlugs: [] })).toBe(true)
    expect(moduleMatchesBookmarkFilter(moduleOne, { moduleIds: [], lessonSlugs: ["lesson-a"] })).toBe(true)
    expect(moduleMatchesBookmarkFilter(moduleOne, { moduleIds: [], lessonSlugs: ["other"] })).toBe(false)
  })
})
