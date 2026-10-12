import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

import type { PrepLessonType } from '../_shared/prep-lesson-type.ts'

export type PrepCourseRow = {
  id: string
  slug: string
  title: string
  description: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export type PrepLessonRow = {
  id: string
  course_id: string
  section_id: string
  slug: string
  title: string
  lesson_type: PrepLessonType
  sort_order: number
  summary: string | null
  duration_minutes: number | null
  video_url: string | null
  text_content: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export type PrepCourseModuleRow = {
  id: string
  course_id: string
  title: string
  sort_order: number
  duration_minutes: number | null
}

export type PrepCourseSectionRow = {
  id: string
  module_id: string
  title: string
  sort_order: number
  duration_minutes: number | null
}

export type PrepCourseSectionWithLessons = PrepCourseSectionRow & {
  lessons: PrepLessonRow[]
}

export type PrepCourseModuleWithSections = PrepCourseModuleRow & {
  sections: PrepCourseSectionWithLessons[]
}

export type PrepCourseModuleLessonStats = {
  moduleId: string
  lessonCount: number
  totalMinutes: number
}

export type PrepCourseCurriculum = {
  modules: PrepCourseModuleWithSections[]
}

export type ProfileRoleRow = {
  id: string
  role: 'student' | 'admin'
  student_coaching_id?: string | null
}

export type PrepCourseEligibilityRow = {
  student_coaching_id: string | null
  linked: boolean | null
  subscription_type: string | null
  fetched_at: string
}

export type PrepLessonLinkedQuestionRef = {
  question_id: string
  question_number: number | null
  prep_test_module_id: string | null
  prep_test_title: string | null
  section_number: number | null
  section_type: string | null
  section_title: string | null
}

export type PrepLessonDrillSessionRow = {
  id: string
  started_at: string
  completed_at: string | null
  raw_score: number | null
  metadata: Record<string, unknown>
}

export type PrepLessonDrillBlindReviewAttempt = {
  rawScore: number
  completedAt: string
  answers: Array<{
    questionId: string
    selectedAnswer: string
    isCorrect: boolean
  }>
}

export type PrepLessonActiveDrillAttempt = {
  sessionId: string
  completedAt: string
  rawScore: number
  questionCount: number
  elapsedSeconds: number
  answers: Array<{
    questionId: string
    selectedAnswer: string
    isCorrect: boolean
  }>
  blindReview: PrepLessonDrillBlindReviewAttempt | null
}

export type PrepCourseBookmarks = {
  moduleIds: string[]
  lessonSlugs: string[]
}

const EMPTY_BOOKMARKS: PrepCourseBookmarks = { moduleIds: [], lessonSlugs: [] }

/**
 * Outline/list queries omit text_content, summary, and video_url (large payloads).
 * Lesson detail still selects full rows.
 */
export const PREP_LESSON_LIST_SELECT =
  'id,course_id,section_id,slug,title,lesson_type,sort_order,duration_minutes,is_published,created_at,updated_at'

function mapListedLesson(row: PrepLessonRow): PrepLessonRow {
  return {
    ...row,
    text_content: row.text_content ?? null,
    summary: row.summary ?? null,
    video_url: row.video_url ?? null,
  }
}

export type ListPublishedCurriculumOptions = {
  /**
   * When set, only these modules include lessons; others keep empty lesson arrays.
   * Use `'first'` to hydrate only the lowest sort_order module.
   * Omit (or pass undefined) to hydrate every module.
   */
  hydrateModuleIds?: string[] | 'first'
}

export function createServiceRoleClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key)
}

