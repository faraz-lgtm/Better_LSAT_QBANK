import { describe, expect, it } from "vitest"

import { isPrepCourseLessonRoute } from "@/features/app-shell/prep-course-lesson-route"

describe("isPrepCourseLessonRoute", () => {
  it("matches lesson and lesson start paths", () => {
    expect(isPrepCourseLessonRoute("/app/prep-course/essentials/intro-to-lr")).toBe(true)
    expect(isPrepCourseLessonRoute("/app/prep-course/essentials/intro-to-lr/start")).toBe(true)
  })

  it("does not match list or course hub paths", () => {
    expect(isPrepCourseLessonRoute("/app/prep-course")).toBe(false)
    expect(isPrepCourseLessonRoute("/app/prep-course/essentials")).toBe(false)
    expect(isPrepCourseLessonRoute("/app/practice/drills")).toBe(false)
  })
})
