import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { toggleFlaggedId } from "@/features/student/practice-session/practice-question-flags"
import type { createPracticeApi } from "@/lib/api/practice"

type PracticeApi = ReturnType<typeof createPracticeApi>

type UsePracticeQuestionFlagsOptions = {
  sessionId: string
  questionIds: string[]
  initialFlaggedIds: string[]
  practiceApi: PracticeApi
  enabled?: boolean
}

export function usePracticeQuestionFlags({
  sessionId,
  questionIds,
  initialFlaggedIds,
  practiceApi,
  enabled = true,
}: UsePracticeQuestionFlagsOptions) {
  const [flaggedIds, setFlaggedIds] = useState<string[]>(initialFlaggedIds)
  const persistedRef = useRef<string[]>(initialFlaggedIds)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setFlaggedIds(initialFlaggedIds)
    persistedRef.current = initialFlaggedIds
  }, [sessionId, initialFlaggedIds.join(",")])

  const flaggedSet = useMemo(() => new Set(flaggedIds), [flaggedIds])

  const persist = useCallback(
    (next: string[]) => {
      if (!enabled || !sessionId) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        void practiceApi
          .updateSession({ sessionId, flaggedQuestionIds: next })
          .then(() => {
            persistedRef.current = next
          })
          .catch(() => {
            setFlaggedIds(persistedRef.current)
          })
      }, 300)
    },
    [enabled, sessionId, practiceApi],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const isFlagged = useCallback((questionId: string) => flaggedSet.has(questionId), [flaggedSet])

  const toggleFlag = useCallback(
    (questionId: string) => {
      if (!enabled || !questionIds.includes(questionId)) return
      setFlaggedIds((prev) => {
        const next = toggleFlaggedId(prev, questionId)
        persist(next)
        return next
      })
    },
    [enabled, questionIds, persist],
  )

  return { flaggedIds, isFlagged, toggleFlag }
}
