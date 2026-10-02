import { describe, expect, it } from "vitest"

import {
  activeDrillStartMetaLine,
  activeDrillStartPath,
  resolveLessonDrillStartAction,
  startLessonDrillRequest,
} from "@/features/prep-course/lib/start-lesson-drill-request"
import type { PrepLesson, PrepLessonLinkedQuestionRef } from "@/lib/api/prep-course"

const lesson: PrepLesson = {
  id: "lesson-1",
  course_id: "c1",
  slug: "active-drill-1",
  title: "Active Drill - Motivational Posters",
  lesson_type: "active_drill",
  sort_order: 1,
  summary: null,
  duration_minutes: 7,
  video_url: null,
  text_content: null,
  is_published: true,
  created_at: "",
  updated_at: "",
}

const linked: PrepLessonLinkedQuestionRef = {
  question_id: "q-linked",
  question_number: 5,
  prep_test_module_id: "LSAC133",
  prep_test_title: null,
  section_number: 2,
  section_type: "LR",
  section_title: null,
}

describe("startLessonDrillRequest", () => {
  it("starts an active drill on the linked question", () => {
    expect(startLessonDrillRequest(lesson, [linked])).toEqual({
      lessonId: "lesson-1",
      questionId: "q-linked",
    })
  })

  it("omits questionId for smart drills", () => {
    expect(
      startLessonDrillRequest({ ...lesson, lesson_type: "adaptive_drill" }, [linked]),
    ).toEqual({ lessonId: "lesson-1" })
  })

  it("opens a start screen before the linked-question session", () => {
    expect(resolveLessonDrillStartAction(lesson, false)).toBe("open-start-screen")
    expect(resolveLessonDrillStartAction(lesson, true)).toBe("start-session")
    expect(resolveLessonDrillStartAction({ ...lesson, lesson_type: "adaptive_drill" }, false)).toBe(
      "start-session",
    )
    expect(activeDrillStartPath("core", "active-drill-1")).toBe(
      "/app/prep-course/core/active-drill-1/start",
    )
  })

  it("formats Figma duration metadata", () => {
    expect(activeDrillStartMetaLine(lesson)).toBe("7 min read · no video")
    expect(activeDrillStartMetaLine({ ...lesson, duration_minutes: 0, video_url: "https://v" })).toBe("video")
  })
})
