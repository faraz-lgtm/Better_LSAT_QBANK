import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { StudentMain } from "@/features/student/components/student-main"
import { createPrepCourseApi, type PrepCourse } from "@/lib/api/prep-course"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function PrepCourseListPage() {
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
        const rows = await prepCourseApi.listCourses()
        if (!alive) return
        setCourses(rows)
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
      <StudentMain contentClassName="flex min-h-0 flex-1 flex-col">
        <StudentPageLoader centered className="min-h-0 flex-1" label="Loading courses…" />
      </StudentMain>
    )
  }

  return (
    <StudentMain>
      {error ? <p className="mb-4 text-sm text-[#95122b]">{error}</p> : null}

      {courses.length === 0 ? (
        <p className="text-sm text-[#666d80]">No courses available yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <li key={course.id}>
              <Link
                to={`/app/prep-course/${course.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-[#dfe1e7] bg-white p-6 transition-colors hover:border-[#0d47a1] hover:bg-[#f3f7ff]"
              >
                <h2 className="text-xl font-bold leading-[1.3] text-[#062357] group-hover:text-[#0d47a1]">
                  {course.title}
                </h2>
                {course.description ? (
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[#666d80]">{course.description}</p>
                ) : (
                  <p className="mt-2 flex-1 text-sm text-[#818898]">Open course content</p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-medium tracking-[0.02em] text-[#6d78b6]">{course.slug}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="pointer-events-none h-8 rounded-xl border-[#dfe1e7] bg-white px-3 text-xs font-semibold text-[#0d47a1]"
                    tabIndex={-1}
                  >
                    Open
                    <ChevronRight className="ml-1 size-4" />
                  </Button>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </StudentMain>
  )
}

export { PrepCourseListPage }
