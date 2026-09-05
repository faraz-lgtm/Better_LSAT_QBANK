import type { ReactNode } from "react"
import { Bookmark, Pencil } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import {
  PT_RESULTS_PAGE_GAP_CLASS,
  PT_RESULTS_SECTION_BLOCK_CLASS,
  PT_RESULTS_SECTION_HEADER_CLASS,
  PT_RESULTS_SURFACE_CARD_CLASS,
} from "@/features/student/analytics/prep-test-results-section-styles"
import { checkedFromToggleEvent } from "@/features/student/analytics/session-bookmarks"
import {
  PracticeDifficultyMeter,
  type PracticeDifficultyLabel,
} from "@/features/student/practice-session/practice-results-ui"
import type { PracticeSectionKind } from "@/features/student/practice-session/practice-results-summary-panel"
import { cn } from "@/lib/utils"

/** Figma results list — 24px gaps between white cards */
export const PRACTICE_RESULTS_STACK_CLASS = PT_RESULTS_PAGE_GAP_CLASS
export const PRACTICE_RESULTS_CARD_CLASS = PT_RESULTS_SURFACE_CARD_CLASS
export const PRACTICE_RESULTS_CARD_PAD_CLASS = "p-6"

const SECTION_BADGE: Record<
  PracticeSectionKind,
  { bg: string; text: string; border: string; short: string }
> = {
  LR: { bg: "#eafff4", text: "#00bc54", border: "#00bc54", short: "LR" },
  RC: { bg: "#e5fdff", text: "#0bbcc9", border: "#0bbcc9", short: "RC" },
}

export type PracticePassageSummary = {
  id: string
  passageLabel: string
  title: string
  tags: string[]
  difficulty: PracticeDifficultyLabel
  targetTime: string
  yourTime: string
  yourTimeNote: string
}

function formatScoreDelta(incorrectCount: number): string {
  if (incorrectCount <= 0) return "0"
  return `-${incorrectCount}`
}

function PracticeResultsEmptyFilterMessage({
  bookmarkedOnly,
  incorrectOnly,
  scope,
}: {
  bookmarkedOnly: boolean
  incorrectOnly: boolean
  scope: "section" | "drill"
}) {
  const message = bookmarkedOnly
    ? scope === "section"
      ? "No bookmarked questions in this section. Bookmark a question to see it here."
      : "No bookmarked questions in this drill. Bookmark a question to see it here."
    : incorrectOnly
      ? scope === "section"
        ? "No incorrect questions in this section."
        : "No incorrect questions in this drill."
      : "No questions to show."

  return (
    <p className="rounded-[16px] border border-dashed border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-6 py-8 text-center text-sm text-[var(--greyscale-500)]">
      {message}
    </p>
  )
}

function PracticeResultsBookmarkedOnlyToggle({
  checked,
  onCheckedChange,
}: {
  checked: boolean
  onCheckedChange: (next: boolean) => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <Bookmark className="size-4 shrink-0 text-[var(--color-student-heading)]" aria-hidden />
      <span className="whitespace-nowrap text-base font-semibold leading-normal tracking-[0.02em] text-[var(--color-student-heading)]">
        Bookmarked only
      </span>
      <Switch
        checked={checked}
        onChange={(event) => onCheckedChange(checkedFromToggleEvent(event))}
        aria-label="Show bookmarked only"
      />
    </div>
  )
}

function PracticeResultsTotalQuestionsBar({
  total,
  bookmarkedOnly,
  onBookmarkedOnlyChange,
}: {
  total: number
  bookmarkedOnly?: boolean
  onBookmarkedOnlyChange?: (next: boolean) => void
}) {
  return (
    <section className={cn(PT_RESULTS_SURFACE_CARD_CLASS, "px-[24px] py-4")}>
      <div className="flex min-w-0 flex-wrap items-center gap-4">
        <p className="text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">Total Questions: {total}</p>
        {onBookmarkedOnlyChange ? (
          <PracticeResultsBookmarkedOnlyToggle
            checked={Boolean(bookmarkedOnly)}
            onCheckedChange={onBookmarkedOnlyChange}
          />
        ) : null}
      </div>
    </section>
  )
}

