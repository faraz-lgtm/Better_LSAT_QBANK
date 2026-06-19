import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { FigmaIcon, PlayCircleIcon } from "@/components/icons/figma-icons"
import { Switch } from "@/components/ui/switch"
import { DrillConfigSelectField } from "@/features/student/drills/drill-config-field"
import {
  drillConfigOptions,
  type DrillDifficulty,
  type DrillSectionType,
  type DrillShowAnswers,
  type DrillStatus,
  type DrillTiming,
} from "@/features/student/drills/drill-types"
import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type DrillConfigFormProps = {
  sectionType: DrillSectionType
  initialQuestionTypeId?: string | null
  initialTagLabel?: string | null
  tagOptions?: { label: string; value: string }[]
}

const sectionCopy: Record<DrillSectionType, { title: string }> = {
  LR: { title: "Logical Reasoning" },
  RC: { title: "Reading Comprehension" },
}

function DrillConfigForm({
  sectionType,
  initialQuestionTypeId = null,
  initialTagLabel = null,
  tagOptions = [],
}: DrillConfigFormProps) {
  const navigate = useNavigate()
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])

  const [bannerOpen, setBannerOpen] = useState(true)
  const [customize, setCustomize] = useState(Boolean(initialQuestionTypeId))
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [poolStats, setPoolStats] = useState({ selectedCount: 0, totalCount: 0 })

  const [questionCount, setQuestionCount] = useState("5")
  const [timing, setTiming] = useState<DrillTiming>("unlimited")
  const [showAnswers, setShowAnswers] = useState<DrillShowAnswers>("end")
  const [selection, setSelection] = useState("auto")
  const [tags, setTags] = useState(initialQuestionTypeId ?? "any")
  const [difficulty, setDifficulty] = useState<DrillDifficulty>("adaptive")
  const [status, setStatus] = useState<DrillStatus>("fresh")

  const copy = sectionCopy[sectionType]

  const tagSelectOptions = useMemo(() => {
    const base = [{ label: "Any", value: "any" }, ...tagOptions]
    if (initialQuestionTypeId && !tagOptions.some((t) => t.value === initialQuestionTypeId)) {
      return [{ label: initialTagLabel ?? "Selected tag", value: initialQuestionTypeId }, ...base]
    }
    return base
  }, [tagOptions, initialQuestionTypeId, initialTagLabel])

  const resolvedQuestionTypeId = tags === "any" ? null : tags

  const loadPoolStats = useCallback(async () => {
    try {
      const stats = await practiceApi.getDrillPoolStats({
        sectionType,
        questionTypeId: resolvedQuestionTypeId,
        difficulty,
        status,
      })
      setPoolStats(stats)
    } catch {
      setPoolStats({ selectedCount: 0, totalCount: 0 })
    }
  }, [practiceApi, sectionType, resolvedQuestionTypeId, difficulty, status])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPoolStats()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadPoolStats])

  async function handleStart() {
    setStarting(true)
    setError(null)
    try {
      const count = Number.parseInt(questionCount, 10)
      const out = await practiceApi.startDrill({
        sectionType,
        questionCount: Number.isFinite(count) ? count : 5,
        timing,
        showAnswers,
        selection: selection as "auto" | "manual",
        questionTypeId: resolvedQuestionTypeId,
        tagLabel: initialTagLabel,
        difficulty,
        status,
        title: initialTagLabel ?? undefined,
      })
      navigate(`/app/practice/drills/session/${out.session.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start drill")
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {bannerOpen ? (
        <div className="flex items-center justify-between gap-4">
          <p className="m-0 min-w-0 flex-1 text-sm font-normal leading-normal tracking-[0.02em] text-[#666d80]">
            We&apos;ll target your weaknesses with adaptive drills powered by our smart Insights.{" "}
            <span className="font-semibold">On/Off the settings to customize.</span>
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

      <section className="flex w-full flex-col gap-6 rounded-[24px] border border-[#dfe1e7] bg-white p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <SectionInitialBadge section={sectionType} />
            <p className="m-0 text-[24px] font-bold leading-[1.3] text-[#062357]">{copy.title}</p>
          </div>
          <div className="flex w-full max-w-[313px] flex-col gap-0.5 lg:items-end">
            <div className="flex w-full items-start justify-between gap-4">
              <p className="m-0 text-xl font-bold leading-[1.35] text-[#062357]">Customize</p>
              <Switch
                checked={customize}
                onChange={(e) => setCustomize(e.target.checked)}
                className={customize ? "!bg-[#0d47a1]" : "!bg-[#dfe1e6]"}
                aria-label="Customize drill settings"
              />
            </div>
            <p className="m-0 text-xs font-normal leading-normal tracking-[0.02em] text-[#666d80] lg:text-right">
              Selecting from {poolStats.selectedCount} of {poolStats.totalCount} questions in your drill pool.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <DrillConfigSelectField
            label="Number of Questions"
            description="Select as many questions you can"
            value={questionCount}
            onChange={setQuestionCount}
            options={[...drillConfigOptions.questionCount]}
          />
          <DrillConfigSelectField
            label="Timing"
            description="Control your Prep pace"
            value={timing}
            onChange={(v) => setTiming(v as DrillTiming)}
            options={[...drillConfigOptions.timing]}
          />
          <DrillConfigSelectField
            label="Show Answers"
            description="When to reveal answers"
            value={showAnswers}
            onChange={(v) => setShowAnswers(v as DrillShowAnswers)}
            options={[...drillConfigOptions.showAnswers]}
          />
        </div>

        {customize ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <DrillConfigSelectField
              label="Selection"
              description="How questions are chosen for this drill"
              value={selection}
              onChange={setSelection}
              options={[...drillConfigOptions.selection]}
            />
            <DrillConfigSelectField
              label="Tags"
              description="Filter by reasoning tags"
              value={tags}
              onChange={setTags}
              options={tagSelectOptions}
            />
            <DrillConfigSelectField
              label="Difficulty"
              description="Match difficulty to your goals"
              value={difficulty}
              onChange={(v) => setDifficulty(v as DrillDifficulty)}
              options={[...drillConfigOptions.difficulty]}
            />
            <DrillConfigSelectField
              label="Status"
              description="Include questions you have seen before"
              value={status}
              onChange={(v) => setStatus(v as DrillStatus)}
              options={[...drillConfigOptions.status]}
            />
          </div>
        ) : null}

        {error ? (
          <p className="m-0 text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-6">
          <Link
            to="/app/practice/drills"
            className="inline-flex h-[52px] items-center px-4 text-base font-semibold tracking-[0.02em] text-[#0d47a1] transition-colors hover:underline"
          >
            Back
          </Link>
          <button
            type="button"
            className="inline-flex h-[52px] items-center gap-2 px-4 text-base font-semibold tracking-[0.02em] text-[#0d47a1] transition-opacity hover:opacity-80"
          >
            <FigmaIcon name="share-circle" className="size-5 shrink-0" />
            Share
          </button>
          <Button type="button" variant="outline" className="ds-btn-outline gap-2 text-base">
            <FigmaIcon name="gear" className="size-5 shrink-0" />
            Save Setting
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={starting || poolStats.selectedCount === 0}
            className="ds-btn gap-2 text-base"
            onClick={() => void handleStart()}
          >
            <PlayCircleIcon className="size-5 shrink-0 text-white" />
            {starting ? "Starting…" : "Start a Drill"}
          </Button>
        </div>
      </section>
    </div>
  )
}

export { DrillConfigForm }
