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
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
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
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [bookmarkedModuleIds, setBookmarkedModuleIds] = useState<Set<string>>(() => new Set())
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

  const visibleModules = useMemo(() => {
    if (!showBookmarksOnly) return curriculum.modules
    return curriculum.modules.filter((module) => bookmarkedModuleIds.has(module.id))
  }, [bookmarkedModuleIds, curriculum.modules, showBookmarksOnly])

  useEffect(() => {
    if (!showBookmarksOnly) return
    if (visibleModules.length === 0) {
      setSelectedModuleId(null)
      return
    }
    if (!selectedModuleId || !bookmarkedModuleIds.has(selectedModuleId)) {
      setSelectedModuleId(visibleModules[0]!.id)
    }
  }, [bookmarkedModuleIds, selectedModuleId, showBookmarksOnly, visibleModules])

  function handleToggleModuleBookmark(moduleId: string, next: boolean) {
    setBookmarkedModuleIds((prev) => {
      const updated = new Set(prev)
      if (next) updated.add(moduleId)
      else updated.delete(moduleId)
      return updated
    })
  }

  function handleToggleSection(sectionId: string) {
    setExpandedSectionIds((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  function handleExpandModuleSections() {
    if (!selectedModule) return
    const moduleSectionIds = selectedModule.sections.map((section) => section.id)
    const allExpanded = moduleSectionIds.every((id) => expandedSectionIds.has(id))
    setExpandedSectionIds((prev) => {
      const next = new Set(prev)
      if (allExpanded) {
        for (const id of moduleSectionIds) next.delete(id)
      } else {
        for (const id of moduleSectionIds) next.add(id)
      }
      return next
    })
  }

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
        <StudentPageLoader centered label="Loading course content…" />
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
    <StudentMain layout="locked" contentClassName="bg-[var(--greyscale-25)] pb-[24px]">
      <section className="prep-course-shell-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border border-[color:var(--greyscale-100)] shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]">
        <div className="shrink-0">
          <PrepCourseContentHeader
            stats={stats}
            showBookmarksOnly={showBookmarksOnly}
            onToggleShowBookmarksOnly={setShowBookmarksOnly}
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col bg-[var(--greyscale-0)] p-[24px]">
          <div className="flex min-h-0 flex-1 flex-col gap-0 lg:flex-row lg:items-stretch">
            {selectedModule ? (
              <PrepCourseModulePanel
                course={course}
                module={selectedModule}
                expandedSectionIds={expandedSectionIds}
                activeLessonSlug={activeLessonSlug}
                completedLessonSlugs={completedLessonSlugs}
                onToggleSection={handleToggleSection}
                onExpandModuleSections={handleExpandModuleSections}
                moduleBookmarked={bookmarkedModuleIds.has(selectedModule.id)}
                onToggleModuleBookmark={(next) => handleToggleModuleBookmark(selectedModule.id, next)}
              />
            ) : (
              <p className="ds-body-sm ds-text-muted flex-1 p-6">Select a module to view sections.</p>
            )}
            <PrepCourseModuleSidebar
              modules={visibleModules}
              selectedModuleId={selectedModuleId}
              completedLessonSlugs={completedLessonSlugs}
              onSelectModule={setSelectedModuleId}
            />
          </div>
        </div>
      </section>
    </StudentMain>
  )
}

export { PrepCourseContentPage }
