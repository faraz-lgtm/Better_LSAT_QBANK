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

    async listPublishedLessonsByCourse(courseId: string): Promise<PrepLessonRow[]> {
      const curriculum = await this.listPublishedCurriculum(courseId)
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

    async listPublishedCurriculum(courseId: string): Promise<PrepCourseCurriculum> {
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
      const { data: sections, error: secErr } = await client
        .from('prep_course_sections')
        .select('id,module_id,title,sort_order,duration_minutes')
        .in('module_id', moduleIds)
        .order('sort_order', { ascending: true })
      if (secErr) throw secErr

      const sectionRows = (sections ?? []) as PrepCourseSectionRow[]
      const sectionIds = sectionRows.map((s) => s.id)
      let lessonRows: PrepLessonRow[] = []
      if (sectionIds.length > 0) {
        const { data: lessons, error: lessonErr } = await client
          .from('prep_lessons')
          .select('*')
          .in('section_id', sectionIds)
          .eq('is_published', true)
          .order('sort_order', { ascending: true })
        if (lessonErr) throw lessonErr
        lessonRows = (lessons ?? []) as PrepLessonRow[]
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

    async listCompletedLessonSlugsByCourse(userId: string, courseId: string): Promise<string[]> {
      const lessons = await this.listPublishedLessonsByCourse(courseId)
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

    async upsertLessonCompletion(userId: string, lessonId: string): Promise<void> {
      const { error } = await client
        .from('prep_lesson_completions')
        .upsert(
          { user_id: userId, lesson_id: lessonId, completed_at: new Date().toISOString() },
          { onConflict: 'user_id,lesson_id' },
        )
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
