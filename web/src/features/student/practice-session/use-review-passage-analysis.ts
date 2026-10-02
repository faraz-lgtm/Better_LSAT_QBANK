import { useEffect, useMemo, useState } from "react"

import type { PassageAnalysisPayload } from "@/features/student/practice-session/passage-analysis-view"
import { hasPassageAnalysis } from "@/features/student/practice-session/passage-analysis-view"
import { createExplanationsApi } from "@/lib/api/explanations"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type UseReviewPassageAnalysisArgs = {
  /** Results review (`?review=1`) only. */
  enabled: boolean
  questionId: string | null | undefined
  sectionType: string | null | undefined
}

type UseReviewPassageAnalysisResult = {
  passageAnalysis: PassageAnalysisPayload | null
  analysisAvailable: boolean
}

/**
 * Loads published RC passage analysis for the review tester Analysis View toggle.
 * Skips fetch for non-RC / when review mode is off.
 */
export function useReviewPassageAnalysis({
  enabled,
  questionId,
  sectionType,
}: UseReviewPassageAnalysisArgs): UseReviewPassageAnalysisResult {
  const [passageAnalysis, setPassageAnalysis] = useState<PassageAnalysisPayload | null>(null)

  const explanationsApi = useMemo(() => {
    if (!enabled || sectionType !== "RC") return null
    try {
      return createExplanationsApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [enabled, sectionType])

  useEffect(() => {
    if (!enabled || sectionType !== "RC" || !questionId || !explanationsApi) {
      queueMicrotask(() => setPassageAnalysis(null))
      return
    }

    let alive = true
    void explanationsApi
      .getExplanationDetail(questionId)
      .then((detail) => {
        if (!alive) return
        const next = detail.passageAnalysis ?? null
        setPassageAnalysis(hasPassageAnalysis(next) ? next : null)
      })
      .catch(() => {
        if (!alive) return
        setPassageAnalysis(null)
      })

    return () => {
      alive = false
    }
  }, [enabled, sectionType, questionId, explanationsApi])

  return {
    passageAnalysis,
    analysisAvailable: hasPassageAnalysis(passageAnalysis),
  }
}
