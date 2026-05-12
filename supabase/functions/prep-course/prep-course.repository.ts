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
      const { data, error } = await client
        .from('prep_lessons')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as PrepLessonRow[]
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
