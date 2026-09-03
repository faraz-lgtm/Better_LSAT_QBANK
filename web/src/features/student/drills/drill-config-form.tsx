import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FigmaIcon, PlayCircleIcon } from "@/components/icons/figma-icons"
import { Switch } from "@/components/ui/switch"
import { DrillConfigField, DrillConfigSelectField } from "@/features/student/drills/drill-config-field"
import {
  clearSavedDrillConfig,
  readSavedDrillConfig,
  writeSavedDrillConfig,
  type SavedDrillConfig,
} from "@/features/student/drills/drill-config-saved-settings"
import {
  drillConfigOptions,
  type DrillDifficulty,
  type DrillSectionType,
  type DrillShowAnswers,
  type DrillStatus,
} from "@/features/student/drills/drill-types"
import { DrillTimingMenu } from "@/features/student/drills/drill-timing-menu"
import { isValidDrillTiming } from "@/features/student/drills/drill-timing"
import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"
import { useAccommodations } from "@/features/student/accommodations/accommodations-context"
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
  const { scaleFactor } = useAccommodations()
  const savedConfig = useMemo(() => readSavedDrillConfig(sectionType), [sectionType])

  const [bannerOpen, setBannerOpen] = useState(true)
  const [saveSettings, setSaveSettings] = useState(() => savedConfig != null)
  const [customize, setCustomize] = useState(Boolean(initialQuestionTypeId) || Boolean(savedConfig?.customize))
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [poolStats, setPoolStats] = useState({ selectedCount: 0, totalCount: 0 })

  const [questionCount, setQuestionCount] = useState(savedConfig?.questionCount ?? "5")
  const [passageCount, setPassageCount] = useState(savedConfig?.passageCount ?? "1")
  const [timing, setTiming] = useState(savedConfig?.timing ?? "unlimited")
  const [showAnswers, setShowAnswers] = useState<DrillShowAnswers>(savedConfig?.showAnswers ?? "end")
  const [selection, setSelection] = useState(savedConfig?.selection ?? "auto")
  const [tags, setTags] = useState(initialQuestionTypeId ?? savedConfig?.tags ?? "any")
  const [difficulty, setDifficulty] = useState<DrillDifficulty>(savedConfig?.difficulty ?? "adaptive")
  // Default to full pool so Start works even after prior practice; "Fresh" is opt-in via Customize.
  const [status, setStatus] = useState<DrillStatus>(savedConfig?.status ?? "all")

  const copy = sectionCopy[sectionType]

  const tagSelectOptions = useMemo(() => {
    const base = [{ label: "All skills", value: "any" }, ...tagOptions]
    if (initialQuestionTypeId && !tagOptions.some((t) => t.value === initialQuestionTypeId)) {
      return [{ label: initialTagLabel ?? "Selected tag", value: initialQuestionTypeId }, ...base]
    }
    return base
  }, [tagOptions, initialQuestionTypeId, initialTagLabel])

  // Customize off = adaptive defaults over the full section pool (ignore tag/status filters).
  const resolvedQuestionTypeId = customize && tags !== "any" ? tags : null
  const resolvedTagLabel = resolvedQuestionTypeId
    ? (tagSelectOptions.find((t) => t.value === resolvedQuestionTypeId)?.label ??
        initialTagLabel ??
        null)
    : null
  const resolvedDifficulty = customize ? difficulty : "adaptive"
  const resolvedStatus = customize ? status : "all"
  const resolvedShowAnswers = customize ? showAnswers : "end"

  const timingQuestionCount = useMemo(() => {
    if (sectionType === "RC" || questionCount === "unlimited") {
      return Math.max(1, poolStats.selectedCount || 5)
    }
    const parsed = Number.parseInt(questionCount, 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5
  }, [sectionType, questionCount, poolStats.selectedCount])

  const loadPoolStats = useCallback(async () => {
    try {
      const stats = await practiceApi.getDrillPoolStats({
        sectionType,
        questionTypeId: resolvedQuestionTypeId,
        difficulty: resolvedDifficulty,
        status: resolvedStatus,
      })
      setPoolStats(stats)
    } catch {
      setPoolStats({ selectedCount: 0, totalCount: 0 })
    }
  }, [practiceApi, sectionType, resolvedQuestionTypeId, resolvedDifficulty, resolvedStatus])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPoolStats()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadPoolStats])

  useEffect(() => {
    if (!saveSettings) return
    const config: SavedDrillConfig = {
      questionCount,
      passageCount,
      timing,
      showAnswers,
      customize,
      selection,
      tags,
      difficulty,
      status,
    }
    writeSavedDrillConfig(sectionType, config)
  }, [
    customize,
    difficulty,
    passageCount,
    questionCount,
    saveSettings,
    sectionType,
    selection,
    showAnswers,
    status,
    tags,
    timing,
  ])

  function handleSaveSettingsChange(next: boolean) {
    setSaveSettings(next)
    if (!next) clearSavedDrillConfig(sectionType)
  }

  async function handleStart() {
    if (poolStats.selectedCount === 0) {
      setError(
        poolStats.totalCount > 0
          ? "No questions match these filters. Turn on Build My Own and set Question History to “New + reviewed”, or clear tag/difficulty filters."
          : "No questions are available in this drill pool yet.",
      )
      return
    }
    setStarting(true)
    setError(null)
    try {
      const parsedQuestionCount =
        questionCount === "unlimited" ? "unlimited" : Number.parseInt(questionCount, 10)
      const parsedPassageCount =
        passageCount === "unlimited" ? "unlimited" : Number.parseInt(passageCount, 10)
      const out = await practiceApi.startDrill({
        sectionType,
        questionCount:
          sectionType === "RC"
            ? 1
            : parsedQuestionCount === "unlimited"
              ? "unlimited"
              : Number.isFinite(parsedQuestionCount)
                ? parsedQuestionCount
                : 5,
        ...(sectionType === "RC"
          ? {
              passageCount:
                parsedPassageCount === "unlimited" || Number.isFinite(parsedPassageCount)
                  ? parsedPassageCount
                  : 1,
            }
          : {}),
        timing: isValidDrillTiming(timing) ? timing : "unlimited",
        showAnswers: resolvedShowAnswers,
        selection: selection as "auto" | "manual",
        questionTypeId: resolvedQuestionTypeId,
        tagLabel: resolvedTagLabel,
        difficulty: resolvedDifficulty,
        status: resolvedStatus,
        title: resolvedTagLabel ?? "Varied Mix",
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
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-base font-semibold leading-snug tracking-[0.02em] text-[#062357]">
          Practice With More Clarity About Your Weaknesses & Strengths
        </h1>
        {bannerOpen ? (
          <div className="flex items-center justify-between gap-4">
            <p className="m-0 min-w-0 flex-1 text-sm font-normal leading-normal tracking-[0.02em] text-[#666d80]">
              Work on your priority skills or build your own drill.
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
          <div className="flex min-w-0 items-center gap-3">
            <SectionInitialBadge section={sectionType} />
            <p className="m-0 text-[24px] font-bold leading-[1.3] text-[#062357]">{copy.title}</p>
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
              {poolStats.selectedCount} new {poolStats.selectedCount === 1 ? "question" : "questions"} ready
            </p>
            {poolStats.selectedCount === 0 && poolStats.totalCount > 0 ? (
              <p className="m-0 max-w-sm text-xs font-medium leading-normal tracking-[0.02em] text-[#df1c41] lg:text-right">
                No unused questions match. Turn on Build My Own and set Question History to “New + reviewed”.
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 items-stretch gap-6 overflow-visible">
          {sectionType === "RC" ? (
            <DrillConfigSelectField
              label="Passages"
              description="Choose your drill length."
              value={passageCount}
              onChange={setPassageCount}
              options={[...drillConfigOptions.passageCount]}
            />
          ) : (
            <DrillConfigSelectField
              label="Drill Size"
              description="Choose your length."
              value={questionCount}
              onChange={setQuestionCount}
              options={[...drillConfigOptions.questionCount]}
            />
          )}
          <DrillConfigField label="Pace" description="Choose your timing.">
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
          <div className="grid gap-6 overflow-visible sm:grid-cols-2">
            <DrillConfigSelectField
              label="Answer Check"
              description="Choose when to check your work."
              value={showAnswers}
              onChange={(v) => setShowAnswers(v as DrillShowAnswers)}
              options={[...drillConfigOptions.showAnswers]}
            />
            <DrillConfigSelectField
              label="Question Mix"
              description="Use our picks or choose your own."
              value={selection}
              onChange={setSelection}
              options={[...drillConfigOptions.selection]}
            />
            <DrillConfigSelectField
              label={sectionType === "RC" ? "Reading Focus" : "Skill Focus"}
              description={
                sectionType === "RC" ? "Choose the reading skills to practise." : "Filter by question type"
              }
              value={tags}
              onChange={setTags}
              options={tagSelectOptions}
            />
            <DrillConfigSelectField
              label="Challenge"
              description="Choose your level."
              value={difficulty}
              onChange={(v) => setDifficulty(v as DrillDifficulty)}
              options={[...drillConfigOptions.difficulty]}
            />
            <DrillConfigSelectField
              label="Question History"
              description="Use new questions or revisit old ones."
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
          <label className="inline-flex h-[52px] cursor-pointer select-none items-center gap-2.5 text-base font-semibold tracking-[0.02em] text-[#0d47a1]">
            <Checkbox
              checked={saveSettings}
              onChange={(event) => handleSaveSettingsChange(event.target.checked)}
              aria-label="Remember setup"
            />
            Remember setup
          </label>
          <Button
            type="button"
            variant="default"
            disabled={starting || poolStats.selectedCount === 0}
            className="ds-btn gap-2 text-base"
            onClick={() => void handleStart()}
          >
            <PlayCircleIcon className="size-5 shrink-0 text-white" />
            {starting ? "Starting…" : "Begin Drill"}
          </Button>
        </div>
      </section>
    </div>
  )
}

export { DrillConfigForm }
