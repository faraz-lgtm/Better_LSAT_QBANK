import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { FigmaIcon } from "@/components/icons/figma-icons"
import { DrillConfigSelectField } from "@/features/student/drills/drill-config-field"
import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"
import {
  formatSectionPoolLabel,
  sectionConfigOptions,
  type SectionTiming,
  type SectionType,
} from "@/features/student/sections/section-types"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type SectionConfigFormProps = {
  sectionType: SectionType
  initialSectionId?: string | null
}

const sectionCopy: Record<SectionType, { title: string; subtitle: string; sectionDescription: string }> = {
  LR: {
    title: "Logical Reasoning",
    subtitle: "24–26 Questions",
    sectionDescription: "Select question section",
  },
  RC: {
    title: "Reading Comprehension",
    subtitle: "4 Passages",
    sectionDescription: "Select passage section",
  },
}

type SectionConfigSelectCardProps = {
  label: string
  description: string
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
}

const sectionConfigCardClassName =
  "w-full max-w-[502px] shrink-0 gap-3 rounded-[24px] bg-[#f6f8fa] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"

function SectionConfigSelectCard({ label, description, value, onChange, options }: SectionConfigSelectCardProps) {
  return (
    <DrillConfigSelectField
      className={sectionConfigCardClassName}
      label={label}
      description={description}
      value={value}
      onChange={onChange}
      options={options}
      menuVariant="surface"
    />
  )
}

function SectionConfigForm({ sectionType, initialSectionId = null }: SectionConfigFormProps) {
  const navigate = useNavigate()
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])

  const [starting, setStarting] = useState(false)
  const [loadingPool, setLoadingPool] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [poolTotal, setPoolTotal] = useState(0)

  const [sectionId, setSectionId] = useState(initialSectionId ?? "")
  const [timing, setTiming] = useState<SectionTiming>("unlimited")
  const [sectionOptions, setSectionOptions] = useState<{ label: string; value: string }[]>([])

  const copy = sectionCopy[sectionType]

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
        if (initialSectionId && options.some((o) => o.value === initialSectionId)) return initialSectionId
        return options[0]?.value ?? ""
      })
    } catch {
      setSectionOptions([])
      setPoolTotal(0)
      setSectionId("")
    } finally {
      setLoadingPool(false)
    }
  }, [practiceApi, sectionType, initialSectionId])

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
    <section className="flex w-full flex-col gap-6 rounded-[24px] border border-[#dfe1e7] bg-white p-6">
      <div className="flex h-12 w-full items-center justify-between gap-4">
        <div className="flex shrink-0 items-center gap-4">
          <SectionInitialBadge section={sectionType} variant="section" />
          <div>
            <h1 className="student-page-heading">{copy.title}</h1>
            <p className="mt-[3px] text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[#062357]">
              {copy.subtitle}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
          <p className="m-0 min-w-0 text-sm leading-normal tracking-[0.28px] text-[#666d80]">
            Go to your{" "}
            <Link to="/app/practice/drills" className="font-semibold text-[#0d47a1] hover:underline">
              Prep pool settings
            </Link>{" "}
            to change what sections are available.
          </p>
          <button
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[#666d80] transition-colors hover:bg-[#f6f8fa] hover:text-[#062357]"
            aria-label="Close"
            onClick={() => navigate("/app/practice/sections")}
          >
            <FigmaIcon name="block-circle" className="size-6" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <SectionConfigSelectCard
          label="Section"
          description={copy.sectionDescription}
          value={sectionId}
          onChange={setSectionId}
          options={sectionOptions}
        />
        <SectionConfigSelectCard
          label="Timing"
          description="Control your Prep pace"
          value={timing}
          onChange={(v) => setTiming(v as SectionTiming)}
          options={[...sectionConfigOptions.timing]}
        />
      </div>

      {error ? (
        <p className="m-0 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {poolTotal === 0 && !loadingPool ? (
        <p className="m-0 text-sm text-[#666d80]">
          No sections are available in your pool yet. Update your{" "}
          <Link to="/app/practice/drills" className="font-semibold text-[#0d47a1] hover:underline">
            Prep pool settings
          </Link>{" "}
          to add sections.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-6">
        <Link
          to="/app/practice/sections"
          className="inline-flex h-[52px] items-center px-4 text-base font-semibold tracking-[0.02em] text-[#0d47a1] transition-colors hover:underline"
        >
          Back
        </Link>
        <Button
          type="button"
          variant="default"
          disabled={starting || loadingPool || !sectionId || poolTotal === 0}
          className="ds-btn gap-2 text-base"
          onClick={() => void handleStart()}
        >
          <FigmaIcon name="notification-text-square" className="size-5 shrink-0 text-white" aria-hidden />
          {starting ? "Starting…" : "Start Section"}
        </Button>
      </div>
    </section>
  )
}

export { SectionConfigForm }
