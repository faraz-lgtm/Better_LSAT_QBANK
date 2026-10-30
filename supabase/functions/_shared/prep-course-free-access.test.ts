import { assertEquals } from 'jsr:@std/assert@1'

import {
  canAccessPrepCourseLesson,
  canAccessPrepCourseModule,
  canAccessPrepCourseSection,
  findCurriculumLessonContext,
  findCurriculumModuleForLessonSlug,
  FREE_ANATOMY_FIRST_LOCKED_LESSON_SLUG,
  FREE_PREP_COURSE_SLUG,
  isFreePrepCourseLesson,
  isFreePrepCourseModule,
  isFreePrepCourseSection,
} from './prep-course-free-access.ts'

Deno.test('isFreePrepCourseModule unlocks Kickoff and Anatomy on the essentials course', () => {
  assertEquals(
    isFreePrepCourseModule({
      courseSlug: FREE_PREP_COURSE_SLUG,
      moduleTitle: 'The Kickoff',
      moduleSortOrder: 1,
    }),
    true,
  )
  assertEquals(
    isFreePrepCourseModule({
      courseSlug: FREE_PREP_COURSE_SLUG,
      moduleTitle: 'The Anatomy of an Argument',
      moduleSortOrder: 2,
    }),
    true,
  )
  assertEquals(
    isFreePrepCourseModule({
      courseSlug: FREE_PREP_COURSE_SLUG,
      moduleTitle: 'Practical Grammar',
      moduleSortOrder: 3,
    }),
    false,
  )
  assertEquals(
    isFreePrepCourseModule({
      courseSlug: 'lr-mastery-course',
      moduleTitle: 'The Kickoff',
      moduleSortOrder: 1,
    }),
    false,
  )
})

Deno.test('isFreePrepCourseSection unlocks only Anatomy intro for free students', () => {
  assertEquals(
    isFreePrepCourseSection({
      courseSlug: FREE_PREP_COURSE_SLUG,
      moduleTitle: 'The Anatomy of an Argument',
      moduleSortOrder: 2,
      sectionSortOrder: 1,
    }),
    true,
  )
  assertEquals(
    isFreePrepCourseSection({
      courseSlug: FREE_PREP_COURSE_SLUG,
      moduleTitle: 'The Anatomy of an Argument',
      moduleSortOrder: 2,
      sectionSortOrder: 2,
    }),
    false,
  )
})

Deno.test('canAccessPrepCourseModule grants paid students every module', () => {
  assertEquals(
    canAccessPrepCourseModule({
      hasActiveCore: true,
      courseSlug: FREE_PREP_COURSE_SLUG,
      moduleTitle: 'Practical Grammar',
      moduleSortOrder: 3,
    }),
    true,
  )
  assertEquals(
    canAccessPrepCourseModule({
      hasActiveCore: false,
      courseSlug: FREE_PREP_COURSE_SLUG,
      moduleTitle: 'The Kickoff',
      moduleSortOrder: 1,
    }),
    true,
  )
  assertEquals(
    canAccessPrepCourseSection({
      hasActiveCore: false,
      courseSlug: FREE_PREP_COURSE_SLUG,
      moduleTitle: 'The Anatomy of an Argument',
      moduleSortOrder: 2,
      sectionSortOrder: 1,
    }),
    true,
  )
})

Deno.test('findCurriculumModuleForLessonSlug returns the owning module', () => {
  const curriculum = {
    modules: [
      {
        title: 'The Kickoff',
        sort_order: 1,
        sections: [{ sort_order: 1, lessons: [{ slug: 'welcome-to-the-arena', sort_order: 1 }] }],
      },
      {
        title: 'The Anatomy of an Argument',
        sort_order: 2,
        sections: [{ sort_order: 1, lessons: [{ slug: 'argument-basics', sort_order: 1 }] }],
      },
    ],
  }
  assertEquals(findCurriculumModuleForLessonSlug(curriculum, 'welcome-to-the-arena')?.title, 'The Kickoff')
  assertEquals(findCurriculumModuleForLessonSlug(curriculum, 'argument-basics')?.title, 'The Anatomy of an Argument')
  assertEquals(findCurriculumModuleForLessonSlug(curriculum, 'missing'), null)
  assertEquals(findCurriculumLessonContext(curriculum, 'argument-basics')?.section.sort_order, 1)
})

Deno.test('isFreePrepCourseLesson locks Main Conclusion Questions onward in Anatomy', () => {
  assertEquals(
    isFreePrepCourseLesson({
      courseSlug: FREE_PREP_COURSE_SLUG,
      moduleTitle: 'The Anatomy of an Argument',
      moduleSortOrder: 2,
      lessonSlug: 'the-support-system',
      lessonSortOrder: 4,
      anatomyFirstLockedSortOrder: 9,
    }),
    true,
  )
  assertEquals(
    isFreePrepCourseLesson({
      courseSlug: FREE_PREP_COURSE_SLUG,
      moduleTitle: 'The Anatomy of an Argument',
      moduleSortOrder: 2,
      lessonSlug: FREE_ANATOMY_FIRST_LOCKED_LESSON_SLUG,
      lessonTitle: 'Full Drill: Main Conclusion Questions',
      lessonSortOrder: 9,
      anatomyFirstLockedSortOrder: 9,
    }),
    false,
  )
  assertEquals(
    canAccessPrepCourseLesson({
      hasActiveCore: false,
      courseSlug: FREE_PREP_COURSE_SLUG,
      moduleTitle: 'The Anatomy of an Argument',
      moduleSortOrder: 2,
      lessonSlug: 'building-the-ladder-sub-conclusions',
      lessonSortOrder: 10,
      anatomyFirstLockedSortOrder: 9,
    }),
    false,
  )
})
