import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { FigmaIcon } from "@/components/icons/figma-icons"
import { Switch } from "@/components/ui/switch"
import { DrillConfigField, DrillConfigSelectField } from "@/features/student/drills/drill-config-field"
import { DrillTimingMenu } from "@/features/student/drills/drill-timing-menu"
import { isValidDrillTiming } from "@/features/student/drills/drill-timing"
import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"
import {
  formatSectionPoolLabel,
  sectionConfigOptions,
  type SectionDifficulty,
  type SectionShowAnswers,
  type SectionType,
} from "@/features/student/sections/section-types"
import { useAccommodations } from "@/features/student/accommodations/accommodations-context"
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
    sectionDescription: "Select your focus",
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
  const { scaleFactor } = useAccommodations()

  const [starting, setStarting] = useState(false)
  const [loadingPool, setLoadingPool] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [poolTotal, setPoolTotal] = useState(0)
  const [bannerOpen, setBannerOpen] = useState(true)

  const [customize, setCustomize] = useState(false)
  const [sectionId, setSectionId] = useState(initialSectionId ?? "")
  const [timing, setTiming] = useState("unlimited")
  const [showAnswers, setShowAnswers] = useState<SectionShowAnswers>("end")
  const [difficulty, setDifficulty] = useState<SectionDifficulty>("adaptive")
  const [sectionOptions, setSectionOptions] = useState<{ label: string; value: string }[]>([])
  const [sectionQuestionCountById, setSectionQuestionCountById] = useState<Record<string, number>>({})

  const copy = sectionCopy[sectionType]
  const timingQuestionCount = useMemo(() => {
    const fromSection = sectionQuestionCountById[sectionId]
    if (fromSection && fromSection > 0) return fromSection
    return sectionType === "RC" ? 27 : 25
  }, [sectionQuestionCountById, sectionId, sectionType])
  const resolvedShowAnswers = customize ? showAnswers : "end"
  const resolvedDifficulty = customize ? difficulty : "adaptive"
  const readyQuestionCount = sectionId
    ? (sectionQuestionCountById[sectionId] ?? 0)
    : Object.values(sectionQuestionCountById).reduce((sum, count) => sum + count, 0)

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
      const counts: Record<string, number> = {}
      for (const item of pool.sections) {
        counts[item.id] = item.questionCount
      }
      setSectionOptions(options)
      setSectionQuestionCountById(counts)
      setPoolTotal(pool.total)
      setSectionId((current) => {
        if (current && options.some((o) => o.value === current)) return current
        if (initialSectionId && options.some((o) => o.value === initialSectionId)) return initialSectionId
        return options[0]?.value ?? ""
      })
    } catch {
      setSectionOptions([])
      setSectionQuestionCountById({})
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
      const out = await practiceApi.startSection({
        sectionId,
        timing: isValidDrillTiming(timing) ? timing : "unlimited",
        showAnswers: resolvedShowAnswers === "never" ? "end" : resolvedShowAnswers,
        difficulty: resolvedDifficulty,
      })
      navigate(`/app/practice/sections/session/${out.session.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start section")
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-base font-semibold leading-snug tracking-[0.02em] text-[#062357]">
          Spend More Time Where You Need It
        </h1>
        {bannerOpen ? (
          <div className="flex items-center justify-between gap-4">
            <p className="m-0 min-w-0 flex-1 text-sm font-normal leading-normal tracking-[0.02em] text-[#666d80]">
              Choose a section to target your practice.
            </p>
            <button
              type="button"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[#666d80] transition hover:bg-white/80 hover:text-[#062357]"
              aria-label="Dismiss banner"
              onClick={() => setBannerOpen(false)}
            >
              <FigmaIcon name="block-circle" className="size-6" />
            </button>
          </div>
        ) : null}
      </div>

      <section className="flex w-full flex-col gap-6 rounded-[24px] border border-[#dfe1e7] bg-white p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <SectionInitialBadge section={sectionType} variant="section" />
            <div>
              <p className="student-page-heading m-0">{copy.title}</p>
              <p className="mt-[3px] text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[#062357]">
                {copy.subtitle}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-0.5 lg:w-auto lg:shrink-0 lg:items-end">
            <div className="flex w-full items-start justify-between gap-4">
              <p className="m-0 text-xl font-bold leading-[1.35] text-[#062357]">Build My Own</p>
              <Switch
                checked={customize}
                onChange={(e) => setCustomize(e.target.checked)}
                className={customize ? "!bg-[#0d47a1]" : "!bg-[#dfe1e6]"}
                aria-label="Build My Own"
              />
            </div>
            <p className="m-0 whitespace-nowrap text-xs font-normal leading-normal tracking-[0.02em] text-[#666d80] lg:text-right">
              {readyQuestionCount} new {readyQuestionCount === 1 ? "question" : "questions"} ready
            </p>
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
          <DrillConfigField
            label="Pace"
            description="Choose your timing."
            className={sectionConfigCardClassName}
          >
            <DrillTimingMenu
              value={timing}
              onChange={setTiming}
              questionCount={timingQuestionCount}
              scaleFactor={scaleFactor}
              ariaLabel="Pace"
            />
          </DrillConfigField>
        </div>

        {customize ? (
          <div className="flex flex-wrap items-start gap-6">
            <SectionConfigSelectCard
              label="Answer Check"
              description="Choose when to check your work."
              value={showAnswers === "never" ? "end" : showAnswers}
              onChange={(v) => setShowAnswers(v as SectionShowAnswers)}
              options={[...sectionConfigOptions.showAnswers]}
            />
            <SectionConfigSelectCard
              label="Challenge"
              description="Choose your level."
              value={difficulty}
              onChange={(v) => setDifficulty(v as SectionDifficulty)}
              options={[...sectionConfigOptions.difficulty]}
            />
          </div>
        ) : null}

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
    </div>
  )
}

export { SectionConfigForm }
