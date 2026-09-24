import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"

import { DrillConfigForm } from "@/features/student/drills/drill-config-form"
import { StudentMain } from "@/features/student/components/student-main"
import { createAnalyticsApi } from "@/lib/api/analytics"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function LrNewDrillPage() {
  const [searchParams] = useSearchParams()
  const questionTypeId = searchParams.get("questionTypeId")
  const tagLabel = searchParams.get("tag")

  const analyticsApi = useMemo(() => createAnalyticsApi(getSupabaseBrowserClient()), [])
  const [tagOptions, setTagOptions] = useState<{ label: string; value: string }[]>([])

  useEffect(() => {
    let cancelled = false
    void analyticsApi
      .getPriorities()
      .then((rows) => {
        if (cancelled) return
        setTagOptions(
          rows
            .filter((r) => r.sectionType === "LR" || r.sectionType === null)
            .map((r) => ({ label: r.name, value: r.questionTypeId })),
        )
      })
      .catch(() => {
        if (!cancelled) setTagOptions([])
      })
    return () => {
      cancelled = true
    }
  }, [analyticsApi])

  return (
    <StudentMain className="bg-[var(--primary-0)]" contentClassName="bg-[var(--primary-0)]">
      <DrillConfigForm
        sectionType="LR"
        initialQuestionTypeId={questionTypeId}
        initialTagLabel={tagLabel}
        tagOptions={tagOptions}
      />
    </StudentMain>
  )
}

export { LrNewDrillPage }
