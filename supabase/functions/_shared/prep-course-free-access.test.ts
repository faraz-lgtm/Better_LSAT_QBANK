import { assertEquals } from 'jsr:@std/assert@1'

import {
  canAccessPrepCourseModule,
  findCurriculumModuleForLessonSlug,
  FREE_PREP_COURSE_SLUG,
  isFreePrepCourseModule,
} from './prep-course-free-access.ts'

Deno.test('isFreePrepCourseModule unlocks The Kickoff on the essentials course', () => {
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

Deno.test('canAccessPrepCourseModule grants paid students every module', () => {
  assertEquals(
    canAccessPrepCourseModule({
      hasActiveCore: true,
      courseSlug: FREE_PREP_COURSE_SLUG,
      moduleTitle: 'The Anatomy of an Argument',
      moduleSortOrder: 2,
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
})

Deno.test('findCurriculumModuleForLessonSlug returns the owning module', () => {
  const curriculum = {
    modules: [
      {
        title: 'The Kickoff',
        sort_order: 1,
        sections: [{ lessons: [{ slug: 'welcome-to-the-arena' }] }],
      },
      {
        title: 'The Anatomy of an Argument',
        sort_order: 2,
        sections: [{ lessons: [{ slug: 'argument-basics' }] }],
      },
    ],
  }
  assertEquals(findCurriculumModuleForLessonSlug(curriculum, 'welcome-to-the-arena')?.title, 'The Kickoff')
  assertEquals(findCurriculumModuleForLessonSlug(curriculum, 'argument-basics')?.title, 'The Anatomy of an Argument')
  assertEquals(findCurriculumModuleForLessonSlug(curriculum, 'missing'), null)
})
