import { describe, expect, it } from "vitest"

import {
  canAccessPrepCourseModule,
  collectLockedLessonSlugsForFreePlan,
  FREE_ANATOMY_FIRST_LOCKED_LESSON_SLUG,
  isFreePrepCourseLesson,
  isFreePrepCourseModule,
  isFreePrepCourseSection,
  isFreePrepCourseSlug,
  isPrepCourseLessonLockedForFreePlan,
  isPrepCourseModuleLockedForFreePlan,
  isPrepCourseSectionLockedForFreePlan,
  shouldLimitFreePrepCourseAccess,
} from "./prep-course-free-access"
import { PREP_COURSE_ESSENTIALS_SLUG } from "./prep-course-nav"
import type { PrepCourseCurriculum } from "@/lib/api/prep-course"

const kickoff = { title: "The Kickoff", sort_order: 1 }
const anatomy = { title: "The Anatomy of an Argument", sort_order: 2 }
const grammar = { title: "Practical Grammar", sort_order: 3 }

function lesson(
  id: string,
  slug: string,
  title: string,
  sort_order: number,
): PrepCourseCurriculum["modules"][number]["sections"][number]["lessons"][number] {
  return {
    id,
    course_id: "c1",
    slug,
    title,
    lesson_type: "video_text",
    sort_order,
    summary: null,
    duration_minutes: 5,
    video_url: null,
    text_content: null,
    is_published: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  }
}

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
            lessons: [lesson("l1", "welcome-to-the-arena", "Welcome to the Arena", 1)],
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
              lesson("l2", "the-support-system", 'The "Support" System', 4),
              lesson("l3", "active-drill-neurochemical-imbalances", "Active Drill: Neurochemical Imbalances", 8),
              lesson(
                "l4",
                FREE_ANATOMY_FIRST_LOCKED_LESSON_SLUG,
                "Full Drill: Main Conclusion Questions",
                9,
              ),
              lesson("l5", "building-the-ladder-sub-conclusions", "Building the Ladder: Sub-Conclusions", 10),
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

  it("unlocks Kickoff and Anatomy (modules 1–2) on the essentials course only", () => {
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
    ).toBe(true)
    expect(
      isFreePrepCourseModule({
        courseSlug: PREP_COURSE_ESSENTIALS_SLUG,
        moduleTitle: "Practical Grammar",
        moduleSortOrder: 3,
      }),
    ).toBe(false)
  })

  it("unlocks Anatomy lessons before Main Conclusion Questions only", () => {
    expect(
      isFreePrepCourseLesson({
        courseSlug: PREP_COURSE_ESSENTIALS_SLUG,
        moduleTitle: anatomy.title,
        moduleSortOrder: anatomy.sort_order,
        lessonSlug: "the-support-system",
        lessonSortOrder: 4,
        anatomyFirstLockedSortOrder: 9,
      }),
    ).toBe(true)
    expect(
      isFreePrepCourseLesson({
        courseSlug: PREP_COURSE_ESSENTIALS_SLUG,
        moduleTitle: anatomy.title,
        moduleSortOrder: anatomy.sort_order,
        lessonSlug: FREE_ANATOMY_FIRST_LOCKED_LESSON_SLUG,
        lessonTitle: "Full Drill: Main Conclusion Questions",
        lessonSortOrder: 9,
        anatomyFirstLockedSortOrder: 9,
      }),
    ).toBe(false)
    expect(
      isFreePrepCourseLesson({
        courseSlug: PREP_COURSE_ESSENTIALS_SLUG,
        moduleTitle: anatomy.title,
        moduleSortOrder: anatomy.sort_order,
        lessonSlug: "building-the-ladder-sub-conclusions",
        lessonSortOrder: 10,
        anatomyFirstLockedSortOrder: 9,
      }),
    ).toBe(false)
  })

  it("keeps Kickoff sections fully open and does not lock Anatomy General wholesale", () => {
    expect(
      isFreePrepCourseSection({
        courseSlug: PREP_COURSE_ESSENTIALS_SLUG,
        moduleTitle: anatomy.title,
        moduleSortOrder: anatomy.sort_order,
        sectionSortOrder: 1,
      }),
    ).toBe(true)
    expect(
      isFreePrepCourseSection({
        courseSlug: PREP_COURSE_ESSENTIALS_SLUG,
        moduleTitle: kickoff.title,
        moduleSortOrder: kickoff.sort_order,
        sectionSortOrder: 2,
      }),
    ).toBe(true)
  })

  it("limits access only for unpaid free-plan students", () => {
    expect(shouldLimitFreePrepCourseAccess({ accessState: "PAYMENT_REQUIRED" })).toBe(true)
    expect(
      shouldLimitFreePrepCourseAccess({ accessState: "PAYMENT_REQUIRED", hasActiveCore: true }),
    ).toBe(false)
    expect(shouldLimitFreePrepCourseAccess({ accessState: "FULL_ACCESS" })).toBe(false)
  })

  it("gives paid students every module and free students Kickoff + Anatomy", () => {
    expect(
      canAccessPrepCourseModule({
        hasActiveCore: true,
        courseSlug: PREP_COURSE_ESSENTIALS_SLUG,
        moduleTitle: grammar.title,
        moduleSortOrder: grammar.sort_order,
      }),
    ).toBe(true)
    expect(
      canAccessPrepCourseModule({
        hasActiveCore: false,
        courseSlug: PREP_COURSE_ESSENTIALS_SLUG,
        moduleTitle: anatomy.title,
        moduleSortOrder: anatomy.sort_order,
      }),
    ).toBe(true)
  })

  it("locks Main Conclusion Questions and later Anatomy lessons for free-plan students", () => {
    const curriculum = essentialsCurriculum()
    const anatomyModule = curriculum.modules[1]!
    const anatomySection = anatomyModule.sections[0]!

    expect(isPrepCourseModuleLockedForFreePlan(PREP_COURSE_ESSENTIALS_SLUG, kickoff, true)).toBe(false)
    expect(isPrepCourseModuleLockedForFreePlan(PREP_COURSE_ESSENTIALS_SLUG, anatomy, true)).toBe(false)
    expect(isPrepCourseModuleLockedForFreePlan(PREP_COURSE_ESSENTIALS_SLUG, grammar, true)).toBe(true)

    expect(
      isPrepCourseSectionLockedForFreePlan(PREP_COURSE_ESSENTIALS_SLUG, anatomyModule, anatomySection, true),
    ).toBe(false)

    expect(
      isPrepCourseLessonLockedForFreePlan(
        curriculum,
        PREP_COURSE_ESSENTIALS_SLUG,
        "the-support-system",
        true,
      ),
    ).toBe(false)
    expect(
      isPrepCourseLessonLockedForFreePlan(
        curriculum,
        PREP_COURSE_ESSENTIALS_SLUG,
        FREE_ANATOMY_FIRST_LOCKED_LESSON_SLUG,
        true,
      ),
    ).toBe(true)
    expect(
      isPrepCourseLessonLockedForFreePlan(
        curriculum,
        PREP_COURSE_ESSENTIALS_SLUG,
        "building-the-ladder-sub-conclusions",
        true,
      ),
    ).toBe(true)

    const lockedSlugs = collectLockedLessonSlugsForFreePlan(curriculum, PREP_COURSE_ESSENTIALS_SLUG, true)
    expect(lockedSlugs.has("the-support-system")).toBe(false)
    expect(lockedSlugs.has(FREE_ANATOMY_FIRST_LOCKED_LESSON_SLUG)).toBe(true)
    expect(lockedSlugs.has("building-the-ladder-sub-conclusions")).toBe(true)
  })
})
