import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { DrillConfigSelectField } from "@/features/student/drills/drill-config-field"
import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"
import {
  buildSectionTimingOptions,
  useAccommodations,
} from "@/features/student/accommodations/accommodations-context"
import {
  formatSectionPoolLabel,
  type SectionTiming,
  type SectionType,
} from "@/features/student/sections/section-types"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const sectionCopy: Record<
  SectionType,
  { title: string; countLabel: string; sectionDescription: string; startLabel: string }
> = {
  LR: {
    title: "Logical Reasoning",
    countLabel: "16-20 Questions",
    sectionDescription: "Select passage section",
    startLabel: "Start LR Section",
  },
  RC: {
    title: "Reading Comprehension",
    countLabel: "4 Passages",
    sectionDescription: "Select passage section",
    startLabel: "Start RC Section",
  },
}

const selectCardClassName =
  "w-full min-w-0 flex-1 gap-[12px] rounded-[18px] border border-[#dfe1e7] bg-white p-[24px] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)] [&_p:first-child]:text-[16px] [&_p:first-child]:font-semibold [&_p:first-child]:leading-[1.5] [&_p:first-child]:tracking-[0.32px] [&_p:first-child]:text-[#041a44]"

type PracticeSectionStartCardProps = {
  sectionType: SectionType
}

function PracticeSectionStartCard({ sectionType }: PracticeSectionStartCardProps) {
  const navigate = useNavigate()
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])
  const { scaleFactor } = useAccommodations()
  const timingOptions = useMemo(() => buildSectionTimingOptions(scaleFactor), [scaleFactor])
  const copy = sectionCopy[sectionType]

  const [starting, setStarting] = useState(false)
  const [loadingPool, setLoadingPool] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [poolTotal, setPoolTotal] = useState(0)
  const [sectionId, setSectionId] = useState("")
  const [timing, setTiming] = useState<SectionTiming>("unlimited")
  const [sectionOptions, setSectionOptions] = useState<{ label: string; value: string }[]>([])

  const loadPool = useCallback(async () => {
    setLoadingPool(true)
    try {
      const pool = await practiceApi.listSectionPool({
        sectionType,
        page: 1,
        pageSize: 50,
        sort: "newest",
      })
      const options = pool.sections.map((item) => ({
        label: formatSectionPoolLabel(item),
        value: item.id,
      }))
      setSectionOptions(options)
      setPoolTotal(pool.total)
      setSectionId((current) => {
        if (current && options.some((o) => o.value === current)) return current
        return options[0]?.value ?? ""
      })
    } catch {
      setSectionOptions([])
      setPoolTotal(0)
      setSectionId("")
    } finally {
      setLoadingPool(false)
    }
  }, [practiceApi, sectionType])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPool()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadPool])

  async function handleStart() {
    if (!sectionId) return
    setStarting(true)
    setError(null)
    try {
      const out = await practiceApi.startSection({ sectionId, timing, showAnswers: "end" })
      navigate(`/app/practice/sections/session/${out.session.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start section")
    } finally {
      setStarting(false)
    }
  }

  return (
    <section className="flex w-full flex-col gap-[24px] rounded-[20px] border border-[#dfe1e7] bg-white p-[24px]">
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div className="flex items-center gap-[12px]">
          <SectionInitialBadge section={sectionType} variant="compact" />
          <h2 className="text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[#041a44]">
            {copy.title}
          </h2>
        </div>
        <p className="text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-[#666d80]">
          {copy.countLabel}
        </p>
      </div>

      <div className="flex flex-col gap-[24px] lg:flex-row">
        <DrillConfigSelectField
          className={selectCardClassName}
          label="Section"
          description={copy.sectionDescription}
          value={sectionId}
          onChange={setSectionId}
          options={sectionOptions}
          menuVariant="surface"
        />
        <DrillConfigSelectField
          className={selectCardClassName}
          label="Timing"
          description="Control your Prep pace"
          value={timing}
          onChange={(v) => setTiming(v as SectionTiming)}
          options={timingOptions}
          menuVariant="surface"
        />
      </div>

      {error ? (
        <p className="m-0 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {poolTotal === 0 && !loadingPool ? (
        <p className="m-0 text-sm text-[#666d80]">
          No sections are available in your pool yet.
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={starting || loadingPool || !sectionId || poolTotal === 0}
          className="inline-flex h-[48px] min-w-[172px] items-center justify-center rounded-[14px] border border-[#0b4e6e] bg-[#0d47a1] px-[16px] text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => void handleStart()}
        >
          {starting ? "Starting…" : copy.startLabel}
        </button>
      </div>
    </section>
  )
}

export { PracticeSectionStartCard }
