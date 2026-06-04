import { useCallback, useEffect, useRef, useState } from "react"

import type { createPracticeApi } from "@/lib/api/practice"

type PracticeApi = ReturnType<typeof createPracticeApi>

type UsePracticeQuestionSeenOptions = {
  sessionId: string
  questionIds: string[]
  initialSeenIds: string[]
  activeQuestionId: string | null
  practiceApi: PracticeApi
  enabled?: boolean
}

export function usePracticeQuestionSeen({
  sessionId,
  questionIds,
  initialSeenIds,
  activeQuestionId,
  practiceApi,
  enabled = true,
}: UsePracticeQuestionSeenOptions) {
  const [seenIds, setSeenIds] = useState<string[]>(initialSeenIds)
  const persistedRef = useRef<string[]>(initialSeenIds)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSeenIds(initialSeenIds)
    persistedRef.current = initialSeenIds
  }, [sessionId, initialSeenIds.join(",")])

  const persist = useCallback(
    (next: string[]) => {
      if (!enabled || !sessionId) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        void practiceApi
          .updateSession({ sessionId, seenQuestionIds: next })
          .then(() => {
            persistedRef.current = next
          })
          .catch(() => {
            setSeenIds(persistedRef.current)
          })
      }, 300)
    },
    [enabled, sessionId, practiceApi],
  )

  useEffect(() => {
    if (!enabled || !activeQuestionId || !questionIds.includes(activeQuestionId)) return
    if (seenIds.includes(activeQuestionId)) return
    const next = [...seenIds, activeQuestionId]
    setSeenIds(next)
    persist(next)
  }, [activeQuestionId, enabled, persist, questionIds, seenIds])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return { seenIds }
}
