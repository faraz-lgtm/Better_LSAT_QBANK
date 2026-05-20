import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"
import { createPrepCourseApi } from "./prep-course"

function mockSupabase(functionsInvoke: ReturnType<typeof vi.fn>, accessToken = "token-1"): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: accessToken ? { access_token: accessToken } : null },
      }),
    },
    functions: {
      invoke: functionsInvoke,
    },
  } as unknown as SupabaseClient
}

describe("createPrepCourseApi", () => {
  it("listCourses invokes prep-course with auth header", async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { courses: [] }, error: null })
    const api = createPrepCourseApi(mockSupabase(invoke))

    await api.listCourses()

    expect(invoke).toHaveBeenCalledWith("prep-course", {
      method: "GET",
      headers: { Authorization: "Bearer token-1" },
    })
  })

  it("getCourse returns course with lessons", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        course: { id: "c1", slug: "prep-course" },
        lessons: [{ id: "l1", slug: "intro" }],
        completedLessonSlugs: ["intro"],
      },
      error: null,
    })
    const api = createPrepCourseApi(mockSupabase(invoke))

    const out = await api.getCourse("prep-course")

    expect(out.course.slug).toBe("prep-course")
    expect(out.lessons).toHaveLength(1)
    expect(out.completedLessonSlugs).toEqual(["intro"])
  })

  it("getLesson returns linked refs and drill attempt", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        course: { id: "c1", slug: "prep-course" },
        lesson: { id: "l1", slug: "drill", lesson_type: "active_drill" },
        linkedQuestionRefs: [{ question_id: "q1", question_number: 1 }],
        activeDrillAttempt: null,
      },
      error: null,
    })
    const api = createPrepCourseApi(mockSupabase(invoke))

    const out = await api.getLesson("prep-course", "drill")

    expect(out.linkedQuestionRefs).toHaveLength(1)
    expect(out.activeDrillAttempt).toBeNull()
  })

  it("completeLesson POSTs courseSlug and lessonSlug", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { completedLessonSlugs: ["intro", "lesson-2"] },
      error: null,
    })
    const api = createPrepCourseApi(mockSupabase(invoke))

    const out = await api.completeLesson("prep-course", "lesson-2")

    expect(invoke).toHaveBeenCalledWith("prep-course", {
      method: "POST",
      body: { courseSlug: "prep-course", lessonSlug: "lesson-2" },
      headers: { Authorization: "Bearer token-1" },
    })
    expect(out.completedLessonSlugs).toEqual(["intro", "lesson-2"])
  })
})
