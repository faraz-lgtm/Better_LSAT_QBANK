import { useMemo, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import {
  FIGMA_DROPDOWN_CARD_OPEN_CLASS,
  FIGMA_DROPDOWN_PILL_FILTER_CLASS,
  FigmaDropdown,
} from "@/components/ui/figma-dropdown"
import { Switch } from "@/components/ui/switch"
import {
  filterPracticeResultPassages,
  practiceResultQuestionBookmarkId,
} from "@/features/student/practice-session/filter-practice-result-questions"
import {
  PracticeResultsBookmarkedOnlyToggle,
  PracticeResultsEmptyFilterMessage,
} from "@/features/student/practice-session/practice-results-list-layout"
import {
  PT_RESULTS_DETAIL_GRID_CLASS,
  PT_RESULTS_DETAIL_ROW_CLASS,
  PT_RESULTS_HERO_CARD_CLASS,
  PT_RESULTS_PAGE_GAP_CLASS,
  PT_RESULTS_PASSAGE_BADGE_CLASS,
  PT_RESULTS_SURFACE_CARD_CLASS,
  PT_RESULTS_TAG_CLASS,
} from "@/features/student/analytics/prep-test-results-section-styles"
import type {
  PracticePassageQuestionGroup,
  PracticeQuestionResultMeta,
} from "@/features/student/practice-session/build-practice-results-section-groups"
import { useAccommodations } from "@/features/student/accommodations/accommodations-context"
import {
  formatAccuracyPct,
  formatCorrectSummaryLine,
  formatDrillAboutTiming,
  formatMinutesSecondsLabel,
  formatRcDrillResultsTitle,
  formatTakeLabel,
  formatTotalQuestionsLabel,
} from "@/features/student/practice-session/lr-drill-results-format"
import {
  DrillResultsQuestionRow,
  LrDrillCompactResultsCard,
} from "@/features/student/practice-session/lr-drill-results-view"
import type { PracticePassageSummary } from "@/features/student/practice-session/practice-results-list-layout"
import { PracticeDifficultyMeter } from "@/features/student/practice-session/practice-results-ui"
import { cn } from "@/lib/utils"

const QUESTION_FILTER_OPTIONS = ["Question", "Passage", "Incorrect only"] as const

type QuestionFilter = (typeof QUESTION_FILTER_OPTIONS)[number]

type RcDrillResultsViewProps = {
  questionCount: number
  rawScore: number
  scaledScore: number | null
  elapsedSeconds: number
  timing: string
  take: number
  excluded: boolean
  passages: PracticePassageQuestionGroup[]
  questions: PracticeQuestionResultMeta[]
  showBlindReview: boolean
  bookmarkedIds: ReadonlySet<string>
  onToggleBookmark: (questionId: string) => void
  onReviewInTester: () => void
  onExcludedChange: (next: boolean) => void
  variant?: "drill" | "section"
  heroTitle?: string
  compactLabel?: string
}

const LABEL_CLASS =
  "m-0 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#666d80]"

function padPassageTime(value: string): string {
  const match = value.trim().match(/^(\d+):(\d{2})$/)
  if (!match) return value
  return `${String(Number.parseInt(match[1]!, 10)).padStart(2, "0")}:${match[2]}`
}

function padTimeNote(note: string): string {
  return note.replace(/\((\d+):(\d{2})/, (_, minutes: string, seconds: string) => {
    return `(${minutes.padStart(2, "0")}:${seconds}`
  })
}

function RcDrillPassageHeader({ passage }: { passage: PracticePassageSummary }) {
  return (
    <div className="min-w-0 rounded-t-[24px] border border-[#dfe1e7] bg-[#f3f7ff] p-6">
      <div className={PT_RESULTS_DETAIL_ROW_CLASS}>
        <div className={PT_RESULTS_PASSAGE_BADGE_CLASS}>
          <span className="text-2xl font-bold leading-[1.3] text-[#0d47a1]">{passage.passageLabel}</span>
        </div>

        <div className={PT_RESULTS_DETAIL_GRID_CLASS}>
          <div className="flex min-w-0 flex-col justify-center gap-2">
            <h3 className="m-0 text-xl font-bold leading-[1.35] text-[#062357]">{passage.title}</h3>
            {passage.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {passage.tags.map((tag) => (
                  <span key={tag} className={PT_RESULTS_TAG_CLASS}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <p className={LABEL_CLASS}>Difficulty</p>
            <PracticeDifficultyMeter difficulty={passage.difficulty} />
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <p className={LABEL_CLASS}>Time:</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <div className="flex flex-wrap gap-1">
                <span className="w-20 shrink-0 text-xs font-normal leading-[1.5] tracking-[0.24px] text-[#666d80]">
                  Target time:
                </span>
                <span className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#666d80]">
                  {padPassageTime(passage.targetTime)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="w-20 shrink-0 text-xs font-normal leading-[1.5] tracking-[0.24px] text-[#666d80]">
                  Your time:
                </span>
                <span className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#0d47a1]">
                  {padPassageTime(passage.yourTime)}
                </span>
                {passage.yourTimeNote ? (
                  <span className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#666d80]">
                    {padTimeNote(passage.yourTimeNote)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="flex size-9 shrink-0 items-center justify-center rounded-[12px] border border-[#dfe1e6] bg-[#f9f9fb] text-[#666d80] transition-colors hover:bg-white"
            aria-label="Edit passage notes"
          >
            <Pencil className="size-[18px]" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

function RcDrillResultsView({
  questionCount,
  rawScore,
  scaledScore,
  elapsedSeconds,
  timing,
  take,
  excluded,
  passages,
  questions,
  showBlindReview,
  bookmarkedIds,
  onToggleBookmark,
  onReviewInTester,
  onExcludedChange,
  variant = "drill",
  heroTitle: heroTitleOverride,
  compactLabel,
}: RcDrillResultsViewProps) {
  const { scaleFactor } = useAccommodations()
  const [filter, setFilter] = useState<QuestionFilter>("Question")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false)

  const heroTitle =
    heroTitleOverride ??
    formatRcDrillResultsTitle({
      passageCount: passages.length,
      timing,
      take,
      scaleFactor,
    })
  const isSection = variant === "section"
  const scoreHeadline = isSection
    ? scaledScore != null
      ? String(scaledScore)
      : `${rawScore}/${questionCount}`
    : formatAccuracyPct(rawScore, questionCount)

  const visiblePassages = useMemo(
    () =>
      filterPracticeResultPassages(passages, {
        incorrectOnly: filter === "Incorrect only",
        bookmarkedOnly,
        bookmarkedIds,
      }),
    [bookmarkedIds, bookmarkedOnly, filter, passages],
  )

  return (
    <div className={PT_RESULTS_PAGE_GAP_CLASS}>
      <section className={PT_RESULTS_HERO_CARD_CLASS}>
        <div className="flex items-center justify-between gap-4">
          <h1 className="!m-0 !text-[24px] font-bold leading-[1.3] text-[#062357]">{heroTitle}</h1>
          <button
            type="button"
            onClick={onReviewInTester}
            className="inline-flex h-10 shrink-0 items-center rounded-[14px] bg-[#df1c41] px-4 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#df1c41]/90"
          >
            Review in tester
          </button>
        </div>

        <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex h-[199px] w-full shrink-0 flex-col justify-between rounded-[16px] bg-[#0d47a1] p-6 lg:w-[290px]">
            <p className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#edf3ff]">YOUR SCORE</p>
            <p className="text-[48px] font-extrabold leading-[1.2] text-white">
              {scoreHeadline}
            </p>
            <p className="text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#edf3ff]">
              {formatCorrectSummaryLine(rawScore, questionCount)}
            </p>
            <p className="text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#edf3ff]">
              ACTUAL PT EQUIVALENT = {scaledScore ?? "—"}
            </p>
          </div>

          <div className="flex min-h-[199px] min-w-0 w-full flex-col gap-[18px] rounded-[16px] bg-[#f6f8fa] p-6">
            <p className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#062357]">RESULTS</p>
            <div className="flex min-w-0 gap-[7px] overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <LrDrillCompactResultsCard
                questions={questions}
                label={compactLabel ?? "Score"}
              />
            </div>
          </div>
        </div>
      </section>

      <section
        className={cn(
          PT_RESULTS_SURFACE_CARD_CLASS,
          "px-6 py-4",
          dropdownOpen && FIGMA_DROPDOWN_CARD_OPEN_CLASS,
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-4">
            <p className="text-2xl font-bold leading-[1.3] text-[#062357]">
              {formatTotalQuestionsLabel(questionCount)}
            </p>
            <PracticeResultsBookmarkedOnlyToggle
              checked={bookmarkedOnly}
              onCheckedChange={setBookmarkedOnly}
            />
          </div>
          <FigmaDropdown
            variant="pill"
            value={filter}
            onChange={(next) => setFilter(next as QuestionFilter)}
            onOpenChange={setDropdownOpen}
            options={QUESTION_FILTER_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
            className={FIGMA_DROPDOWN_PILL_FILTER_CLASS}
          />
        </div>
      </section>

      {visiblePassages.length > 0
        ? visiblePassages.map((group) => (
            <section
              key={group.passage.id}
              className="min-w-0 overflow-hidden rounded-[24px] border border-[#dfe1e7] bg-white p-6"
            >
              <RcDrillPassageHeader passage={group.passage} />
              {group.questions.map((q) => (
                <DrillResultsQuestionRow
                  key={q.question.id}
                  meta={q}
                  showBlindReview={showBlindReview}
                  bookmarked={bookmarkedIds.has(practiceResultQuestionBookmarkId(q))}
                  onToggleBookmark={onToggleBookmark}
                  first={false}
                />
              ))}
            </section>
          ))
        : (
            <PracticeResultsEmptyFilterMessage
              bookmarkedOnly={bookmarkedOnly}
              incorrectOnly={filter === "Incorrect only"}
              scope={isSection ? "section" : "drill"}
            />
          )}

      <section className={cn(PT_RESULTS_SURFACE_CARD_CLASS, "flex flex-col gap-6 px-6 py-4")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="!m-0 !text-[24px] font-bold leading-[1.3] text-[#062357]">About this PrepTest</p>
          <div className="flex w-[212px] shrink-0 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="!text-[20px] font-bold leading-[1.35] text-[#062357]">Insights</span>
              <Switch
                checked={excluded}
                onChange={(event) => onExcludedChange(event.target.checked)}
                aria-label="Exclude this drill from insights"
                size="md"
              />
            </div>
            <p className="text-xs font-normal leading-[1.5] tracking-[0.02em] text-[#666d80]">
              Exclude from Insights
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-12 md:grid-cols-2">
          {(
            [
              ["Questions", String(questionCount), "Timing", formatDrillAboutTiming(timing, elapsedSeconds, scaleFactor)],
              ["Time used", formatMinutesSecondsLabel(elapsedSeconds), "Take", formatTakeLabel(take)],
            ] as const
          ).map(([leftLabel, leftValue, rightLabel, rightValue]) => (
            <div key={leftLabel} className="contents">
              <div className="flex min-h-12 items-center justify-between gap-4 border-b border-[#f1f5f9] py-3">
                <span className="text-base font-medium leading-[1.5] tracking-[0.02em] text-[#062357]">
                  {leftLabel}
                </span>
                <span className="text-right text-base font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">
                  {leftValue}
                </span>
              </div>
              <div className="flex min-h-12 items-center justify-between gap-4 border-b border-[#f1f5f9] py-3">
                <span className="text-base font-medium leading-[1.5] tracking-[0.02em] text-[#062357]">
                  {rightLabel}
                </span>
                <span className="text-right text-base font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">
                  {rightValue}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="flex items-center gap-2.5 self-start text-lg font-semibold leading-[1.4] tracking-[0.02em] text-[#df1c41] transition-opacity hover:opacity-80"
        >
          <Trash2 className="size-5 shrink-0" aria-hidden />
          Delete PrepTest
        </button>
      </section>
    </div>
  )
}

export { RcDrillResultsView }
export type { RcDrillResultsViewProps }
