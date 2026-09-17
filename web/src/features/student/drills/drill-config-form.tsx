import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FigmaIcon, PlayCircleIcon } from "@/components/icons/figma-icons"
import { Switch } from "@/components/ui/switch"
import {
  DrillConfigField,
  DrillConfigMultiSelectField,
  DrillConfigSelectField,
} from "@/features/student/drills/drill-config-field"
import {
  clearSavedDrillConfig,
  readSavedDrillConfig,
  writeSavedDrillConfig,
  type SavedDrillConfig,
} from "@/features/student/drills/drill-config-saved-settings"
import { DrillSelectQuestionsModal } from "@/features/student/drills/drill-select-questions-modal"
import {
  drillConfigOptions,
  type DrillDifficulty,
  type DrillPickerQuestionItem,
  type DrillSectionType,
  type DrillShowAnswers,
  type DrillStatus,
} from "@/features/student/drills/drill-types"
import { formatDrillTitleFromTypeNames, formatPickMyOwnDrillTitle } from "@/features/student/drills/format-drill-title"
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
  const [customize, setCustomize] = useState(
    Boolean(initialQuestionTypeId) || Boolean(savedConfig?.customize),
  )
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [poolStats, setPoolStats] = useState({ selectedCount: 0, totalCount: 0 })

  const [questionCount, setQuestionCount] = useState(savedConfig?.questionCount ?? "5")
  const [passageCount, setPassageCount] = useState(savedConfig?.passageCount ?? "1")
  const [timing, setTiming] = useState(savedConfig?.timing ?? "unlimited")
  const [showAnswers, setShowAnswers] = useState<DrillShowAnswers>(savedConfig?.showAnswers ?? "end")
  // Question Mix always opens on Priority mix; Pick my own is an explicit choice each visit.
  const [selection, setSelection] = useState("auto")
  const [tags, setTags] = useState<string[]>(() => {
    if (initialQuestionTypeId) return [initialQuestionTypeId]
    return savedConfig?.tags ?? []
  })
  const [difficulty, setDifficulty] = useState<DrillDifficulty>(savedConfig?.difficulty ?? "adaptive")
  // Default to full pool so Start works even after prior practice; "Fresh" is opt-in via Customize.
  const [status, setStatus] = useState<DrillStatus>(savedConfig?.status ?? "all")
  const [pickerOpen, setPickerOpen] = useState(false)
  const [manualQuestionIds, setManualQuestionIds] = useState<string[]>(
    () => savedConfig?.manualQuestionIds ?? [],
  )
  const [manualPrepTestNumbers, setManualPrepTestNumbers] = useState<number[]>(
    () => savedConfig?.manualPrepTestNumbers ?? [],
  )

  const copy = sectionCopy[sectionType]

  const tagSelectOptions = useMemo(() => {
    const base = [...tagOptions]
    if (initialQuestionTypeId && !tagOptions.some((t) => t.value === initialQuestionTypeId)) {
      return [{ label: initialTagLabel ?? "Selected tag", value: initialQuestionTypeId }, ...base]
    }
    return base
  }, [tagOptions, initialQuestionTypeId, initialTagLabel])

  // Customize off = adaptive defaults over the full section pool (ignore tag/status filters).
  const resolvedQuestionTypeIds = useMemo(() => (customize ? tags : []), [customize, tags])
  const resolvedTagLabels = useMemo(
    () =>
      resolvedQuestionTypeIds.map(
        (id) =>
          tagSelectOptions.find((option) => option.value === id)?.label ??
          (id === initialQuestionTypeId ? initialTagLabel : null) ??
          id,
      ),
    [resolvedQuestionTypeIds, tagSelectOptions, initialQuestionTypeId, initialTagLabel],
  )
  const resolvedQuestionTypeId = resolvedQuestionTypeIds[0] ?? null
  const resolvedTagLabel = resolvedTagLabels[0] ?? null
  const drillTitle = formatDrillTitleFromTypeNames(resolvedTagLabels)
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
        questionTypeIds: resolvedQuestionTypeIds,
        difficulty: resolvedDifficulty,
        status: resolvedStatus,
      })
      setPoolStats(stats)
    } catch {
      setPoolStats({ selectedCount: 0, totalCount: 0 })
    }
  }, [
    practiceApi,
    sectionType,
    resolvedQuestionTypeId,
    resolvedQuestionTypeIds,
    resolvedDifficulty,
    resolvedStatus,
  ])

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
      // Always persist Priority mix as the restored Question Mix default.
      selection: "auto",
      tags,
      difficulty,
      status,
      manualQuestionIds,
      manualPrepTestNumbers,
    }
    writeSavedDrillConfig(sectionType, config)
  }, [
    customize,
    difficulty,
    manualPrepTestNumbers,
    manualQuestionIds,
    passageCount,
    questionCount,
    saveSettings,
    sectionType,
    showAnswers,
    status,
    tags,
    timing,
  ])

  function applyManualPicks(questions: DrillPickerQuestionItem[]) {
    const ids = questions.map((q) => q.id)
    const pts = questions
      .map((q) => q.prepTestNumber)
      .filter((n): n is number => typeof n === "number" && Number.isFinite(n))
    setManualQuestionIds(ids)
    setManualPrepTestNumbers(pts)
    if (ids.length > 0) {
      setCustomize(true)
    }
    return { ids, pts }
  }

  function buildSavedConfig(overrides?: Partial<SavedDrillConfig>): SavedDrillConfig {
    return {
      questionCount: overrides?.questionCount ?? questionCount,
      passageCount: overrides?.passageCount ?? passageCount,
      timing: overrides?.timing ?? timing,
      showAnswers: overrides?.showAnswers ?? showAnswers,
      customize: overrides?.customize ?? customize,
      selection: "auto",
      tags: overrides?.tags ?? tags,
      difficulty: overrides?.difficulty ?? difficulty,
      status: overrides?.status ?? status,
      manualQuestionIds: overrides?.manualQuestionIds ?? manualQuestionIds,
      manualPrepTestNumbers: overrides?.manualPrepTestNumbers ?? manualPrepTestNumbers,
    }
  }

  function handleSaveSettingsChange(next: boolean) {
    setSaveSettings(next)
    if (!next) {
      clearSavedDrillConfig(sectionType)
      return
    }
    try {
      writeSavedDrillConfig(sectionType, buildSavedConfig())
    } catch {
      setError("Could not save settings. Check browser storage and try again.")
    }
  }

  function handleSelectionChange(next: string) {
    setSelection(next)
    if (next === "manual") {
      setPickerOpen(true)
    }
  }

  async function handleStart(override?: { questionIds: string[]; prepTestNumbers?: number[] }) {
    const fromModal = Boolean(override?.questionIds?.length)
    const usingManual = fromModal || (selection === "manual" && manualQuestionIds.length > 0)
    const pickedIds = fromModal ? (override?.questionIds ?? []) : usingManual ? manualQuestionIds : []
    const pickedPts = fromModal
      ? (override?.prepTestNumbers ?? [])
      : usingManual
        ? manualPrepTestNumbers
        : []
    if (selection === "manual" && !fromModal && pickedIds.length === 0) {
      setError("Pick at least one question, or switch Question Mix back to Priority mix.")
      setPickerOpen(true)
      return
    }
    if (!usingManual && poolStats.selectedCount === 0) {
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
        questionCount: usingManual
          ? pickedIds.length
          : sectionType === "RC"
            ? 1
            : parsedQuestionCount === "unlimited"
              ? "unlimited"
              : Number.isFinite(parsedQuestionCount)
                ? parsedQuestionCount
                : 5,
        ...(sectionType === "RC" && !usingManual
          ? {
              passageCount:
                parsedPassageCount === "unlimited" || Number.isFinite(parsedPassageCount)
                  ? parsedPassageCount
                  : 1,
            }
          : {}),
        timing: isValidDrillTiming(timing) ? timing : "unlimited",
        showAnswers: resolvedShowAnswers,
        selection: usingManual ? "manual" : "auto",
        questionTypeId: usingManual ? null : resolvedQuestionTypeId,
        questionTypeIds: usingManual ? [] : resolvedQuestionTypeIds,
        tagLabel: usingManual ? null : resolvedTagLabel,
        tagLabels: usingManual ? [] : resolvedTagLabels,
        difficulty: usingManual ? "adaptive" : resolvedDifficulty,
        status: usingManual ? "all" : resolvedStatus,
        title: usingManual
          ? formatPickMyOwnDrillTitle({
              questionCount: pickedIds.length,
              prepTestNumbers: pickedPts,
            })
          : drillTitle,
        ...(usingManual ? { questionIds: pickedIds } : {}),
      })
      setPickerOpen(false)
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
        <h1 className="m-0 text-base font-semibold leading-snug tracking-[0.02em] text-[var(--color-student-heading)]">
          Practice With More Clarity About Your Weaknesses & Strengths
        </h1>
        {bannerOpen ? (
          <div className="flex items-center justify-between gap-4">
            <p className="m-0 min-w-0 flex-1 text-sm font-normal leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">
              Work on your priority skills or build your own drill.
            </p>
            <button
              type="button"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--greyscale-500)] transition hover:bg-[var(--greyscale-0)]/80 hover:text-[var(--color-student-heading)]"
              aria-label="Dismiss banner"
              onClick={() => setBannerOpen(false)}
            >
              <FigmaIcon name="block-circle" className="size-6" />
            </button>
          </div>
        ) : null}
      </div>

      <section className="flex w-full flex-col gap-6 rounded-[24px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <SectionInitialBadge section={sectionType} />
            <p className="m-0 text-[24px] font-bold leading-[1.3] text-[var(--color-student-heading)]">{copy.title}</p>
          </div>
          <div className="flex w-full flex-col gap-0.5 lg:w-auto lg:shrink-0 lg:items-end">
            <div className="flex w-full items-start justify-between gap-4">
              <p className="m-0 text-xl font-bold leading-[1.35] text-[var(--color-student-heading)]">Build My Own</p>
              <Switch
                checked={customize}
                onChange={(e) => setCustomize(e.target.checked)}
                className={customize ? "!bg-[var(--primary)]" : "!bg-[var(--greyscale-100)]"}
                aria-label="Build My Own"
              />
            </div>
            <p className="m-0 whitespace-nowrap text-xs font-normal leading-normal tracking-[0.02em] text-[var(--greyscale-500)] lg:text-right">
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
              onChange={handleSelectionChange}
              options={[...drillConfigOptions.selection]}
            />
            <DrillConfigMultiSelectField
              label={sectionType === "RC" ? "Reading Focus" : "Skill Focus"}
              description={
                sectionType === "RC"
                  ? "Choose up to three reading skills to name this drill."
                  : "Choose up to three question types to name this drill."
              }
              values={tags}
              onChange={setTags}
              options={tagSelectOptions}
              emptyLabel="All skills"
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
            className="inline-flex h-[52px] items-center px-4 text-base font-semibold tracking-[0.02em] text-[var(--primary)] transition-colors hover:underline"
          >
            Back
          </Link>
          <label className="inline-flex h-[52px] cursor-pointer select-none items-center gap-2.5 text-base font-semibold tracking-[0.02em] text-[var(--primary)]">
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
            disabled={
              starting ||
              (selection === "manual"
                ? manualQuestionIds.length === 0
                : poolStats.selectedCount === 0)
            }
            className="ds-btn gap-2 text-base"
            onClick={() => void handleStart()}
          >
            <PlayCircleIcon className="size-5 shrink-0 text-white" />
            {starting
              ? "Starting…"
              : selection === "manual" && manualQuestionIds.length > 0
                ? `Begin Drill (${manualQuestionIds.length})`
                : "Begin Drill"}
          </Button>
        </div>
      </section>

      <DrillSelectQuestionsModal
        open={pickerOpen}
        sectionType={sectionType}
        tagOptions={tagSelectOptions}
        initialSelectedIds={manualQuestionIds}
        onConfirmSelection={(questions) => {
          applyManualPicks(questions)
          setSelection(questions.length > 0 ? "manual" : "auto")
          setPickerOpen(false)
        }}
        onStartDrill={(questions) => {
          const { ids, pts } = applyManualPicks(questions)
          setSelection(ids.length > 0 ? "manual" : "auto")
          void handleStart({ questionIds: ids, prepTestNumbers: pts })
        }}
        starting={starting}
      />
    </div>
  )
}

export { DrillConfigForm }
