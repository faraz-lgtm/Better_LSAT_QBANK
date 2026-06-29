import type { ReactNode } from "react"
import { Pencil } from "lucide-react"

import {
  PT_RESULTS_PAGE_GAP_CLASS,
  PT_RESULTS_SECTION_BLOCK_CLASS,
  PT_RESULTS_SECTION_HEADER_CLASS,
  PT_RESULTS_SURFACE_CARD_CLASS,
} from "@/features/student/analytics/prep-test-results-section-styles"
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

function PracticeResultsTotalQuestionsBar({ total }: { total: number }) {
  return (
    <section className={cn(PT_RESULTS_SURFACE_CARD_CLASS, "px-[24px] py-4")}>
      <p className="text-2xl font-bold leading-[1.3] text-[#062357]">Total Questions: {total}</p>
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
            <h2 className="whitespace-nowrap text-2xl font-bold leading-[1.3] text-[#062357]">{sectionTitle}</h2>
          </div>
          <div className="flex w-[258px] shrink-0 items-center justify-between">
            <div className="flex flex-col gap-[5px] font-bold text-[#062357]">
              <p className="text-xs font-bold leading-[1.5] tracking-[0.24px]">SCORE</p>
              <p className="text-2xl font-bold leading-[1.3]">{scoreDisplay}</p>
            </div>
            {showBlindReview ? (
              <>
                <div className="h-[32px] w-[2px] shrink-0 bg-[#dfe1e7]" aria-hidden />
                <div className="flex flex-col gap-[5px] font-bold text-[#062357]">
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
    <div className={cn("bg-white", PRACTICE_RESULTS_CARD_PAD_CLASS)}>
      <div className="flex items-start gap-5">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-[14px] border border-[#0d47a1] bg-[#f3f7ff]">
          <span className="text-2xl font-bold leading-[1.3] text-[#0d47a1]">{passage.passageLabel}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-x-6 gap-y-4 lg:flex-nowrap">
          <div className="w-full min-w-[200px] shrink-0 lg:w-[305px]">
            <h3 className="text-xl font-bold leading-[1.35] text-[#062357]">{passage.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2.5">
              {passage.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex h-5 items-center rounded-2xl border border-[#dfe1e7] bg-[#f6f8fa] px-2 py-0.5 text-[10px] font-normal leading-[1.5] tracking-[0.02em] text-[#0d0d12]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="w-full shrink-0 sm:w-[256px]">
            <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">Difficulty</p>
            <div className="mt-3">
              <PracticeDifficultyMeter difficulty={passage.difficulty} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">Time:</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <div className="flex gap-1">
                <span className="text-xs font-normal leading-[1.5] tracking-[0.02em] text-[#666d80]">
                  Target time:
                </span>
                <span className="font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">
                  {passage.targetTime}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="text-xs font-normal leading-[1.5] tracking-[0.02em] text-[#666d80]">
                  Your time:
                </span>
                <span className="font-semibold leading-[1.5] tracking-[0.02em] text-[#0d47a1]">{passage.yourTime}</span>
                <span className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">
                  {passage.yourTimeNote}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#dfe1e6] bg-[#f9f9fb] text-[#666d80] transition-colors hover:bg-white"
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
  PracticeResultsPassageRow,
  PracticeResultsSectionCard,
  PracticeResultsTotalQuestionsBar,
  formatScoreDelta,
}
