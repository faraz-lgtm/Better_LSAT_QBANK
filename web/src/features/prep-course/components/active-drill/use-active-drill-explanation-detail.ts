import { useEffect, useMemo, useState } from "react"

import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import { createExplanationsApi } from "@/lib/api/explanations"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function tryCreateExplanationsApi() {
  try {
    return createExplanationsApi(getSupabaseBrowserClient())
  } catch {
    return null
  }
}

function useActiveDrillExplanationDetail(questionId: string | null | undefined) {
  const [detail, setDetail] = useState<ExplanationDetailPayload | null>(null)
  const api = useMemo(() => tryCreateExplanationsApi(), [])

  useEffect(() => {
    if (!questionId || !api) {
      queueMicrotask(() => setDetail(null))
      return
    }

    let alive = true
    void api
      .getExplanationDetail(questionId)
      .then((next) => {
        if (alive) setDetail(next)
      })
      .catch(() => {
        if (alive) setDetail(null)
      })

    return () => {
      alive = false
    }
  }, [api, questionId])

  return detail
}

export { useActiveDrillExplanationDetail }
