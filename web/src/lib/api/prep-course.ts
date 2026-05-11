import type { SupabaseClient } from "@supabase/supabase-js"

export type PrepCourse = {
  id: string
  slug: string
  title: string
  description: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export type PrepLesson = {
  id: string
  course_id: string
  slug: string
  title: string
  lesson_type: "video" | "text" | "video_text" | "active_drill" | "adaptive_drill" | "rep_work"
  sort_order: number
  summary: string | null
  duration_minutes: number | null
  video_url: string | null
  text_content: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export function createPrepCourseApi(supabase: SupabaseClient) {
  async function invokePrepCourseFn<T>(
    functionName: string,
    options: Parameters<SupabaseClient["functions"]["invoke"]>[1],
  ): Promise<{ data: T | null; error: unknown }> {
    const maybeAuth = (
      supabase as unknown as {
        auth?: { getSession?: () => Promise<{ data: { session: { access_token?: string } | null } }> }
      }
    ).auth
    const sessionResult = maybeAuth?.getSession ? await maybeAuth.getSession() : null
    const accessToken = sessionResult?.data?.session?.access_token
    const baseHeaders = (options?.headers as Record<string, string> | undefined) ?? undefined
    const headers = baseHeaders ? { ...baseHeaders } : undefined

    if (accessToken) {
      const nextHeaders = headers ?? {}
      nextHeaders.Authorization = `Bearer ${accessToken}`
      return await supabase.functions.invoke<T>(functionName, {
        ...options,
        headers: nextHeaders,
      })
    }
    return await supabase.functions.invoke<T>(functionName, options)
  }

  function prepCourseGetName(query: Record<string, string>): string {
    const q = new URLSearchParams(query).toString()
    return q ? `prep-course?${q}` : "prep-course"
  }

  return {
    async listCourses(): Promise<PrepCourse[]> {
      const { data, error } = await invokePrepCourseFn<{ courses: PrepCourse[] }>(prepCourseGetName({}), {
        method: "GET",
      })
      if (error) throw error
      return data?.courses ?? []
    },

    async getCourse(courseSlug: string): Promise<{ course: PrepCourse; lessons: PrepLesson[] }> {
      const { data, error } = await invokePrepCourseFn<{ course: PrepCourse; lessons: PrepLesson[] }>(
        prepCourseGetName({ courseSlug }),
        { method: "GET" },
      )
      if (error) throw error
      if (!data?.course) throw new Error("No course returned from prep-course")
      return data
    },

    async getLesson(courseSlug: string, lessonSlug: string): Promise<{ course: PrepCourse; lesson: PrepLesson }> {
      const { data, error } = await invokePrepCourseFn<{ course: PrepCourse; lesson: PrepLesson }>(
        prepCourseGetName({ courseSlug, lessonSlug }),
        { method: "GET" },
      )
      if (error) throw error
      if (!data?.course || !data.lesson) throw new Error("No lesson returned from prep-course")
      return data
    },

    async adminCreateCourse(input: {
      slug: string
      title: string
      description?: string | null
      isPublished?: boolean
    }): Promise<PrepCourse> {
      const { data, error } = await invokePrepCourseFn<{ course: PrepCourse }>("prep-course-admin-create-course", {
        method: "POST",
        body: { ...input },
      })
      if (error) throw error
      if (!data?.course) throw new Error("No course returned from prep-course")
      return data.course
    },

    async adminAddLesson(input: {
      courseId: string
      slug: string
      title: string
      lessonType: "video" | "text"
      sortOrder: number
      summary?: string | null
      durationMinutes?: number | null
      videoUrl?: string | null
      textContent?: string | null
      isPublished?: boolean
    }): Promise<PrepLesson> {
      const { data, error } = await invokePrepCourseFn<{ lesson: PrepLesson }>("prep-course-admin-add-lesson", {
        method: "POST",
        body: { ...input },
      })
      if (error) throw error
      if (!data?.lesson) throw new Error("No lesson returned from prep-course")
      return data.lesson
    },
  }
}
