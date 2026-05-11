import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { StudentMain } from "@/features/student/components/student-main"
import { createPrepCourseApi, type PrepCourse } from "@/lib/api/prep-course"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { BookOpen, ChevronRight } from "lucide-react"

function PrepCoursePage() {
  const [courses, setCourses] = useState<PrepCourse[]>([])
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
        const list = await prepCourseApi.listCourses()
        if (!alive) return
        setCourses(list)
      } catch (e) {
        if (!alive) return
        setError(e instanceof Error ? e.message : "Failed to load courses")
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
      <StudentMain>
        <p className="ds-body-sm ds-text-muted">Loading courses...</p>
      </StudentMain>
    )
  }

  if (error) {
    return (
      <StudentMain>
        <p className="text-sm text-[#95122b]">{error}</p>
      </StudentMain>
    )
  }

  if (courses.length === 0) {
    return (
      <StudentMain>
        <h1 className="ds-heading-2 ds-text-heading mb-2">Prep courses</h1>
        <p className="ds-body-sm ds-text-muted">No published courses are available yet.</p>
      </StudentMain>
    )
  }

  return (
    <StudentMain className="max-w-[1280px]">
      <header className="mb-8 border-b border-[#dfe1e7] pb-4">
        <h1 className="text-[28px] font-bold leading-[1.3] text-[#062357]">Prep courses</h1>
        <p className="mt-2 ds-body-sm ds-text-muted">Choose a course to view lessons and start learning.</p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <li key={course.id}>
            <Link
              to={`/app/prep-course/${course.slug}`}
              className="flex h-full flex-col rounded-2xl border border-[#dfe1e7] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)] transition-colors hover:border-[#0d47a1]/40 hover:bg-[#f6f8fa]"
            >
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[#edf3ff] text-[#0d47a1]">
                <BookOpen className="size-5" aria-hidden />
              </div>
              <h2 className="text-lg font-bold leading-snug text-[#062357]">{course.title}</h2>
              {course.description ? (
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[#666d80]">{course.description}</p>
              ) : (
                <p className="mt-2 flex-1 text-sm text-[#666d80]">Open course</p>
              )}
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold tracking-[0.02em] text-[#0d47a1]">
                View lessons
                <ChevronRight className="size-4" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </StudentMain>
  )
}

export { PrepCoursePage }
