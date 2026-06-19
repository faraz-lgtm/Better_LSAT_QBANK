import { useCallback, useEffect, useState } from "react"

import {
  loadPrepCourseBookmarks,
  savePrepCourseBookmarks,
  type PrepCourseBookmarks,
} from "@/features/prep-course/lib/prep-course-bookmarks"
import type { createPrepCourseApi } from "@/lib/api/prep-course"

const EMPTY_BOOKMARKS: PrepCourseBookmarks = { moduleIds: [], lessonSlugs: [] }

function mergeBookmarks(local: PrepCourseBookmarks, server: PrepCourseBookmarks): PrepCourseBookmarks {
  return {
    moduleIds: [...new Set([...local.moduleIds, ...server.moduleIds])],
    lessonSlugs: [...new Set([...local.lessonSlugs, ...server.lessonSlugs])],
  }
}

type PrepCourseApi = ReturnType<typeof createPrepCourseApi>

type UsePrepCourseBookmarksOptions = {
  courseId: string | null | undefined
  courseSlug: string | null | undefined
  prepCourseApi: PrepCourseApi | null
  initialBookmarks?: PrepCourseBookmarks | null
}

export function usePrepCourseBookmarks({
  courseId,
  courseSlug,
  prepCourseApi,
  initialBookmarks = null,
}: UsePrepCourseBookmarksOptions) {
  const [bookmarks, setBookmarks] = useState<PrepCourseBookmarks>(() =>
    courseId ? loadPrepCourseBookmarks(courseId) : EMPTY_BOOKMARKS,
  )

  useEffect(() => {
    if (!courseId) {
      setBookmarks(EMPTY_BOOKMARKS)
      return
    }
    const local = loadPrepCourseBookmarks(courseId)
    if (initialBookmarks) {
      const merged = mergeBookmarks(local, initialBookmarks)
      setBookmarks(merged)
      savePrepCourseBookmarks(courseId, merged)
      return
    }
    setBookmarks(local)
  }, [courseId, initialBookmarks])

  useEffect(() => {
    if (!courseId) return
    savePrepCourseBookmarks(courseId, bookmarks)
  }, [bookmarks, courseId])

  const persistModuleBookmark = useCallback(
    async (moduleId: string, next: boolean) => {
      if (!prepCourseApi || !courseSlug) return
      try {
        const { bookmarks: saved } = await prepCourseApi.setModuleBookmark(courseSlug, moduleId, next)
        setBookmarks((prev) => mergeBookmarks(prev, saved))
      } catch {
        // Keep optimistic local state; localStorage remains the fallback.
      }
    },
    [courseSlug, prepCourseApi],
  )

  const persistLessonBookmark = useCallback(
    async (lessonSlug: string, next: boolean) => {
      if (!prepCourseApi || !courseSlug) return
      try {
        const { bookmarks: saved } = await prepCourseApi.setLessonBookmark(courseSlug, lessonSlug, next)
        setBookmarks((prev) => mergeBookmarks(prev, saved))
      } catch {
        // Keep optimistic local state; localStorage remains the fallback.
      }
    },
    [courseSlug, prepCourseApi],
  )

  const isModuleBookmarked = useCallback(
    (moduleId: string) => bookmarks.moduleIds.includes(moduleId),
    [bookmarks.moduleIds],
  )

  const isLessonBookmarked = useCallback(
    (lessonSlug: string) => bookmarks.lessonSlugs.includes(lessonSlug),
    [bookmarks.lessonSlugs],
  )

  const setModuleBookmarked = useCallback(
    (moduleId: string, next: boolean) => {
      setBookmarks((prev) => {
        const moduleIds = new Set(prev.moduleIds)
        if (next) moduleIds.add(moduleId)
        else moduleIds.delete(moduleId)
        return { ...prev, moduleIds: [...moduleIds] }
      })
      void persistModuleBookmark(moduleId, next)
    },
    [persistModuleBookmark],
  )

  const setLessonBookmarked = useCallback(
    (lessonSlug: string, next: boolean) => {
      setBookmarks((prev) => {
        const lessonSlugs = new Set(prev.lessonSlugs)
        if (next) lessonSlugs.add(lessonSlug)
        else lessonSlugs.delete(lessonSlug)
        return { ...prev, lessonSlugs: [...lessonSlugs] }
      })
      void persistLessonBookmark(lessonSlug, next)
    },
    [persistLessonBookmark],
  )

  return {
    bookmarks,
    isModuleBookmarked,
    isLessonBookmarked,
    setModuleBookmarked,
    setLessonBookmarked,
  }
}
