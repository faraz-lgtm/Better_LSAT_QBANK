import { ChevronDown, ChevronUp } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { FigmaIcon } from "@/components/icons/figma-icons"
import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DrillDifficultyStatus } from "@/features/student/components/drill-difficulty-status"
import { StudentOptionMenu } from "@/features/student/components/student-option-menu"
import type {
  DrillPickerListInput,
  DrillPickerQuestionItem,
  DrillSectionType,
} from "@/features/student/drills/drill-types"
import {
  difficultyLabelFromLevel,
  formatPaddedTargetTime,
  targetTimeSecondsForDifficulty,
  type PracticeDifficultyLabel,
} from "@/features/student/practice-session/practice-results-ui"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const DIFFICULTY_META: Record<PracticeDifficultyLabel, { filledBars: number; color: string }> = {
  Easiest: { filledBars: 1, color: "#40c4aa" },
  Easy: { filledBars: 2, color: "#ffbd4c" },
  Medium: { filledBars: 3, color: "#ff6f00" },
  Hard: { filledBars: 4, color: "#df1c41" },
  Hardest: { filledBars: 5, color: "#df1c41" },
}

const FILTER_CHIP_CLASS =
  "inline-flex h-[28px] w-auto shrink-0 items-center gap-1 rounded-[8px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-2.5 text-xs font-medium tracking-[0.24px] text-[var(--greyscale-500)]"
const FILTER_MENU_CLASS = "w-auto shrink-0"
const FILTER_MENU_TRIGGER_CLASS =
  "h-[28px] w-auto min-w-0 gap-1 rounded-[8px] border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-2.5 text-xs font-medium tracking-[0.24px] text-[var(--greyscale-500)] [&_span]:flex-none [&_svg]:size-2.5"
const FILTER_MENU_TRIGGER_ACTIVE_CLASS =
  "h-[28px] w-auto min-w-0 gap-1 rounded-[8px] border-[var(--primary)] bg-[var(--primary-0)] px-2.5 text-xs font-medium tracking-[0.24px] text-[var(--primary)] [&_span]:flex-none [&_svg]:size-2.5 [&_svg]:text-[var(--primary)]"
const FILTER_MENU_LIST_CLASS = "min-w-[180px] z-50"

const TIMING_FILTER_OPTIONS = [
  { label: "Timing vs. target", value: "any" },
  { label: "4x+ target time", value: "4x" },
  { label: "2x+ target time", value: "2x" },
  { label: "Above target time", value: "above" },
  { label: "Below target time", value: "below" },
  { label: "Under 10 seconds", value: "under10" },
] as const

const DATE_FILTER_OPTIONS = [
  { label: "Date first taken", value: "any" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Last 6 months", value: "6m" },
  { label: "Last year", value: "1y" },
  { label: "Never taken", value: "never" },
] as const

const AVAILABILITY_FILTER_OPTIONS = [
  { label: "Availability", value: "all" },
  { label: "Available for drills", value: "drills" },
  { label: "Available for sections", value: "sections" },
  { label: "Available for PrepTests", value: "tests" },
] as const

type TimingFilter = (typeof TIMING_FILTER_OPTIONS)[number]["value"]
type DateFilter = (typeof DATE_FILTER_OPTIONS)[number]["value"]
type AvailabilityFilter = (typeof AVAILABILITY_FILTER_OPTIONS)[number]["value"]

function FilterToggleChip({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cn(FILTER_CHIP_CLASS, checked && "border-[var(--primary)] text-[var(--primary)]")}
      onClick={() => onCheckedChange(!checked)}
    >
      <span>{label}</span>
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-[10px] w-[18px] shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-[var(--primary)]" : "bg-[var(--greyscale-100)]",
        )}
      >
        <span
          className={cn(
            "block size-2 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-[9px]" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  )
}

function matchesTimingFilter(item: DrillPickerQuestionItem, timing: TimingFilter): boolean {
  if (timing === "any") return true
  const spent = item.timeSpentSeconds
  if (spent == null || spent < 0) return false
  if (timing === "under10") return spent < 10
  const target = targetTimeSecondsForDifficulty(difficultyLabelFromLevel(item.difficulty ?? 3))
  if (timing === "4x") return spent >= target * 4
  if (timing === "2x") return spent >= target * 2
  if (timing === "above") return spent > target
  if (timing === "below") return spent < target
  return true
}

