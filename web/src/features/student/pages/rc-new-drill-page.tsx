import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"

import { DrillConfigForm } from "@/features/student/drills/drill-config-form"
import { StudentMain } from "@/features/student/components/student-main"
import { createAnalyticsApi } from "@/lib/api/analytics"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function RcNewDrillPage() {
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
            .filter((r) => r.sectionType === "RC" || r.sectionType === null)
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
    <StudentMain className="max-w-none bg-[color-mix(in_srgb,var(--color-student-accent)_6%,var(--greyscale-25))] py-6 md:py-8">
      <DrillConfigForm
        sectionType="RC"
        initialQuestionTypeId={questionTypeId}
        initialTagLabel={tagLabel}
        tagOptions={tagOptions}
      />
    </StudentMain>
  )
}

export { RcNewDrillPage }