function PracticeResultsSectionCard({
  sectionTitle,
  badgeKind,
  scoreDisplay,
  blindReviewDisplay,
  showBlindReview,
  children,
  className,
}: {
  sectionTitle: string
  badgeKind: PracticeSectionKind
  scoreDisplay: string
  blindReviewDisplay?: string
  showBlindReview?: boolean
  children: ReactNode
  className?: string
}) {
  const badge = SECTION_BADGE[badgeKind]
  return (
    <section className={cn(PT_RESULTS_SECTION_BLOCK_CLASS, className)}>
      <div className={PT_RESULTS_SECTION_HEADER_CLASS}>
        <div className="flex flex-nowrap items-center justify-between gap-4">
          <div className="flex min-w-0 shrink-0 items-center gap-2.5">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-[12px] border text-xl font-black leading-[1.5] tracking-[0.02em]"
              style={{ backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }}
            >
              {badge.short}
            </div>
            <h2 className="whitespace-nowrap text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">{sectionTitle}</h2>
          </div>
          <div className="flex w-[258px] shrink-0 items-center justify-between">
            <div className="flex flex-col gap-[5px] font-bold text-[var(--color-student-heading)]">
              <p className="text-xs font-bold leading-[1.5] tracking-[0.24px]">SCORE</p>
              <p className="text-2xl font-bold leading-[1.3]">{scoreDisplay}</p>
            </div>
            {showBlindReview ? (
              <>
                <div className="h-[32px] w-[2px] shrink-0 bg-[var(--greyscale-100)]" aria-hidden />
                <div className="flex flex-col gap-[5px] font-bold text-[var(--color-student-heading)]">
                  <p className="text-xs font-bold leading-[1.5] tracking-[0.24px]">BLIND REVIEW</p>
                  <p className="text-2xl font-bold leading-[1.3]">{blindReviewDisplay ?? "—"}</p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-[24px]">{children}</div>
    </section>
  )
}

function PracticeResultsPassageRow({ passage }: { passage: PracticePassageSummary }) {
  return (
    <div className={cn("bg-[var(--greyscale-0)]", PRACTICE_RESULTS_CARD_PAD_CLASS)}>
      <div className="flex items-start gap-5">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-[14px] border border-[var(--primary)] bg-[var(--primary-0)]">
          <span className="text-2xl font-bold leading-[1.3] text-[var(--primary)]">{passage.passageLabel}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-x-6 gap-y-4 lg:flex-nowrap">
          <div className="w-full min-w-[200px] shrink-0 lg:w-[305px]">
            <h3 className="text-xl font-bold leading-[1.35] text-[var(--color-student-heading)]">{passage.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2.5">
              {passage.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex h-5 items-center rounded-2xl border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-2 py-0.5 text-[10px] font-normal leading-[1.5] tracking-[0.02em] text-[var(--color-student-heading)]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="w-full shrink-0 sm:w-[256px]">
            <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[var(--greyscale-500)]">Difficulty</p>
            <div className="mt-3">
              <PracticeDifficultyMeter difficulty={passage.difficulty} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[var(--greyscale-500)]">Time:</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <div className="flex gap-1">
                <span className="text-xs font-normal leading-[1.5] tracking-[0.02em] text-[var(--greyscale-500)]">
                  Target time:
                </span>
                <span className="font-semibold leading-[1.5] tracking-[0.02em] text-[var(--greyscale-500)]">
                  {passage.targetTime}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="text-xs font-normal leading-[1.5] tracking-[0.02em] text-[var(--greyscale-500)]">
                  Your time:
                </span>
                <span className="font-semibold leading-[1.5] tracking-[0.02em] text-[var(--primary)]">{passage.yourTime}</span>
                <span className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[var(--greyscale-500)]">
                  {passage.yourTimeNote}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-xl border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] text-[var(--greyscale-500)] transition-colors hover:bg-[var(--greyscale-0)]"
            aria-label="Edit passage notes"
          >
            <Pencil className="size-[18px]" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

export {
  PracticeResultsBookmarkedOnlyToggle,
  PracticeResultsEmptyFilterMessage,
  PracticeResultsPassageRow,
  PracticeResultsSectionCard,
  PracticeResultsTotalQuestionsBar,
  formatScoreDelta,
}
