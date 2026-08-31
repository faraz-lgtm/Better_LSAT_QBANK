import { useCallback, useEffect, useMemo, useState } from "react"

import {
  readExplanationBookmarkCache,
  writeExplanationBookmarkCache,
} from "@/features/student/explanation-detail/explanation-bookmark-cache"
import { createExplanationsApi } from "@/lib/api/explanations"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function useExplanationQuestionBookmarks() {
  const explanationsApi = useMemo(() => {
    try {
      return createExplanationsApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setBookmarkedIds(new Set(readExplanationBookmarkCache().questionIds))
    if (!explanationsApi) return
    void explanationsApi
      .listQuestionBookmarks()
      .then(({ questionIds }) => {
        setBookmarkedIds(new Set(questionIds))
        const cache = readExplanationBookmarkCache()
        writeExplanationBookmarkCache({ ...cache, questionIds })
      })
      .catch(() => {
        /* Keep cached bookmarks if the function is unavailable. */
      })
  }, [explanationsApi])

  const toggleQuestionBookmark = useCallback(
    (questionId: string) => {
      const nextBookmarked = !bookmarkedIds.has(questionId)
      setBookmarkedIds((current) => {
        const next = new Set(current)
        if (nextBookmarked) next.add(questionId)
        else next.delete(questionId)
        writeExplanationBookmarkCache({
          ...readExplanationBookmarkCache(),
          questionIds: [...next],
        })
        return next
      })
      if (!explanationsApi) return
      void explanationsApi
        .setQuestionBookmark(questionId, nextBookmarked)
        .then(({ questionIds }) => {
          setBookmarkedIds(new Set(questionIds))
          writeExplanationBookmarkCache({
            ...readExplanationBookmarkCache(),
            questionIds,
          })
        })
        .catch(() => {
          setBookmarkedIds((current) => {
            const reverted = new Set(current)
            if (nextBookmarked) reverted.delete(questionId)
            else reverted.add(questionId)
            return reverted
          })
        })
    },
    [bookmarkedIds, explanationsApi],
  )

  return { bookmarkedIds, toggleQuestionBookmark }
}

export { useExplanationQuestionBookmarks }
