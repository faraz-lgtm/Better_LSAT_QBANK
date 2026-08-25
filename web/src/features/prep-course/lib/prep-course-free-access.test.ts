import { describe, expect, it } from "vitest"

import {
  canAccessPrepCourseModule,
  isFreePrepCourseModule,
  isFreePrepCourseSlug,
  isPrepCourseLessonLockedForFreePlan,
  isPrepCourseModuleLockedForFreePlan,
  shouldLimitFreePrepCourseAccess,
} from "./prep-course-free-access"
import { PREP_COURSE_ESSENTIALS_SLUG } from "./prep-course-nav"
import type { PrepCourseCurriculum } from "@/lib/api/prep-course"

const kickoff = { title: "The Kickoff", sort_order: 1 }
const anatomy = { title: "The Anatomy of an Argument", sort_order: 2 }

function essentialsCurriculum(): PrepCourseCurriculum {
  return {
    modules: [
      {
        id: "kickoff",
        course_id: "c1",
        title: "The Kickoff",
        sort_order: 1,
        duration_minutes: null,
        sections: [
          {
            id: "s1",
            module_id: "kickoff",
            title: "General",
            sort_order: 1,
            duration_minutes: null,
            lessons: [
              {
                id: "l1",
                course_id: "c1",
                slug: "welcome-to-the-arena",
                title: "Welcome to the Arena",
                lesson_type: "video_text",
                sort_order: 1,
                summary: null,
                duration_minutes: 1,
                video_url: null,
                text_content: null,
                is_published: true,
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-01T00:00:00Z",
              },
            ],
          },
        ],
      },
      {
        id: "anatomy",
        course_id: "c1",
        title: "The Anatomy of an Argument",
        sort_order: 2,
        duration_minutes: null,
        sections: [
          {
            id: "s2",
            module_id: "anatomy",
            title: "General",
            sort_order: 1,
            duration_minutes: null,
            lessons: [
              {
                id: "l2",
                course_id: "c1",
                slug: "argument-basics",
                title: "Argument Basics",
                lesson_type: "video_text",
                sort_order: 1,
                summary: null,
                duration_minutes: 5,
                video_url: null,
                text_content: null,
                is_published: true,
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-01T00:00:00Z",
              },
            ],
          },
        ],
      },
    ],
  }
}

describe("prep-course free access", () => {
  it("identifies the LSAT Essential Course slug", () => {
    expect(isFreePrepCourseSlug(PREP_COURSE_ESSENTIALS_SLUG)).toBe(true)
    expect(isFreePrepCourseSlug("lr-mastery-course")).toBe(false)
  })

  it("unlocks The Kickoff (module 1) on the essentials course only", () => {
    expect(
      isFreePrepCourseModule({
        courseSlug: PREP_COURSE_ESSENTIALS_SLUG,
        moduleTitle: "The Kickoff",
        moduleSortOrder: 1,
      }),
    ).toBe(true)
    expect(
      isFreePrepCourseModule({
        courseSlug: PREP_COURSE_ESSENTIALS_SLUG,
        moduleTitle: "The Anatomy of an Argument",
        moduleSortOrder: 2,
      }),
    ).toBe(false)
    expect(
      isFreePrepCourseModule({
        courseSlug: "lr-mastery-course",
        moduleTitle: "The Kickoff",
        moduleSortOrder: 1,
      }),
    ).toBe(false)
  })

  it("limits access only for unpaid free-plan students", () => {
    expect(shouldLimitFreePrepCourseAccess({ accessState: "PAYMENT_REQUIRED" })).toBe(true)
    expect(
      shouldLimitFreePrepCourseAccess({ accessState: "PAYMENT_REQUIRED", hasActiveCore: true }),
    ).toBe(false)
    expect(
      shouldLimitFreePrepCourseAccess({
        accessState: "PAYMENT_REQUIRED",
        hasGuestPremiumAccount: true,
      }),
    ).toBe(false)
    expect(shouldLimitFreePrepCourseAccess({ accessState: "FULL_ACCESS" })).toBe(false)
    expect(shouldLimitFreePrepCourseAccess({ accessState: null })).toBe(false)
  })

  it("gives paid students every module and free students only Kickoff", () => {
    expect(
      canAccessPrepCourseModule({
        hasActiveCore: true,
        courseSlug: PREP_COURSE_ESSENTIALS_SLUG,
        moduleTitle: anatomy.title,
        moduleSortOrder: anatomy.sort_order,
      }),
    ).toBe(true)
    expect(
      canAccessPrepCourseModule({
        hasActiveCore: false,
        courseSlug: PREP_COURSE_ESSENTIALS_SLUG,
        moduleTitle: kickoff.title,
        moduleSortOrder: kickoff.sort_order,
      }),
    ).toBe(true)
    expect(
      canAccessPrepCourseModule({
        hasActiveCore: false,
        courseSlug: PREP_COURSE_ESSENTIALS_SLUG,
        moduleTitle: anatomy.title,
        moduleSortOrder: anatomy.sort_order,
      }),
    ).toBe(false)
  })

  it("locks later modules and their lessons for free-plan students", () => {
    const curriculum = essentialsCurriculum()
    expect(
      isPrepCourseModuleLockedForFreePlan(PREP_COURSE_ESSENTIALS_SLUG, kickoff, true),
    ).toBe(false)
    expect(
      isPrepCourseModuleLockedForFreePlan(PREP_COURSE_ESSENTIALS_SLUG, anatomy, true),
    ).toBe(true)
    expect(
      isPrepCourseLessonLockedForFreePlan(
        curriculum,
        PREP_COURSE_ESSENTIALS_SLUG,
        "welcome-to-the-arena",
        true,
      ),
    ).toBe(false)
    expect(
      isPrepCourseLessonLockedForFreePlan(
        curriculum,
        PREP_COURSE_ESSENTIALS_SLUG,
        "argument-basics",
        true,
      ),
    ).toBe(true)
    expect(
      isPrepCourseLessonLockedForFreePlan(
        curriculum,
        PREP_COURSE_ESSENTIALS_SLUG,
        "argument-basics",
        false,
      ),
    ).toBe(false)
  })
})