function matchesDateFilter(item: DrillPickerQuestionItem, dateFilter: DateFilter): boolean {
  if (dateFilter === "any") return true
  if (dateFilter === "never") return item.status === "fresh"
  // Without first-taken timestamps from the API, treat reviewed questions as matching recent windows.
  return item.status === "reviewed"
}

type DrillSelectQuestionsModalProps = {
  open: boolean
  sectionType: DrillSectionType
  tagOptions?: { label: string; value: string }[]
  initialSelectedIds?: string[]
  onConfirmSelection: (questions: DrillPickerQuestionItem[]) => void
  onStartDrill: (questions: DrillPickerQuestionItem[]) => void
  starting?: boolean
}

function formatPickerTimeLabel(difficulty: number | null, timeSpentSeconds: number | null): string {
  const label = difficultyLabelFromLevel(difficulty ?? 3)
  const target = targetTimeSecondsForDifficulty(label)
  const targetFmt = formatPaddedTargetTime(target)
  if (timeSpentSeconds == null || timeSpentSeconds < 0) {
    return `Time: ${targetFmt}`
  }
  const spent = formatPaddedTargetTime(timeSpentSeconds)
  const delta = target - timeSpentSeconds
  const abs = formatPaddedTargetTime(Math.abs(delta))
  return `Time: ${spent} (${delta >= 0 ? "-" : "+"}${abs})`
}

function resultLabel(result: DrillPickerQuestionItem["result"]): string {
  if (result === "correct") return "Correct"
  if (result === "incorrect") return "Incorrect"
  return "Untouched"
}

function statusLabel(status: DrillPickerQuestionItem["status"]): string {
  return status === "fresh" ? "Fresh" : "In Process"
}

function ResultGlyph({ result }: { result: DrillPickerQuestionItem["result"] }) {
  if (result === "correct") {
    return (
      <span className="inline-flex size-[22px] items-center justify-center rounded-[11px] border border-[#40c4aa] bg-[#effefa] text-[11px] text-[#40c4aa]">
        ✓
      </span>
    )
  }
  if (result === "incorrect") {
    return (
      <span className="inline-flex size-[22px] items-center justify-center rounded-[11px] border border-[#df1c41] bg-[#feeff2] text-[11px] text-[#df1c41]">
        ×
      </span>
    )
  }
  return (
    <span className="inline-flex size-[22px] items-center justify-center rounded-[11px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] text-[11px] text-[var(--greyscale-500)]">
      –
    </span>
  )
}

function QuestionPickerRow({
  item,
  selected,
  onToggle,
}: {
  item: DrillPickerQuestionItem
  selected: boolean
  onToggle: () => void
}) {
  const difficulty = difficultyLabelFromLevel(item.difficulty ?? 3)
  const meta = DIFFICULTY_META[difficulty]

  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--greyscale-100)] p-4 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="m-0 text-base font-semibold leading-[1.35] text-[var(--color-student-heading)]">
          {item.label}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex h-7 items-center gap-2 rounded-[10px] bg-[var(--greyscale-25)] px-4">
            <span className="size-2 rounded-full bg-[var(--greyscale-500)]" />
            <span className="text-xs font-semibold tracking-[0.24px] text-[var(--greyscale-500)]">
              {statusLabel(item.status)}
            </span>
          </span>
          <DrillDifficultyStatus
            label={difficulty}
            filledBars={meta.filledBars}
            color={meta.color}
            surface="muted"
          />
          <span className="text-sm font-medium tracking-[0.28px] text-[var(--greyscale-500)]">
            {formatPickerTimeLabel(item.difficulty, item.timeSpentSeconds)}
          </span>
          <span className="w-[130px] text-sm font-medium tracking-[0.28px] text-[var(--greyscale-500)]">
            Result: {resultLabel(item.result)}
          </span>
          <ResultGlyph result={item.result} />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-[8px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] text-[var(--greyscale-500)]"
          aria-label={item.bookmarked ? "Bookmarked" : "Bookmark"}
          disabled
        >
          <FigmaIcon name="bookmark" className="size-3.5" />
        </button>
        <button
          type="button"
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-[8px] border text-sm font-black tracking-[0.28px]",
            selected
              ? "border-[#df1c41] bg-[#feeff2] text-[#df1c41]"
              : "border-[#40c4aa] bg-[#effefa] text-[#40c4aa]",
          )}
          aria-label={selected ? `Remove ${item.label}` : `Add ${item.label}`}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onToggle()
          }}
        >
          {selected ? "−" : "+"}
        </button>
      </div>
    </div>
  )
}

