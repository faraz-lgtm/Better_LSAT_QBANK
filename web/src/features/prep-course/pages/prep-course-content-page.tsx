import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"

import { useStudentEntitlementOptional } from "@/features/app-shell/student-entitlement-context"
import { useGuestPremiumAccount } from "@/features/guest/premium/guest-premium-account"
import { useGuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal-provider"
import { PrepCourseContentHeader } from "@/features/prep-course/components/prep-course-content-header"
import { PrepCourseModulePanel } from "@/features/prep-course/components/prep-course-module-panel"
import { PrepCourseModuleSidebar } from "@/features/prep-course/components/prep-course-module-sidebar"
import { moduleMatchesBookmarkFilter } from "@/features/prep-course/lib/prep-course-bookmarks"
import {
  isPrepCourseModuleLockedForFreePlan,
  shouldLimitFreePrepCourseAccess,
} from "@/features/prep-course/lib/prep-course-free-access"
import {
  curriculumStats,
  findLessonLocation,
  normalizeCurriculum,
} from "@/features/prep-course/lib/prep-course-format"
import { usePrepCourseBookmarks } from "@/features/prep-course/lib/use-prep-course-bookmarks"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import {
  createPrepCourseApi,
  type PrepCourse,
  type PrepCourseBookmarks,
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
  const entitlement = useStudentEntitlementOptional()
  const premiumAccount = useGuestPremiumAccount()
  const { openLockedContentModal } = useGuestPricingModal()
  const limitFreeAccess = shouldLimitFreePrepCourseAccess({
    hasActiveCore: entitlement?.entitlement?.hasActiveCore,
    accessState: entitlement?.entitlement?.accessState ?? null,
    hasGuestPremiumAccount: Boolean(premiumAccount),
  })

  const [course, setCourse] = useState<PrepCourse | null>(null)
  const [curriculum, setCurriculum] = useState<PrepCourseCurriculum>({ modules: [] })
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(() => new Set())
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [completedLessonSlugs, setCompletedLessonSlugs] = useState<Set<string>>(() => new Set())
  const [initialBookmarks, setInitialBookmarks] = useState<PrepCourseBookmarks | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const prepCourseApi = useMemo(() => {
    try {
      return createPrepCourseApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const { bookmarks, isModuleBookmarked, setModuleBookmarked, setLessonBookmarked } = usePrepCourseBookmarks({
    courseId: course?.id,
    courseSlug,
    prepCourseApi,
    initialBookmarks,
  })
  const bookmarkedLessonSlugs = useMemo(() => new Set(bookmarks.lessonSlugs), [bookmarks.lessonSlugs])

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
        setInitialBookmarks(data.bookmarks ?? { moduleIds: [], lessonSlugs: [] })

        const lessonLoc = activeLessonSlug ? findLessonLocation(normalized, activeLessonSlug) : null
        const firstUnlockedId =
          normalized.modules.find(
            (module) => !isPrepCourseModuleLockedForFreePlan(courseSlug, module, limitFreeAccess),
          )?.id ?? null
        const lessonModule = lessonLoc
          ? normalized.modules.find((module) => module.id === lessonLoc.moduleId)
          : null
        const lessonUnlocked = lessonModule
          ? !isPrepCourseModuleLockedForFreePlan(courseSlug, lessonModule, limitFreeAccess)
          : false
        const defaultModuleId = lessonUnlocked ? lessonLoc?.moduleId ?? firstUnlockedId : firstUnlockedId
        setSelectedModuleId(defaultModuleId)

        const defaultModule = normalized.modules.find((module) => module.id === defaultModuleId)
        setExpandedSectionIds(
          defaultModule ? new Set(defaultModule.sections.map((section) => section.id)) : new Set(),
        )
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
  }, [activeLessonSlug, courseSlug, limitFreeAccess, prepCourseApi])

  const stats = useMemo(() => curriculumStats(curriculum), [curriculum])

  const lockedModuleIds = useMemo(() => {
    return new Set(
      curriculum.modules
        .filter((module) => isPrepCourseModuleLockedForFreePlan(courseSlug, module, limitFreeAccess))
        .map((module) => module.id),
    )
  }, [courseSlug, curriculum.modules, limitFreeAccess])

  const selectedModule = useMemo(
    () => curriculum.modules.find((mod) => mod.id === selectedModuleId) ?? null,
    [curriculum.modules, selectedModuleId],
  )

  const visibleModules = useMemo(() => {
    if (!showBookmarksOnly) return curriculum.modules
    return curriculum.modules.filter((module) => moduleMatchesBookmarkFilter(module, bookmarks))
  }, [bookmarks, curriculum.modules, showBookmarksOnly])

  useEffect(() => {
    if (!showBookmarksOnly) return
    if (visibleModules.length === 0) {
      setSelectedModuleId(null)
      return
    }
    const selectedVisible = visibleModules.some((module) => module.id === selectedModuleId)
    if (!selectedModuleId || !selectedVisible) {
      setSelectedModuleId(visibleModules[0]!.id)
    }
  }, [bookmarks, selectedModuleId, showBookmarksOnly, visibleModules])

  useEffect(() => {
    if (!selectedModuleId || lockedModuleIds.size === 0) return
    if (!lockedModuleIds.has(selectedModuleId)) return
    const firstUnlockedId = curriculum.modules.find((module) => !lockedModuleIds.has(module.id))?.id ?? null
    setSelectedModuleId(firstUnlockedId)
  }, [curriculum.modules, lockedModuleIds, selectedModuleId])

  useEffect(() => {
    if (!selectedModule) return
    const shouldExpandForBookmarks =
      showBookmarksOnly || isModuleBookmarked(selectedModule.id)
    if (!shouldExpandForBookmarks) return
    const sectionIdsWithBookmarks = selectedModule.sections
      .filter((section) => section.lessons.some((lesson) => bookmarkedLessonSlugs.has(lesson.slug)))
      .map((section) => section.id)
    if (sectionIdsWithBookmarks.length === 0) return
    setExpandedSectionIds((prev) => {
      const next = new Set(prev)
      for (const id of sectionIdsWithBookmarks) next.add(id)
      return next
    })
  }, [bookmarkedLessonSlugs, isModuleBookmarked, selectedModule, showBookmarksOnly])

  function handleSelectModule(moduleId: string) {
    const mod = curriculum.modules.find((module) => module.id === moduleId)
    if (!mod) return
    if (lockedModuleIds.has(moduleId)) {
      openLockedContentModal()
      return
    }
    setSelectedModuleId(moduleId)
    setExpandedSectionIds((prev) => {
      const next = new Set(prev)
      for (const section of mod.sections) next.add(section.id)
      return next
    })
  }

  function handleLockedContentClick() {
    openLockedContentModal()
  }

  function handleToggleModuleBookmark(moduleId: string, next: boolean) {
    setModuleBookmarked(moduleId, next)
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

  function handleToggleExpandAll() {
    const allSectionIds = curriculum.modules.flatMap((mod) => mod.sections.map((section) => section.id))
    const allExpanded = allSectionIds.length > 0 && allSectionIds.every((id) => expandedSectionIds.has(id))
    setExpandedSectionIds(() => {
      if (allExpanded) return new Set()
      return new Set(allSectionIds)
    })
  }

  const allSectionsExpanded = useMemo(() => {
    const allSectionIds = curriculum.modules.flatMap((mod) => mod.sections.map((section) => section.id))
    return allSectionIds.length > 0 && allSectionIds.every((id) => expandedSectionIds.has(id))
  }, [curriculum.modules, expandedSectionIds])

  if (!courseSlug) {
    return (
      <StudentMain>
        <p className="text-sm text-[#95122b]">Missing course.</p>
      </StudentMain>
    )
  }

  if (loading) {
    return (
      <StudentMain contentClassName="flex min-h-0 flex-1 flex-col">
        <StudentPageLoader centered className="min-h-0 flex-1" label="Loading course content…" />
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
    <StudentMain layout="locked" contentClassName="flex min-h-0 flex-1 flex-col bg-[var(--greyscale-0)] pb-[24px]">
      <section className="prep-course-shell-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border border-[#dfe1e7] shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]">
        <div className="shrink-0">
          <PrepCourseContentHeader
            stats={stats}
            showBookmarksOnly={showBookmarksOnly}
            onToggleShowBookmarksOnly={setShowBookmarksOnly}
            allSectionsExpanded={allSectionsExpanded}
            onToggleExpandAll={handleToggleExpandAll}
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-[#dfe1e7] bg-white p-[24px]">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border border-[#dfe1e7] lg:flex-row lg:items-stretch">
            {selectedModule ? (
              <PrepCourseModulePanel
                course={course}
                module={selectedModule}
                expandedSectionIds={expandedSectionIds}
                activeLessonSlug={activeLessonSlug}
                completedLessonSlugs={completedLessonSlugs}
                onToggleSection={handleToggleSection}
                onExpandModuleSections={handleExpandModuleSections}
                moduleBookmarked={isModuleBookmarked(selectedModule.id)}
                showBookmarksOnly={showBookmarksOnly}
                bookmarkedLessonSlugs={bookmarkedLessonSlugs}
                onToggleLessonBookmark={setLessonBookmarked}
                onToggleModuleBookmark={(next) => handleToggleModuleBookmark(selectedModule.id, next)}
                moduleLocked={lockedModuleIds.has(selectedModule.id)}
                onLockedLessonClick={handleLockedContentClick}
              />
            ) : (
              <p className="ds-body-sm ds-text-muted flex-1 p-6">Select a module to view sections.</p>
            )}
            <PrepCourseModuleSidebar
              modules={visibleModules}
              selectedModuleId={selectedModuleId}
              completedLessonSlugs={completedLessonSlugs}
              lockedModuleIds={lockedModuleIds}
              onSelectModule={handleSelectModule}
              onLockedModuleClick={handleLockedContentClick}
            />
          </div>
        </div>
      </section>
    </StudentMain>
  )
}

export { PrepCourseContentPage }
