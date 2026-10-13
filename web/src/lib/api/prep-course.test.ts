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
        hydratedModuleIds: ["m1"],
        moduleStats: [{ moduleId: "m1", lessonCount: 1, totalMinutes: 5 }],
      },
      error: null,
    })
    const api = createPrepCourseApi(mockSupabase(invoke))

    const out = await api.getCourse("prep-course", { hydrate: "first" })

    expect(invoke).toHaveBeenCalledWith("prep-course?courseSlug=prep-course&hydrate=first", {
      method: "GET",
      headers: { Authorization: "Bearer token-1" },
    })
    expect(out.course.slug).toBe("prep-course")
    expect(out.lessons).toHaveLength(1)
    expect(out.completedLessonSlugs).toEqual(["intro"])
    expect(out.hydratedModuleIds).toEqual(["m1"])
  })

  it("getCourse dedupes concurrent identical requests", async () => {
    type InvokeResult = { data: unknown; error: null }
    let resolveInvoke!: (value: InvokeResult) => void
    const invoke = vi.fn().mockImplementation(
      () =>
        new Promise<InvokeResult>((resolve) => {
          resolveInvoke = resolve
        }),
    )
    const api = createPrepCourseApi(mockSupabase(invoke))

    const p1 = api.getCourse("prep-course", { hydrate: "first" })
    const p2 = api.getCourse("prep-course", { hydrate: "first" })

    // Allow getSession microtasks to flush so invoke is scheduled once.
    await Promise.resolve()
    await Promise.resolve()
    expect(invoke).toHaveBeenCalledTimes(1)

    resolveInvoke({
      data: {
        course: { id: "c1", slug: "prep-course" },
        lessons: [],
      },
      error: null,
    })
    const [a, b] = await Promise.all([p1, p2])
    expect(a.course.id).toBe("c1")
    expect(b.course.id).toBe("c1")
    expect(invoke).toHaveBeenCalledTimes(1)
  })

  it("setModuleBookmark POSTs bookmarkModuleId", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { bookmarks: { moduleIds: ["m1"], lessonSlugs: [] } },
      error: null,
    })
    const api = createPrepCourseApi(mockSupabase(invoke))

    const out = await api.setModuleBookmark("prep-course", "m1", true)

    expect(invoke).toHaveBeenCalledWith("prep-course", {
      method: "POST",
      body: { courseSlug: "prep-course", bookmarkModuleId: "m1", bookmarked: true },
      headers: { Authorization: "Bearer token-1" },
    })
    expect(out.bookmarks.moduleIds).toEqual(["m1"])
  })

  it("setLessonBookmark POSTs bookmarkLessonSlug", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { bookmarks: { moduleIds: [], lessonSlugs: ["intro"] } },
      error: null,
    })
    const api = createPrepCourseApi(mockSupabase(invoke))

    const out = await api.setLessonBookmark("prep-course", "intro", true)

    expect(invoke).toHaveBeenCalledWith("prep-course", {
      method: "POST",
      body: { courseSlug: "prep-course", bookmarkLessonSlug: "intro", bookmarked: true },
      headers: { Authorization: "Bearer token-1" },
    })
    expect(out.bookmarks.lessonSlugs).toEqual(["intro"])
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