export function createPrepCourseRepository(client: SupabaseClient) {
  return {
    async getProfileRole(userId: string): Promise<ProfileRoleRow | null> {
      const { data, error } = await client
        .from('profiles')
        .select('id,role,student_coaching_id')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error
      return data as ProfileRoleRow | null
    },

    async getLatestStudentSnapshotByUserId(userId: string): Promise<PrepCourseEligibilityRow | null> {
      const { data, error } = await client
        .from('lsac_student_snapshots')
        .select('student_coaching_id,linked,subscription_type,fetched_at')
        .eq('user_id', userId)
        .order('fetched_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as PrepCourseEligibilityRow | null
    },

    async listPublishedCourses(): Promise<PrepCourseRow[]> {
      const { data, error } = await client
        .from('prep_courses')
        .select('*')
        .eq('is_published', true)
        .order('title', { ascending: true })
      if (error) throw error
      return (data ?? []) as PrepCourseRow[]
    },

    async getPublishedCourseBySlug(slug: string): Promise<PrepCourseRow | null> {
      const { data, error } = await client
        .from('prep_courses')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle()
      if (error) throw error
      return data as PrepCourseRow | null
    },

    flattenLessonsFromCurriculum(curriculum: PrepCourseCurriculum): PrepLessonRow[] {
      const lessons: PrepLessonRow[] = []
      for (const mod of curriculum.modules) {
        for (const section of mod.sections) {
          for (const lesson of section.lessons) {
            lessons.push(lesson)
          }
        }
      }
      return lessons
    },

    async listPublishedLessonsByCourse(courseId: string): Promise<PrepLessonRow[]> {
      const curriculum = await this.listPublishedCurriculum(courseId)
      return this.flattenLessonsFromCurriculum(curriculum)
    },

    async listPublishedCurriculum(
      courseId: string,
      opts?: ListPublishedCurriculumOptions,
    ): Promise<PrepCourseCurriculum> {
      const { data: modules, error: modErr } = await client
        .from('prep_course_modules')
        .select('id,course_id,title,sort_order,duration_minutes')
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true })
      if (modErr) throw modErr
      const moduleRows = (modules ?? []) as PrepCourseModuleRow[]
      if (moduleRows.length === 0) {
        return { modules: [] }
      }

      const moduleIds = moduleRows.map((m) => m.id)
      const hydrateIds =
        opts?.hydrateModuleIds === 'first'
          ? moduleRows[0]
            ? [moduleRows[0].id]
            : []
          : opts?.hydrateModuleIds
      const hydrateSet =
        hydrateIds === undefined
          ? null
          : new Set(hydrateIds)

      const { data: sections, error: secErr } = await client
        .from('prep_course_sections')
        .select('id,module_id,title,sort_order,duration_minutes')
        .in('module_id', moduleIds)
        .order('sort_order', { ascending: true })
      if (secErr) throw secErr

      const sectionRows = (sections ?? []) as PrepCourseSectionRow[]
      const sectionIdsForLessons = (
        hydrateSet
          ? sectionRows.filter((section) => hydrateSet.has(section.module_id))
          : sectionRows
      ).map((s) => s.id)

      let lessonRows: PrepLessonRow[] = []
      if (sectionIdsForLessons.length > 0) {
        const { data: lessons, error: lessonErr } = await client
          .from('prep_lessons')
          .select(PREP_LESSON_LIST_SELECT)
          .in('section_id', sectionIdsForLessons)
          .eq('is_published', true)
          .order('sort_order', { ascending: true })
        if (lessonErr) throw lessonErr
        lessonRows = ((lessons ?? []) as PrepLessonRow[]).map(mapListedLesson)
      }

      const sectionsByModule = new Map<string, PrepCourseSectionRow[]>()
      for (const section of sectionRows) {
        const list = sectionsByModule.get(section.module_id) ?? []
        list.push(section)
        sectionsByModule.set(section.module_id, list)
      }

      const lessonsBySection = new Map<string, PrepLessonRow[]>()
      for (const lesson of lessonRows) {
        const list = lessonsBySection.get(lesson.section_id) ?? []
        list.push(lesson)
        lessonsBySection.set(lesson.section_id, list)
      }

      const nestedModules: PrepCourseModuleWithSections[] = moduleRows.map((mod) => ({
        ...mod,
        sections: (sectionsByModule.get(mod.id) ?? []).map((section) => ({
          ...section,
          lessons: lessonsBySection.get(section.id) ?? [],
        })),
      }))

      return { modules: nestedModules }
    },

    async listModuleLessonStats(courseId: string): Promise<PrepCourseModuleLessonStats[]> {
      const { data: modules, error: modErr } = await client
        .from('prep_course_modules')
        .select('id')
        .eq('course_id', courseId)
      if (modErr) throw modErr
      const moduleRows = (modules ?? []) as Array<{ id: string }>
      if (moduleRows.length === 0) return []

      const { data: sections, error: secErr } = await client
        .from('prep_course_sections')
        .select('id,module_id')
        .in(
          'module_id',
          moduleRows.map((m) => m.id),
        )
      if (secErr) throw secErr
      const sectionRows = (sections ?? []) as Array<{ id: string; module_id: string }>
      const sectionToModule = new Map(sectionRows.map((s) => [s.id, s.module_id]))
      const stats = new Map<string, { lessonCount: number; totalMinutes: number }>()
      for (const mod of moduleRows) stats.set(mod.id, { lessonCount: 0, totalMinutes: 0 })
      if (sectionRows.length === 0) {
        return moduleRows.map((mod) => ({
          moduleId: mod.id,
          lessonCount: 0,
          totalMinutes: 0,
        }))
      }

      const { data: lessonRows, error: lessonErr } = await client
        .from('prep_lessons')
        .select('section_id, duration_minutes')
        .in(
          'section_id',
          sectionRows.map((s) => s.id),
        )
        .eq('is_published', true)
      if (lessonErr) throw lessonErr
      for (const row of (lessonRows ?? []) as Array<{
        section_id: string
        duration_minutes: number | null
      }>) {
        const moduleId = sectionToModule.get(row.section_id)
        if (!moduleId) continue
        const cur = stats.get(moduleId) ?? { lessonCount: 0, totalMinutes: 0 }
        cur.lessonCount += 1
        cur.totalMinutes += row.duration_minutes ?? 0
        stats.set(moduleId, cur)
      }
      return moduleRows.map((mod) => {
        const cur = stats.get(mod.id) ?? { lessonCount: 0, totalMinutes: 0 }
        return { moduleId: mod.id, lessonCount: cur.lessonCount, totalMinutes: cur.totalMinutes }
      })
    },

    async getPublishedLessonBySlug(courseId: string, lessonSlug: string): Promise<PrepLessonRow | null> {
      const { data, error } = await client
        .from('prep_lessons')
        .select('*')
        .eq('course_id', courseId)
        .eq('slug', lessonSlug)
        .eq('is_published', true)
        .maybeSingle()
      if (error) throw error
      return data as PrepLessonRow | null
    },

    async listCompletedLessonSlugsForLessons(
      userId: string,
      lessons: PrepLessonRow[],
    ): Promise<string[]> {
      if (lessons.length === 0) return []
      const lessonIds = lessons.map((l) => l.id)
      const { data, error } = await client
        .from('prep_lesson_completions')
        .select('lesson_id')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)
      if (error) throw error
      const completedIds = new Set(
        ((data ?? []) as Array<{ lesson_id: string }>).map((row) => row.lesson_id),
      )
      return lessons.filter((l) => completedIds.has(l.id)).map((l) => l.slug)
    },

    async listCompletedLessonSlugsByCourse(userId: string, courseId: string): Promise<string[]> {
      const { data, error } = await client
        .from('prep_lesson_completions')
        .select('lesson_id, prep_lessons!inner(slug, course_id, is_published)')
        .eq('user_id', userId)
        .eq('prep_lessons.course_id', courseId)
        .eq('prep_lessons.is_published', true)
      if (error) throw error
      const slugs: string[] = []
      for (const row of (data ?? []) as Array<{
        prep_lessons:
          | { slug: string }
          | { slug: string }[]
          | null
      }>) {
        const lesson = Array.isArray(row.prep_lessons) ? row.prep_lessons[0] : row.prep_lessons
        if (lesson?.slug) slugs.push(lesson.slug)
      }
      return slugs
    },

    async upsertLessonCompletion(userId: string, lessonId: string): Promise<void> {
      const { error } = await client
        .from('prep_lesson_completions')
        .upsert(
          { user_id: userId, lesson_id: lessonId, completed_at: new Date().toISOString() },
          { onConflict: 'user_id,lesson_id' },
        )
      if (error) throw error
    },

    async getPublishedModuleById(courseId: string, moduleId: string): Promise<PrepCourseModuleRow | null> {
      const { data, error } = await client
        .from('prep_course_modules')
        .select('id,course_id,title,sort_order,duration_minutes')
        .eq('course_id', courseId)
        .eq('id', moduleId)
        .maybeSingle()
      if (error) throw error
      return data as PrepCourseModuleRow | null
    },

    async listBookmarksForCurriculum(
      userId: string,
      courseId: string,
      curriculum: PrepCourseCurriculum,
    ): Promise<PrepCourseBookmarks> {
      try {
        const { data: moduleRows, error: moduleError } = await client
          .from('prep_course_module_bookmarks')
          .select('module_id, prep_course_modules!inner(course_id)')
          .eq('user_id', userId)
          .eq('prep_course_modules.course_id', courseId)
        if (moduleError) throw moduleError

        const { data: lessonRows, error: lessonError } = await client
          .from('prep_lesson_bookmarks')
          .select('lesson_id, prep_lessons!inner(slug, course_id)')
          .eq('user_id', userId)
          .eq('prep_lessons.course_id', courseId)
        if (lessonError) throw lessonError

        const courseModuleIds = new Set(curriculum.modules.map((mod) => mod.id))
        const bookmarkedModuleIds = ((moduleRows ?? []) as Array<{ module_id: string }>)
          .map((row) => row.module_id)
          .filter((id) => courseModuleIds.has(id))

        const bookmarkedLessonSlugs = ((lessonRows ?? []) as Array<{
          lesson_id: string
          prep_lessons: { slug: string } | { slug: string }[] | null
        }>)
          .map((row) => {
            const lesson = Array.isArray(row.prep_lessons) ? row.prep_lessons[0] : row.prep_lessons
            return lesson?.slug
          })
          .filter((slug): slug is string => typeof slug === 'string')

        return { moduleIds: bookmarkedModuleIds, lessonSlugs: bookmarkedLessonSlugs }
      } catch (error) {
        console.error('listBookmarksByCourse failed', error)
        return EMPTY_BOOKMARKS
      }
    },

    async listBookmarksByCourse(userId: string, courseId: string): Promise<PrepCourseBookmarks> {
      const curriculum = await this.listPublishedCurriculum(courseId)
      return this.listBookmarksForCurriculum(userId, courseId, curriculum)
    },

    async setModuleBookmark(userId: string, moduleId: string, bookmarked: boolean): Promise<void> {
      if (bookmarked) {
        const { error } = await client
          .from('prep_course_module_bookmarks')
          .upsert(
            { user_id: userId, module_id: moduleId },
            { onConflict: 'user_id,module_id' },
          )
        if (error) throw error
        return
      }
      const { error } = await client
        .from('prep_course_module_bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('module_id', moduleId)
      if (error) throw error
    },

    async setLessonBookmark(userId: string, lessonId: string, bookmarked: boolean): Promise<void> {
      if (bookmarked) {
        const { error } = await client
          .from('prep_lesson_bookmarks')
          .upsert(
            { user_id: userId, lesson_id: lessonId },
            { onConflict: 'user_id,lesson_id' },
          )
        if (error) throw error
        return
      }
      const { error } = await client
        .from('prep_lesson_bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
      if (error) throw error
    },

    async listLessonLinkedQuestions(lessonId: string): Promise<PrepLessonLinkedQuestionRef[]> {
      const { data, error } = await client
        .from('lesson_questions')
        .select(
          'sort_order,admin_questions(id,question_number,admin_sections(section_number,section_type,title,admin_prep_tests(module_id,title)))',
        )
        .eq('lesson_id', lessonId)
        .order('sort_order', { ascending: true })
      if (error) throw error

      return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
        const q = row.admin_questions as Record<string, unknown> | null
        const section = q?.admin_sections as Record<string, unknown> | null
        const prep = section?.admin_prep_tests as Record<string, unknown> | null
        return {
          question_id: String(q?.id ?? ''),
          question_number: typeof q?.question_number === 'number' ? q.question_number : null,
          prep_test_module_id: prep?.module_id != null ? String(prep.module_id) : null,
          prep_test_title: prep?.title != null ? String(prep.title) : null,
          section_number: typeof section?.section_number === 'number' ? section.section_number : null,
          section_type: section?.section_type != null ? String(section.section_type) : null,
          section_title: section?.title != null ? String(section.title) : null,
        }
      }).filter((ref) => ref.question_id.length > 0)
    },

    async getLatestLessonDrillAttempt(
      userId: string,
      lessonId: string,
    ): Promise<PrepLessonDrillSessionRow | null> {
      const { data, error } = await client
        .from('practice_sessions')
        .select('id,started_at,completed_at,raw_score,metadata')
        .eq('user_id', userId)
        .eq('kind', 'DRILL')
        .not('completed_at', 'is', null)
        .filter('metadata->>lessonId', 'eq', lessonId)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return (data as PrepLessonDrillSessionRow | null) ?? null
    },

    async listAnswerEventsForSession(
      sessionId: string,
      userId: string,
    ): Promise<
      Array<{
        question_id: string
        selected_answer: string
        is_correct: boolean
        created_at: string
      }>
    > {
      const { data, error } = await client
        .from('answer_events')
        .select('question_id,selected_answer,is_correct,created_at')
        .eq('practice_session_id', sessionId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Array<{
        question_id: string
        selected_answer: string
        is_correct: boolean
        created_at: string
      }>
    },

    async createCourse(input: {
      slug: string
      title: string
      description: string | null
      isPublished: boolean
    }): Promise<PrepCourseRow> {
      const { data, error } = await client
        .from('prep_courses')
        .insert({
          slug: input.slug,
          title: input.title,
          description: input.description,
          is_published: input.isPublished,
        })
        .select('*')
        .single()
      if (error) throw error
      return data as PrepCourseRow
    },

    async addLesson(input: {
      courseId: string
      slug: string
      title: string
      lessonType: PrepLessonType
      sortOrder: number
      summary: string | null
      durationMinutes: number | null
      videoUrl: string | null
      textContent: string | null
      isPublished: boolean
    }): Promise<PrepLessonRow> {
      const { data, error } = await client
        .from('prep_lessons')
        .insert({
          course_id: input.courseId,
          slug: input.slug,
          title: input.title,
          lesson_type: input.lessonType,
          sort_order: input.sortOrder,
          summary: input.summary,
          duration_minutes: input.durationMinutes,
          video_url: input.videoUrl,
          text_content: input.textContent,
          is_published: input.isPublished,
        })
        .select('*')
        .single()
      if (error) throw error
      return data as PrepLessonRow
    },

    async updateCourse(input: {
      courseId: string
      title?: string
      description?: string | null
      isPublished?: boolean
    }): Promise<PrepCourseRow> {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (input.title !== undefined) patch.title = input.title
      if (input.description !== undefined) patch.description = input.description
      if (input.isPublished !== undefined) patch.is_published = input.isPublished

      const { data, error } = await client
        .from('prep_courses')
        .update(patch)
        .eq('id', input.courseId)
        .select('*')
        .single()
      if (error) throw error
      return data as PrepCourseRow
    },

    async updateLesson(input: {
      lessonId: string
      title?: string
      lessonType?: PrepLessonType
      sortOrder?: number
      summary?: string | null
      durationMinutes?: number | null
      videoUrl?: string | null
      textContent?: string | null
      isPublished?: boolean
    }): Promise<PrepLessonRow> {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (input.title !== undefined) patch.title = input.title
      if (input.lessonType !== undefined) patch.lesson_type = input.lessonType
      if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder
      if (input.summary !== undefined) patch.summary = input.summary
      if (input.durationMinutes !== undefined) patch.duration_minutes = input.durationMinutes
      if (input.videoUrl !== undefined) patch.video_url = input.videoUrl
      if (input.textContent !== undefined) patch.text_content = input.textContent
      if (input.isPublished !== undefined) patch.is_published = input.isPublished

      const { data, error } = await client
        .from('prep_lessons')
        .update(patch)
        .eq('id', input.lessonId)
        .select('*')
        .single()
      if (error) throw error
      return data as PrepLessonRow
    },
  }
}

export type PrepCourseRepository = ReturnType<typeof createPrepCourseRepository>
