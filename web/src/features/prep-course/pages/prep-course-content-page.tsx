import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"

import { PrepCourseContentHeader } from "@/features/prep-course/components/prep-course-content-header"
import { PrepCourseModulePanel } from "@/features/prep-course/components/prep-course-module-panel"
import { PrepCourseModuleSidebar } from "@/features/prep-course/components/prep-course-module-sidebar"
import {
  curriculumStats,
  findLessonLocation,
  normalizeCurriculum,
} from "@/features/prep-course/lib/prep-course-format"
import { StudentMain } from "@/features/student/components/student-main"
import {
  createPrepCourseApi,
  type PrepCourse,
  type PrepCourseCurriculum,
} from "@/lib/api/prep-course"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type LocationState = {
  activeLessonSlug?: string
}

function PrepCourseContentPage() {
  const { courseSlug: courseSlugParam } = useParams<{ courseSlug: string }>()
  const courseSlug = courseSlugParam?.trim() ?? ""
  const location = useLocation()
  const locationState = (location.state ?? {}) as LocationState

  const [course, setCourse] = useState<PrepCourse | null>(null)
  const [curriculum, setCurriculum] = useState<PrepCourseCurriculum>({ modules: [] })
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(() => new Set())
  const [expandAll, setExpandAll] = useState(false)
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [completedLessonSlugs, setCompletedLessonSlugs] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const prepCourseApi = useMemo(() => {
    try {
      return createPrepCourseApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const activeLessonSlug = locationState.activeLessonSlug

  useEffect(() => {
    let alive = true
    async function load() {
      if (!courseSlug) {
        if (alive) {
          setError("Missing course.")
          setLoading(false)
        }
        return
      }
      if (!prepCourseApi) {
        if (alive) {
          setError("Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
          setLoading(false)
        }
        return
      }
      try {
        const data = await prepCourseApi.getCourse(courseSlug)
        if (!alive) return
        const normalized = normalizeCurriculum(data.curriculum, data.lessons, data.course.id)
        setCourse(data.course)
        setCurriculum(normalized)
        setCompletedLessonSlugs(new Set(data.completedLessonSlugs ?? []))

        const lessonLoc = activeLessonSlug ? findLessonLocation(normalized, activeLessonSlug) : null
        const defaultModuleId = lessonLoc?.moduleId ?? normalized.modules[0]?.id ?? null
        setSelectedModuleId(defaultModuleId)

        if (lessonLoc) {
          setExpandedSectionIds(new Set([lessonLoc.sectionId]))
        } else if (normalized.modules[0]?.sections[0]) {
          setExpandedSectionIds(new Set([normalized.modules[0].sections[0].id]))
        }
      } catch (e) {
        if (!alive) return
        setError(e instanceof Error ? e.message : "Failed to load course")
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [activeLessonSlug, courseSlug, prepCourseApi])

  const stats = useMemo(() => curriculumStats(curriculum), [curriculum])

  const selectedModule = useMemo(
    () => curriculum.modules.find((mod) => mod.id === selectedModuleId) ?? null,
    [curriculum.modules, selectedModuleId],
  )

  function handleToggleSection(sectionId: string) {
    setExpandedSectionIds((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  function handleToggleExpandAll() {
    if (!selectedModule) return
    if (expandAll) {
      setExpandedSectionIds(new Set())
      setExpandAll(false)
    } else {
      setExpandedSectionIds(new Set(selectedModule.sections.map((s) => s.id)))
      setExpandAll(true)
    }
  }

  useEffect(() => {
    if (!selectedModule) return
    const allExpanded = selectedModule.sections.every((s) => expandedSectionIds.has(s.id))
    setExpandAll(allExpanded && selectedModule.sections.length > 0)
  }, [expandedSectionIds, selectedModule])

  if (!courseSlug) {
    return (
      <StudentMain>
        <p className="text-sm text-[#95122b]">Missing course.</p>
      </StudentMain>
    )
  }

  if (loading) {
    return (
      <StudentMain>
        <p className="ds-body-sm ds-text-muted">Loading course content...</p>
      </StudentMain>
    )
  }

  if (error || !course) {
    return (
      <StudentMain>
        <p className="text-sm text-[#95122b]">{error ?? "Course not found."}</p>
        <Link to="/app/prep-course" className="mt-3 inline-block text-sm font-medium text-[#0d47a1]">
          Back to courses
        </Link>
      </StudentMain>
    )
  }

  if (curriculum.modules.length === 0) {
    return (
      <StudentMain>
        <p className="ds-body-sm ds-text-muted">This course has no lessons yet.</p>
      </StudentMain>
    )
  }

  return (
    <StudentMain className="max-w-[1280px] pb-10 pt-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#dfe1e7] pb-4">
        <h1 className="text-xl font-bold tracking-[0.02em] text-[#062357]">{course.title}</h1>
        <nav
          className="flex flex-wrap items-center gap-1.5 text-sm font-medium tracking-[0.02em] text-[#666d80]"
          aria-label="Breadcrumb"
        >
          <span>Learn</span>
          <span className="text-[#c5cee0]">/</span>
          <Link to="/app/prep-course" className="font-semibold text-[#0d47a1] hover:underline">
            Prep Course
          </Link>
          <span className="text-[#c5cee0]">/</span>
          <span className="font-semibold text-[#062357]">Course Content</span>
        </nav>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]">
        <PrepCourseContentHeader
          stats={stats}
          expandAll={expandAll}
          showBookmarksOnly={showBookmarksOnly}
          onToggleExpandAll={handleToggleExpandAll}
          onToggleShowBookmarksOnly={setShowBookmarksOnly}
        />
        <div className="flex flex-col lg:flex-row">
          <PrepCourseModuleSidebar
            modules={curriculum.modules}
            selectedModuleId={selectedModuleId}
            completedLessonSlugs={completedLessonSlugs}
            onSelectModule={(id) => {
              setSelectedModuleId(id)
              const mod = curriculum.modules.find((m) => m.id === id)
              if (mod?.sections[0]) {
                setExpandedSectionIds(new Set([mod.sections[0].id]))
              }
            }}
          />
          {selectedModule ? (
            <PrepCourseModulePanel
              course={course}
              module={selectedModule}
              expandedSectionIds={expandedSectionIds}
              activeLessonSlug={activeLessonSlug}
              completedLessonSlugs={completedLessonSlugs}
              onToggleSection={handleToggleSection}
            />
          ) : (
            <p className="ds-body-sm ds-text-muted p-6">Select a module to view sections.</p>
          )}
        </div>
      </section>
    </StudentMain>
  )
}

export { PrepCourseContentPage }
