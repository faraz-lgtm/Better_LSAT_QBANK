import { useEffect, useMemo, useState } from "react"
import { Link, Navigate } from "react-router-dom"

import { AuthHeader } from "@/features/auth/components/auth-header"
import { PrepCourseLessonList } from "@/features/prep-course/components/prep-course-lesson-list"
import { createPrepCourseApi, type PrepCourse, type PrepLesson } from "@/lib/api/prep-course"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function PrepCoursePage() {
  const [course, setCourse] = useState<PrepCourse | null>(null)
  const [lessons, setLessons] = useState<PrepLesson[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const prepCourseApi = useMemo(() => {
    try {
      return createPrepCourseApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let alive = true
    async function load() {
      if (!prepCourseApi) {
        if (alive) {
          setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
          setLoading(false)
        }
        return
      }
      try {
        const data = await prepCourseApi.getCourse("prep-course")
        if (!alive) return
        setCourse(data.course)
        setLessons(data.lessons)
      } catch (e) {
        if (!alive) return
        setError(e instanceof Error ? e.message : "Failed to load prep course")
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [prepCourseApi])

  if (loading) {
    return (
      <div className="auth-page flex min-h-svh flex-col bg-[#f5f9ff]">
        <AuthHeader ctaLabel="Log In" ctaHref="/login" variant="app" />
        <main className="mx-auto w-full max-w-[1126px] px-4 py-8 ds-body-sm ds-text-muted">Loading prep course...</main>
      </div>
    )
  }

  if (!course || lessons.length === 0) {
    return (
      <div className="auth-page flex min-h-svh flex-col bg-[#f5f9ff]">
        <AuthHeader ctaLabel="Log In" ctaHref="/login" variant="app" />
        <main className="mx-auto w-full max-w-[1126px] px-4 py-8 text-sm text-[#95122b]">{error ?? "No prep course content found."}</main>
      </div>
    )
  }

  const firstLesson = lessons[0]
  if (!firstLesson) return <Navigate to="/app" replace />

  return (
    <div className="auth-page flex min-h-svh flex-col bg-[#f5f9ff]">
      <AuthHeader ctaLabel="Log In" ctaHref="/login" variant="app" />
      <main className="mx-auto flex w-full max-w-[1126px] flex-1 flex-col gap-4 px-4 py-6">
        <div className="ds-body-xs ds-text-muted tracking-[0.24px]">
          Learn / Prep Course / <span className="ds-text-accent">{course.title}</span>
        </div>
        <h1 className="ds-heading-3 ds-text-heading">{course.title}</h1>
        {error && <p className="text-xs text-[#95122b]">{error}</p>}

        <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <PrepCourseLessonList course={course} lessons={lessons} />
          <article className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]">
            <div className="flex items-center justify-between rounded-xl bg-[#0d47a1] px-4 py-3 text-white">
              <h2 className="text-xl font-semibold">{firstLesson.title}</h2>
              <span className="text-xs">{lessons.length} lessons</span>
            </div>
            <div className="mt-4 space-y-3">
              {lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  to={`/app/prep-course/${course.slug}/${lesson.slug}`}
                  className="flex items-center justify-between rounded-xl border border-[#dfe1e7] bg-[#f6f8fa] px-4 py-3"
                >
                  <div>
                    <p className="ds-body-md font-semibold ds-text-heading">{lesson.title}</p>
                    <p className="ds-body-xs ds-text-muted">{lesson.summary ?? "Lesson summary"}</p>
                  </div>
                  <span className="ds-body-xs font-semibold ds-text-accent">
                    {lesson.duration_minutes ?? 0} min
                  </span>
                </Link>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}

export { PrepCoursePage }