function DrillSelectQuestionsModal({
  open,
  sectionType,
  tagOptions = [],
  initialSelectedIds = [],
  onConfirmSelection,
  onStartDrill,
  starting = false,
}: DrillSelectQuestionsModalProps) {
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [availability, setAvailability] = useState<AvailabilityFilter>("drills")
  const [status, setStatus] = useState<"all" | "fresh" | "reviewed">("all")
  const [result, setResult] = useState<"all" | "correct" | "incorrect" | "untouched">("all")
  const [difficultyLevels, setDifficultyLevels] = useState<number[]>([])
  const [tagIds, setTagIds] = useState<string[]>([])
  const [prepTestId, setPrepTestId] = useState("any")
  const [timingFilter, setTimingFilter] = useState<TimingFilter>("any")
  const [dateFilter, setDateFilter] = useState<DateFilter>("any")
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false)
  const [hasNotesOnly, setHasNotesOnly] = useState(false)
  const [prepTestOptions, setPrepTestOptions] = useState<{ label: string; value: string }[]>([])
  const [sort, setSort] = useState<"newest" | "oldest">("newest")
  const [page, setPage] = useState(1)
  const [selectedOpen, setSelectedOpen] = useState(true)
  const [selectedItems, setSelectedItems] = useState<DrillPickerQuestionItem[]>([])
  const [matches, setMatches] = useState<DrillPickerQuestionItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wasOpenRef = useRef(false)
  const itemCacheRef = useRef<Map<string, DrillPickerQuestionItem>>(new Map())
  const prepTestMapRef = useRef<Map<string, string>>(new Map())

  const selectedIds = useMemo(() => selectedItems.map((item) => item.id), [selectedItems])
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])

  function rememberItems(items: DrillPickerQuestionItem[]) {
    for (const item of items) {
      itemCacheRef.current.set(item.id, item)
      if (item.prepTestId) {
        const label =
          item.prepTestNumber != null ? `PT${item.prepTestNumber}` : item.label.split(".")[0] || item.prepTestId
        prepTestMapRef.current.set(item.prepTestId, label)
      }
    }
    setPrepTestOptions(
      [...prepTestMapRef.current.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })),
    )
  }

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      // Only sync from parent when the modal opens — avoid wiping in-progress picks.
      setSelectedItems(
        initialSelectedIds
          .map((id) => itemCacheRef.current.get(id))
          .filter((item): item is DrillPickerQuestionItem => Boolean(item)),
      )
      setPage(1)
      setSearch("")
      setDebouncedSearch("")
      setSelectedOpen(true)
    }
    wasOpenRef.current = open
  }, [open, initialSelectedIds])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void (async () => {
      try {
        const pool = await practiceApi.listPrepTestPool({ page: 1, pageSize: 200, sort: "newest" })
        if (cancelled) return
        for (const pt of pool.prepTests) {
          const n = pt.prepTestNumber ? Number.parseInt(pt.prepTestNumber, 10) : NaN
          const label = Number.isFinite(n)
            ? `PT${n}`
            : pt.title?.replace(/^PrepTest\s*/i, "PT") || pt.moduleId
          prepTestMapRef.current.set(pt.id, label)
        }
        setPrepTestOptions(
          [...prepTestMapRef.current.entries()]
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })),
        )
      } catch {
        // PrepTest options still accumulate from picker results.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, practiceApi])

  const loadMatches = useCallback(async () => {
    if (!open) return
    setLoading(true)
    setError(null)
    try {
      const input: DrillPickerListInput = {
        sectionType,
        search: debouncedSearch || undefined,
        status,
        result,
        availability,
        availableForDrills: availability === "drills",
        sort,
        page,
        pageSize: 25,
        ...(tagIds.length ? { questionTypeIds: tagIds } : {}),
        ...(difficultyLevels.length ? { difficultyLevels } : {}),
        ...(prepTestId !== "any" ? { prepTestIds: [prepTestId] } : {}),
      }
      const out = await practiceApi.listDrillPickerQuestions(input)
      rememberItems(out.questions)
      const filtered = out.questions.filter((item) => {
        if (bookmarkedOnly && !item.bookmarked) return false
        if (hasNotesOnly && !item.hasNotes) return false
        if (!matchesTimingFilter(item, timingFilter)) return false
        if (!matchesDateFilter(item, dateFilter)) return false
        return true
      })
      setMatches(filtered)
      setTotal(
        timingFilter === "any" && dateFilter === "any" && !bookmarkedOnly && !hasNotesOnly
          ? out.total
          : filtered.length,
      )
      setSelectedItems((prev) =>
        prev.map((item) => itemCacheRef.current.get(item.id) ?? item),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load questions")
      setMatches([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [
    availability,
    bookmarkedOnly,
    dateFilter,
    debouncedSearch,
    difficultyLevels,
    hasNotesOnly,
    open,
    page,
    practiceApi,
    prepTestId,
    result,
    sectionType,
    sort,
    status,
    tagIds,
    timingFilter,
  ])

  useEffect(() => {
    void loadMatches()
  }, [loadMatches])

  function resetFilters() {
    setSearch("")
    setDebouncedSearch("")
    setAvailability("drills")
    setStatus("all")
    setResult("all")
    setDifficultyLevels([])
    setTagIds([])
    setPrepTestId("any")
    setTimingFilter("any")
    setDateFilter("any")
    setBookmarkedOnly(false)
    setHasNotesOnly(false)
    setSort("newest")
    setPage(1)
  }

  function toggleSelected(item: DrillPickerQuestionItem) {
    rememberItems([item])
    setSelectedItems((prev) => {
      if (prev.some((row) => row.id === item.id)) {
        return prev.filter((row) => row.id !== item.id)
      }
      return [...prev, item]
    })
    setSelectedOpen(true)
  }

  function clearSelected() {
    setSelectedItems([])
  }

  function handleBack() {
    onConfirmSelection(selectedItems)
  }

  const pageCount = Math.max(1, Math.ceil(total / 25))

  return (
    <DialogRoot
      open={open}
      onOpenChange={(next) => {
        if (!next) handleBack()
      }}
    >
      <DialogContent
        className="flex max-h-[min(920px,calc(100vh-2rem))] w-[min(1100px,calc(100%-2rem))] max-w-none flex-col gap-0 overflow-visible rounded-[14px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6 shadow-lg sm:max-w-none"
        aria-describedby={undefined}
      >
          <DialogTitle className="m-0 text-base font-semibold leading-[1.35] text-[var(--color-student-heading)]">
            Select questions
          </DialogTitle>
          <DialogDescription className="sr-only">
            Search and filter the drill pool, then add questions to start a custom drill.
          </DialogDescription>

          <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3.5 overflow-visible">
            <div className="relative z-30 overflow-visible rounded-[14px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-4 py-3.5 shadow-[0px_1px_1.5px_rgba(0,0,0,0.04)]">
              <div className="flex flex-wrap items-center gap-2.5">
                <Input
                  size="sm"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Search question text or tags…"
                  className="h-[38px] min-w-[220px] flex-1 rounded-[8px] border-[var(--greyscale-100)] bg-[var(--greyscale-25)] text-[13px]"
                />
                <button
                  type="button"
                  className="rounded-[8px] border border-[var(--greyscale-100)] px-3 py-2 text-xs text-[var(--greyscale-500)]"
                  onClick={resetFilters}
                >
                  Reset
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-start gap-2">
                <StudentOptionMenu
                  className={FILTER_MENU_CLASS}
                  value={availability}
                  onChange={(v) => {
                    setAvailability(v)
                    setPage(1)
                  }}
                  options={[...AVAILABILITY_FILTER_OPTIONS]}
                  ariaLabel="Availability"
                  size="default"
                  triggerClassName={
                    availability === "all" ? FILTER_MENU_TRIGGER_CLASS : FILTER_MENU_TRIGGER_ACTIVE_CLASS
                  }
                  menuClassName={cn(FILTER_MENU_LIST_CLASS, "min-w-[220px]")}
                />

                <StudentOptionMenu
                  className={FILTER_MENU_CLASS}
                  value={status}
                  onChange={(v) => {
                    setStatus(v)
                    setPage(1)
                  }}
                  options={[
                    { label: "Status", value: "all" },
                    { label: "Fresh", value: "fresh" },
                    { label: "In Process", value: "reviewed" },
                  ]}
                  ariaLabel="Status"
                  size="default"
                  triggerClassName={
                    status === "all" ? FILTER_MENU_TRIGGER_CLASS : FILTER_MENU_TRIGGER_ACTIVE_CLASS
                  }
                  menuClassName={FILTER_MENU_LIST_CLASS}
                />

                {tagOptions.length > 0 ? (
                  <StudentOptionMenu
                    className={FILTER_MENU_CLASS}
                    value={tagIds[0] ?? "any"}
                    onChange={(v) => {
                      setTagIds(v === "any" ? [] : [v])
                      setPage(1)
                    }}
                    options={[
                      { label: "Tags", value: "any" },
                      ...tagOptions.map((t) => ({ label: t.label, value: t.value })),
                    ]}
                    ariaLabel="Tags"
                    size="default"
                    triggerClassName={
                      tagIds.length === 0 ? FILTER_MENU_TRIGGER_CLASS : FILTER_MENU_TRIGGER_ACTIVE_CLASS
                    }
                    menuClassName={FILTER_MENU_LIST_CLASS}
                  />
                ) : (
                  <span className={FILTER_CHIP_CLASS}>
                    Tags <ChevronDown className="size-2.5 opacity-70" />
                  </span>
                )}

                <StudentOptionMenu
                  className={FILTER_MENU_CLASS}
                  value={difficultyLevels[0] != null ? String(difficultyLevels[0]) : "any"}
                  onChange={(v) => {
                    setDifficultyLevels(v === "any" ? [] : [Number(v)])
                    setPage(1)
                  }}
                  options={[
                    { label: "Difficulty", value: "any" },
                    { label: "Easiest", value: "1" },
                    { label: "Easy", value: "2" },
                    { label: "Medium", value: "3" },
                    { label: "Hard", value: "4" },
                    { label: "Hardest", value: "5" },
                  ]}
                  ariaLabel="Difficulty"
                  size="default"
                  triggerClassName={
                    difficultyLevels.length === 0
                      ? FILTER_MENU_TRIGGER_CLASS
                      : FILTER_MENU_TRIGGER_ACTIVE_CLASS
                  }
                  menuClassName={FILTER_MENU_LIST_CLASS}
                />

                <StudentOptionMenu
                  className={FILTER_MENU_CLASS}
                  value={prepTestId}
                  onChange={(v) => {
                    setPrepTestId(v)
                    setPage(1)
                  }}
                  options={[
                    { label: "PrepTest", value: "any" },
                    ...prepTestOptions,
                  ]}
                  ariaLabel="PrepTest"
                  size="default"
                  triggerClassName={
                    prepTestId === "any" ? FILTER_MENU_TRIGGER_CLASS : FILTER_MENU_TRIGGER_ACTIVE_CLASS
                  }
                  menuClassName={cn(FILTER_MENU_LIST_CLASS, "min-w-[160px] max-h-64")}
                />

                <FilterToggleChip
                  label="Bookmarked"
                  checked={bookmarkedOnly}
                  onCheckedChange={(next) => {
                    setBookmarkedOnly(next)
                    setPage(1)
                  }}
                />

                <FilterToggleChip
                  label="Has notes"
                  checked={hasNotesOnly}
                  onCheckedChange={(next) => {
                    setHasNotesOnly(next)
                    setPage(1)
                  }}
                />

                <StudentOptionMenu
                  className={FILTER_MENU_CLASS}
                  value={result}
                  onChange={(v) => {
                    setResult(v)
                    setPage(1)
                  }}
                  options={[
                    { label: "Result", value: "all" },
                    { label: "Correct", value: "correct" },
                    { label: "Incorrect", value: "incorrect" },
                    { label: "Untouched", value: "untouched" },
                  ]}
                  ariaLabel="Result"
                  size="default"
                  triggerClassName={
                    result === "all" ? FILTER_MENU_TRIGGER_CLASS : FILTER_MENU_TRIGGER_ACTIVE_CLASS
                  }
                  menuClassName={FILTER_MENU_LIST_CLASS}
                />

                <StudentOptionMenu
                  className={FILTER_MENU_CLASS}
                  value={timingFilter}
                  onChange={(v) => {
                    setTimingFilter(v)
                    setPage(1)
                  }}
                  options={[...TIMING_FILTER_OPTIONS]}
                  ariaLabel="Timing vs. target"
                  size="default"
                  triggerClassName={
                    timingFilter === "any"
                      ? FILTER_MENU_TRIGGER_CLASS
                      : FILTER_MENU_TRIGGER_ACTIVE_CLASS
                  }
                  menuClassName={cn(FILTER_MENU_LIST_CLASS, "min-w-[200px]")}
                />

                <StudentOptionMenu
                  className={FILTER_MENU_CLASS}
                  value={dateFilter}
                  onChange={(v) => {
                    setDateFilter(v)
                    setPage(1)
                  }}
                  options={[...DATE_FILTER_OPTIONS]}
                  ariaLabel="Date first taken"
                  size="default"
                  triggerClassName={
                    dateFilter === "any" ? FILTER_MENU_TRIGGER_CLASS : FILTER_MENU_TRIGGER_ACTIVE_CLASS
                  }
                  menuClassName={cn(FILTER_MENU_LIST_CLASS, "min-w-[180px]")}
                />
              </div>
            </div>

            <div className="rounded-[14px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] shadow-[0px_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between border-b border-[var(--greyscale-100)] px-4 py-3">
                <p className="m-0 text-base font-semibold text-[var(--color-student-heading)]">
                  {selectedItems.length} selected
                </p>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    className="text-xs text-[var(--greyscale-500)]"
                    onClick={clearSelected}
                    disabled={selectedItems.length === 0}
                  >
                    Clear all
                  </button>
                  <button
                    type="button"
                    className="inline-flex size-3.5 items-center justify-center text-[var(--greyscale-500)]"
                    aria-label={selectedOpen ? "Collapse selected" : "Expand selected"}
                    onClick={() => setSelectedOpen((v) => !v)}
                  >
                    {selectedOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </button>
                </div>
              </div>
              {selectedOpen ? (
                <div className="max-h-[180px] overflow-y-auto">
                  {selectedItems.length === 0 ? (
                    <p className="m-0 px-4 py-6 text-sm text-[var(--greyscale-500)]">
                      Add questions from the matches list below.
                    </p>
                  ) : (
                    selectedItems.map((item) => (
                      <QuestionPickerRow
                        key={`selected-${item.id}`}
                        item={item}
                        selected
                        onToggle={() => toggleSelected(item)}
                      />
                    ))
                  )}
                </div>
              ) : null}
            </div>

            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] shadow-[0px_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between border-b border-[var(--greyscale-100)] px-4 py-3">
                <p className="m-0 text-base font-semibold text-[var(--color-student-heading)]">
                  {total.toLocaleString()} matches
                </p>
                    <div className="w-auto shrink-0">
                  <StudentOptionMenu
                    className={FILTER_MENU_CLASS}
                    value={sort}
                    onChange={setSort}
                    options={[
                      { label: "Newest PrepTests", value: "newest" },
                      { label: "Oldest PrepTests", value: "oldest" },
                    ]}
                    ariaLabel="Sort matches"
                    size="default"
                    triggerClassName={FILTER_MENU_TRIGGER_CLASS}
                    menuClassName={FILTER_MENU_LIST_CLASS}
                  />
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {loading ? (
                  <p className="m-0 px-4 py-6 text-sm text-[var(--greyscale-500)]">Loading questions…</p>
                ) : error ? (
                  <p className="m-0 px-4 py-6 text-sm text-red-600" role="alert">
                    {error}
                  </p>
                ) : matches.length === 0 ? (
                  <p className="m-0 px-4 py-6 text-sm text-[var(--greyscale-500)]">No matching questions.</p>
                ) : (
                  matches.map((item) => (
                    <QuestionPickerRow
                      key={item.id}
                      item={item}
                      selected={selectedIdSet.has(item.id)}
                      onToggle={() => toggleSelected(item)}
                    />
                  ))
                )}
              </div>
              {pageCount > 1 ? (
                <div className="flex items-center justify-end gap-2 border-t border-[var(--greyscale-100)] px-4 py-2">
                  <button
                    type="button"
                    className="text-xs font-semibold text-[var(--primary)] disabled:opacity-40"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <span className="text-xs text-[var(--greyscale-500)]">
                    {page} / {pageCount}
                  </span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-[var(--primary)] disabled:opacity-40"
                    disabled={page >= pageCount}
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="text-base font-semibold tracking-[0.02em] text-[var(--primary)]"
              onClick={handleBack}
            >
              Back
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="default"
                disabled={starting || selectedItems.length === 0}
                className="ds-btn h-[52px] gap-2 text-base"
                onClick={() => onStartDrill(selectedItems)}
              >
                <FigmaIcon name="notification-text-square" className="size-5 text-white" />
                {starting ? "Starting…" : "Start a Drill"}
              </Button>
            </div>
          </div>
      </DialogContent>
    </DialogRoot>
  )
}

export { DrillSelectQuestionsModal }
