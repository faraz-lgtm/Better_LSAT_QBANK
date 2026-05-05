import { useEffect, useMemo, useState } from "react"
import { Link, Navigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { PrepCourseLessonList } from "@/features/prep-course/components/prep-course-lesson-list"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import { createPrepCourseApi, type PrepCourse, type PrepLesson } from "@/lib/api/prep-course"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { BookOpen, Clock } from "lucide-react"

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
      <>
        <StudentSubnavStrip crumbs={[{ label: "Learn", href: "/app/prep-course" }, { label: "Prep Course" }]} />
        <StudentMain>
          <p className="ds-body-sm ds-text-muted">Loading prep course...</p>
        </StudentMain>
      </>
    )
  }

  if (!course || lessons.length === 0) {
    return (
      <>
        <StudentSubnavStrip crumbs={[{ label: "Learn", href: "/app/prep-course" }, { label: "Prep Course" }]} />
        <StudentMain>
          <p className="text-sm text-[#95122b]">{error ?? "No prep course content found."}</p>
        </StudentMain>
      </>
    )
  }

  const firstLesson = lessons[0]
  if (!firstLesson) return <Navigate to="/app" replace />

  return (
    <>
      <StudentSubnavStrip
        crumbs={[
          { label: "Learn", href: "/app/prep-course" },
          { label: "Prep Course", href: "/app/prep-course" },
          { label: course.title },
        ]}
      />
      <StudentMain>
        <div className="mb-6 flex flex-col gap-4 border-b border-[#dfe1e7] pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#666d80]">Course content</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#082c6b]">{course.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#666d80]">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f3f7ff] px-2 py-1 font-medium text-[#0d47a1]">
                <BookOpen className="size-4" />
                Lessons
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4 text-[#0d47a1]" />
                Self-paced
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="rounded-xl border-[#0d47a1] text-[#0d47a1]">
              Resume
            </Button>
            <label className="flex items-center gap-2 text-sm font-medium text-[#082c6b]">
              <span className="text-xs text-[#666d80]">Autoplay</span>
              <input type="checkbox" className="size-4 accent-[#0d47a1]" aria-label="Autoplay next lesson" />
            </label>
          </div>
        </div>
        {error && <p className="mb-4 text-xs text-[#95122b]">{error}</p>}

        <section className="grid gap-4 lg:grid-cols-[288px_1fr]">
          <PrepCourseLessonList course={course} lessons={lessons} />
          <article className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]">
            <div className="flex flex-col gap-2 border-b border-[#dfe1e7] pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#082c6b]">{firstLesson.title}</h2>
                <p className="mt-1 text-sm text-[#666d80]">{firstLesson.summary ?? "Select a lesson from the sidebar to begin."}</p>
              </div>
              <Button type="button" variant="outline" size="sm" className="w-fit rounded-xl">
                Bookmark
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  to={`/app/prep-course/${course.slug}/${lesson.slug}`}
                  className="flex items-center justify-between rounded-xl border border-[#dfe1e7] bg-[#f6f8fa] px-4 py-3 transition-colors hover:border-[#0d47a1]/40"
                >
                  <div>
                    <p className="ds-body-md font-semibold ds-text-heading">{lesson.title}</p>
                    <p className="ds-body-xs ds-text-muted">{lesson.summary ?? "Lesson summary"}</p>
                  </div>
                  <span className="ds-body-xs font-semibold ds-text-accent">{lesson.duration_minutes ?? 0} min</span>
                </Link>
              ))}
            </div>
          </article>
        </section>
      </StudentMain>
    </>
  )
}

export { PrepCoursePage }
