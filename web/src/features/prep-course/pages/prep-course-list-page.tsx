import { useEffect, useMemo, useState } from "react"
import { Navigate } from "react-router-dom"

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

  if (error) {
    return (
      <StudentMain>
        <p className="mb-4 text-sm text-[#95122b]">{error}</p>
      </StudentMain>
    )
  }

  if (courses.length === 0) {
    return (
      <StudentMain>
        <p className="text-sm text-[#666d80]">No courses available yet.</p>
      </StudentMain>
    )
  }

  return <Navigate to={`/app/prep-course/${courses[0].slug}`} replace />
}

export { PrepCourseListPage }
