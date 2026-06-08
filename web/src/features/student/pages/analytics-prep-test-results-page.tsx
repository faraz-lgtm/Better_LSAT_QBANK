import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import {
  Bookmark,
  CheckCircle2,
  ChevronDown,
  FolderOpen,
  Pencil,
  Share2,
  Trash2,
  XCircle,
} from "lucide-react"

import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import {
  type PrepTestAboutMeta,
  type PrepTestPassageSummary,
  type PrepTestQuestionResultRow,
  type PrepTestRcSectionBlock,
  type PrepTestResultsDetail,
  type PrepTestSectionKind,
  type PrepTestSectionSummary,
  type QuestionResultStatus,
} from "@/features/student/lib/mock-analytics-prep-test-results"
import {
  formatPrepTestResultsTitle,
  mapPrepTestDetailToResults,
} from "@/features/student/analytics/map-prep-test-results"
import { useAnalyticsApi, usePracticeApi } from "@/features/student/analytics/hooks/use-analytics-api"

const QUESTION_FILTER_OPTIONS = ["Question", "Passage", "Incorrect only"] as const

const SECTION_BADGE: Record<
  PrepTestSectionKind,
  { bg: string; text: string; short: string }
> = {
  LR: { bg: "#fffbeb", text: "#ae8b00", short: "LR" },
  RC: { bg: "#fff3ea", text: "#ff9d51", short: "RC" },
}

const DIFFICULTY: Record<
  PrepTestQuestionResultRow["difficulty"],
  { dots: number; color: string; inactive: string }
> = {
  Easiest: { dots: 1, color: "#40c4aa", inactive: "#ced0e7" },
  Easy: { dots: 2, color: "#ffbd4c", inactive: "#ced0e7" },
  Medium: { dots: 3, color: "#ff6f00", inactive: "#ced0e7" },
  Hard: { dots: 4, color: "#df1c41", inactive: "#ced0e7" },
  Hardest: { dots: 5, color: "#df1c41", inactive: "#ced0e7" },
}

function QuestionOutcomeIcon({ status }: { status: QuestionResultStatus }) {
  if (status === "correct") {
    return <CheckCircle2 className="size-4 shrink-0 text-[#00d492]" aria-hidden />
  }
  return <XCircle className="size-4 shrink-0 text-[#df1c41]" aria-hidden />
}

function SectionResultCard({ section }: { section: PrepTestSectionSummary }) {
  const badge = SECTION_BADGE[section.kind]
  return (
    <article
      className="flex w-[212px] shrink-0 flex-col gap-3 rounded-2xl border border-[#f6f8fa] bg-white p-4 shadow-[0px_1px_1px_rgba(13,13,18,0.04)]"
    >
      <div className="flex h-8 items-center gap-1.5">
        <div
          className="flex size-6 items-center justify-center rounded-lg text-xs font-extrabold leading-[1.3]"
          style={{ backgroundColor: badge.bg, color: badge.text }}
        >
          {badge.short}
        </div>
        <p className="text-[10px] font-bold leading-[1.5] tracking-[0.02em] text-[#062357]">{section.longName}</p>
      </div>
      <div className="flex h-8 items-center justify-between gap-2">
        <p className="text-xs font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">{section.sectionLabel}</p>
        <p className="text-2xl font-bold leading-[1.3] text-[#041a44]">{section.scoreDelta}</p>
      </div>
      <div className="flex flex-col gap-1">
        {section.questionRows.map((row, ri) => (
          <div key={ri} className="flex flex-wrap gap-1">
            {row.map((cell, ci) => (
              <QuestionOutcomeIcon key={`${ri}-${ci}`} status={cell} />
            ))}
          </div>
        ))}
      </div>
      <div className="flex h-5 items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-lg bg-[#f6f8fa]">
          <div className="h-full rounded-lg bg-[#0d47a1]" style={{ width: `${section.accuracyPct}%` }} />
        </div>
        <p className="w-10 text-right text-sm font-medium leading-[1.5] tracking-[0.02em] text-[#0d47a1]">
          {section.accuracyPct}%
        </p>
      </div>
    </article>
  )
}

function ResultsSummaryPanel({ detail }: { detail: PrepTestResultsDetail }) {
  return (
    <section className="mb-6 flex w-full flex-col gap-6 rounded-3xl border border-[#dfe1e7] bg-white p-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex w-full shrink-0 flex-col gap-6 lg:w-[290px]">
          <div className="flex flex-col gap-1.5 rounded-2xl bg-[#0d47a1] p-6">
            <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#edf3ff]">YOUR SCORE</p>
            <p className="text-5xl font-extrabold leading-[1.2] text-white">{detail.scaledScore}</p>
            <p className="text-base font-semibold leading-[1.5] tracking-[0.02em] text-[#edf3ff]">
              {detail.correctSummary}
            </p>
            <p className="text-base font-semibold leading-[1.5] tracking-[0.02em] text-[#edf3ff]">
              PERCENTILE: {detail.percentile % 1 === 0 ? detail.percentile : detail.percentile.toFixed(1)}
            </p>
          </div>
          <div className="rounded-2xl bg-[#f6f8fa] p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1.5 font-bold text-[#062357]">
                <p className="text-xs font-bold leading-[1.5] tracking-[0.02em]">YOUR PREDICTION</p>
                <p className="text-2xl font-bold leading-[1.3]">{detail.prediction}</p>
              </div>
              <div className="h-8 w-0.5 shrink-0 bg-[#dfe1e7]" aria-hidden />
              <div className="flex flex-col gap-1.5 font-bold text-[#df1c41]">
                <p className="text-xs font-bold leading-[1.5] tracking-[0.02em]">BLIND REVIEW</p>
                <p className="text-2xl font-bold leading-[1.3]">{detail.blindReview}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-[316px] min-w-0 flex-1 flex-col gap-[18px] rounded-2xl bg-[#f6f8fa] p-6">
          <h2 className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">RESULTS BY SECTION</h2>
          <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {detail.sections.map((section) => (
              <SectionResultCard key={section.id} section={section} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TotalQuestionsBar({
  total,
  filter,
  onFilterChange,
}: {
  total: number
  filter: (typeof QUESTION_FILTER_OPTIONS)[number]
  onFilterChange: (next: (typeof QUESTION_FILTER_OPTIONS)[number]) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <section className="mb-6 flex flex-col rounded-2xl border border-[#dfe1e7] bg-white px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-2xl font-bold leading-[1.3] text-[#062357]">Total Questions: {total}</p>
        <div className="relative w-full min-w-[160px] max-w-[160px] sm:w-[160px]">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex h-[52px] w-full items-center gap-2 rounded-2xl border border-[#dfe1e7] bg-white px-3 text-base font-medium leading-[1.5] tracking-[0.02em] text-[#666d80]"
            aria-expanded={open}
            aria-haspopup="listbox"
          >
            <span className="min-w-0 flex-1 truncate text-left">{filter}</span>
            <ChevronDown className="size-5 shrink-0 text-[#666d80]" aria-hidden />
          </button>
          {open ? (
            <ul
              role="listbox"
              className="absolute right-0 z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white py-1 shadow-[0px_24px_24px_rgba(13,13,18,0.12)]"
            >
              {QUESTION_FILTER_OPTIONS.map((opt) => (
                <li key={opt} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={opt === filter}
                    onClick={() => {
                      onFilterChange(opt)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex h-10 w-full items-center px-3 text-sm font-medium tracking-[0.02em] transition-colors",
                      opt === filter ? "bg-[#f3f7ff] text-[#0d47a1]" : "text-[#062357] hover:bg-[#f6f8fa]",
                    )}
                  >
                    {opt}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function DifficultyMeter({ difficulty }: { difficulty: PrepTestQuestionResultRow["difficulty"] }) {
  const { dots, color, inactive } = DIFFICULTY[difficulty]
  return (
    <div className="flex h-10 w-[132px] items-center gap-2.5 rounded-[10px] bg-[#f3f7ff] px-2.5">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="block h-4 w-1.5 rounded-full"
            style={{ backgroundColor: i < dots ? color : inactive }}
          />
        ))}
      </div>
      <span className="text-xs font-semibold leading-[1.5] tracking-[0.02em]" style={{ color }}>
        {difficulty}
      </span>
    </div>
  )
}

function PassageSummaryRow({ passage }: { passage: PrepTestPassageSummary }) {
  return (
    <div className="rounded-t-3xl border border-b-0 border-[#dfe1e7] bg-[#f3f7ff] p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex shrink-0 gap-6">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-[14px] border border-[#0d47a1] bg-[#f3f7ff]">
            <span className="text-2xl font-bold leading-[1.3] text-[#0d47a1]">{passage.passageLabel}</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h3 className="text-xl font-bold leading-[1.35] text-[#062357]">{passage.title}</h3>
            <div className="flex flex-wrap gap-2.5">
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
        </div>
        <div className="flex flex-1 flex-wrap items-start gap-8 lg:justify-end">
          <div className="flex min-w-[140px] flex-col gap-3">
            <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">Difficulty</p>
            <DifficultyMeter difficulty={passage.difficulty} />
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">Time:</p>
            <div className="flex flex-wrap gap-5 text-sm">
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
          <div className="flex justify-end lg:ml-auto">
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-xl border border-[#dfe1e6] bg-[#f9f9fb] text-[#666d80] transition-colors hover:bg-white"
              aria-label="Edit passage notes"
            >
              <Pencil className="size-[18px]" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnswerPopularityBars({
  values,
  correctLetter,
}: {
  values: PrepTestQuestionResultRow["answerPopularity"]
  correctLetter: PrepTestQuestionResultRow["correctLetter"]
}) {
  const letters: PrepTestQuestionResultRow["correctLetter"][] = ["A", "B", "C", "D", "E"]
  const max = Math.max(1, ...values)
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">Answer Popularity</p>
      <div className="flex flex-wrap items-end justify-between gap-2">
        {values.map((raw, i) => {
          const letter = letters[i]
          const h = Math.round((raw / max) * 100)
          const isCorrect = letter === correctLetter
          return (
            <div key={letter} className="flex w-[72px] flex-col items-center gap-1 sm:w-[84px]">
              <div className="flex h-20 w-full flex-col justify-end overflow-hidden rounded-t-[10px] bg-[#f3f4f6]">
                <div
                  className={cn("w-full rounded-t-[10px]", isCorrect ? "bg-[#00d492]" : "bg-[#dfe1e7]")}
                  style={{ height: `${Math.max(8, h)}%` }}
                />
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className={cn(
                    "text-xs font-bold leading-4",
                    isCorrect ? "text-[#00d492]" : "font-normal text-[#666d80]",
                  )}
                >
                  {letter}
                </span>
                {isCorrect ? <CheckCircle2 className="size-3 text-[#00d492]" aria-hidden /> : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function QuestionResultRow({
  row,
  variant = "belowPassage",
  className,
}: {
  row: PrepTestQuestionResultRow
  /** `stacked` — rows inside RC card (`17980:10398`); `belowPassage` — under LR passage band */
  variant?: "belowPassage" | "stacked"
  className?: string
}) {
  return (
    <div
      className={cn(
        "bg-white p-6",
        variant === "belowPassage" && "border border-t-0 border-[#dfe1e7] last:rounded-b-3xl",
        variant === "stacked" && className,
      )}
    >
      <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:gap-10">
        {/* Left — question info + timing (Figma `17925:12876`) */}
        <div className="flex min-w-0 shrink-0 gap-6">
          <div
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-[14px]",
              row.actualCorrect ? "bg-[#00d492]" : "bg-[#df1c41]",
            )}
          >
            <span className="text-2xl font-bold leading-[1.3] text-white">{row.number}</span>
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="whitespace-nowrap text-xl font-bold leading-[1.35] text-[#062357]">{row.title}</h3>
              <div className="flex flex-wrap gap-2.5">
                {row.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex h-5 items-center rounded-2xl border border-[#dfe1e7] bg-[#f6f8fa] px-2 py-0.5 text-[10px] font-normal leading-[1.5] tracking-[0.02em] text-[#0d0d12]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">Timing</p>
              <div className="flex gap-1">
                <span className="w-20 text-xs font-normal leading-[1.5] tracking-[0.02em] text-[#666d80]">
                  Target time:
                </span>
                <span className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">
                  {row.targetTime}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="w-20 text-xs font-normal leading-[1.5] tracking-[0.02em] text-[#666d80]">
                  Your time:
                </span>
                <span className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#0d47a1]">
                  {row.yourTime}
                </span>
                <span className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">
                  {row.yourTimeNote}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle — difficulty */}
        <div className="flex shrink-0 flex-col gap-3">
          <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">Difficulty</p>
          <DifficultyMeter difficulty={row.difficulty} />
        </div>

        {/* Right — result + answer popularity */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">Result</p>
            <div className="flex shrink-0 gap-4">
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-xl border border-[#dfe1e6] bg-[#f9f9fb] text-[#666d80] transition-colors hover:bg-white"
                aria-label="Edit question"
              >
                <Pencil className="size-[18px]" aria-hidden />
              </button>
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-xl border border-[#dfe1e6] bg-[#f9f9fb] text-[#666d80] transition-colors hover:bg-white"
                aria-label="Bookmark question"
              >
                <Bookmark className="size-[18px]" aria-hidden />
              </button>
            </div>
          </div>
          <div className="flex flex-nowrap items-center gap-5">
            <div className="flex shrink-0 items-center gap-2.5">
              {row.actualCorrect ? (
                <CheckCircle2 className="size-6 shrink-0 text-[#00d492]" aria-hidden />
              ) : (
                <XCircle className="size-6 shrink-0 text-[#df1c41]" aria-hidden />
              )}
              <span className="text-base font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">Actual</span>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              {row.blindReviewCorrect ? (
                <CheckCircle2 className="size-6 shrink-0 text-[#00d492]" aria-hidden />
              ) : (
                <XCircle className="size-6 shrink-0 text-[#df1c41]" aria-hidden />
              )}
              <span className="text-base font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">
                Blind Review
              </span>
            </div>
          </div>
          <AnswerPopularityBars values={row.answerPopularity} correctLetter={row.correctLetter} />
        </div>
      </div>
    </div>
  )
}

function SectionBlock({
  sectionTitle,
  badgeKind,
  score,
  blind,
  children,
  className,
}: {
  sectionTitle: string
  badgeKind: PrepTestSectionKind
  score: string
  blind: string
  children: ReactNode
  className?: string
}) {
  const badge = SECTION_BADGE[badgeKind]
  return (
    <section className={cn("mb-6 overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white", className)}>
      <div className="bg-[#f6f8fa] px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex size-10 items-center justify-center rounded-xl text-xl font-black leading-[1.5] tracking-[0.02em]"
              style={{ backgroundColor: badge.bg, color: badge.text }}
            >
              {badge.short}
            </div>
            <h2 className="text-2xl font-bold leading-[1.3] text-[#062357]">{sectionTitle}</h2>
          </div>
          <div className="flex items-center gap-6 sm:gap-16">
            <div className="flex flex-col gap-1 font-bold text-[#062357]">
              <p className="text-xs font-bold leading-[1.5] tracking-[0.02em]">SCORE</p>
              <p className="text-2xl font-bold leading-[1.3]">{score}</p>
            </div>
            <div className="h-8 w-0.5 shrink-0 bg-[#dfe1e7]" aria-hidden />
            <div className="flex flex-col gap-1 font-bold text-[#062357]">
              <p className="text-xs font-bold leading-[1.5] tracking-[0.02em]">BLIND REVIEW</p>
              <p className="text-2xl font-bold leading-[1.3]">{blind}</p>
            </div>
          </div>
        </div>
      </div>
      {children}
    </section>
  )
}

/** Figma `17980:10398` — RC section + stacked question rows */
function RcSectionPanel({
  block,
  questionFilter,
}: {
  block: PrepTestRcSectionBlock
  questionFilter: (typeof QUESTION_FILTER_OPTIONS)[number]
}) {
  const badge = SECTION_BADGE.RC
  return (
    <section className="mb-6 flex flex-col gap-6 rounded-3xl border border-[#dfe1e7] bg-white p-6">
      <div className="rounded-2xl bg-[#f6f8fa] px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex size-10 items-center justify-center rounded-xl text-xl font-black leading-[1.5] tracking-[0.02em]"
              style={{ backgroundColor: badge.bg, color: badge.text }}
            >
              {badge.short}
            </div>
            <h2 className="text-2xl font-bold leading-[1.3] text-[#062357]">{block.sectionTitle}</h2>
          </div>
          <div className="flex items-center gap-6 sm:gap-16">
            <div className="flex flex-col gap-1 font-bold text-[#062357]">
              <p className="text-xs font-bold leading-[1.5] tracking-[0.02em]">SCORE</p>
              <p className="text-2xl font-bold leading-[1.3]">{block.scoreDisplay}</p>
            </div>
            <div className="h-8 w-0.5 shrink-0 bg-[#dfe1e7]" aria-hidden />
            <div className="flex flex-col gap-1 font-bold text-[#062357]">
              <p className="text-xs font-bold leading-[1.5] tracking-[0.02em]">BLIND REVIEW</p>
              <p className="text-2xl font-bold leading-[1.3]">{block.blindReviewDisplay}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-3xl border border-[#dfe1e7]">
        {(questionFilter === "Incorrect only"
          ? block.questions.filter((q) => !q.actualCorrect)
          : block.questions
        ).map((q, i) => (
          <QuestionResultRow
            key={q.id}
            row={q}
            variant="stacked"
            className={cn(i > 0 && "border-t border-[#dfe1e7]")}
          />
        ))}
      </div>
    </section>
  )
}

function AboutMetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-b border-[#f1f5f9] py-3">
      <span className="text-base font-medium leading-[1.5] tracking-[0.02em] text-[#45556c]">{label}</span>
      <span className="text-right text-base font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">
        {value}
      </span>
    </div>
  )
}

/** Figma `17984:7995` — About this PrepTest */
function AboutPrepTestCard({
  meta,
  excludeFromAnalytics,
  onExcludeFromAnalyticsChange,
}: {
  meta: PrepTestAboutMeta
  excludeFromAnalytics: boolean
  onExcludeFromAnalyticsChange: (next: boolean) => void
}) {
  return (
    <section className="mb-6 flex flex-col gap-6 rounded-2xl border border-[#dfe1e7] bg-white px-6 py-4 shadow-[0px_1px_2px_rgba(16,24,40,0.06),0px_1px_3px_rgba(16,24,40,0.1)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-2xl font-bold leading-[1.3] text-[#062357]">About this PrepTest</h2>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold leading-[1.35] text-[#062357]">Analytics</span>
            <Switch
              checked={excludeFromAnalytics}
              onChange={(event) => onExcludeFromAnalyticsChange(event.target.checked)}
              aria-label="Exclude this PrepTest from analytics"
              size="sm"
            />
          </div>
          <p className="text-xs font-normal leading-[1.5] tracking-[0.02em] text-[#666d80]">
            Exclude from analytics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-12 md:grid-cols-2">
        <div className="flex min-w-0 flex-col">
          <AboutMetricRow label="Questions" value={meta.questionCount} />
          <AboutMetricRow label="Time used" value={meta.timeUsed} />
          <AboutMetricRow label="Format" value={meta.format} />
        </div>
        <div className="flex min-w-0 flex-col">
          <AboutMetricRow label="Timing" value={meta.timing} />
          <AboutMetricRow label="Take" value={meta.take} />
          <AboutMetricRow label="Source" value={meta.source} />
        </div>
      </div>

      <button
        type="button"
        className="flex items-center gap-2.5 self-start text-lg font-semibold leading-[1.4] tracking-[0.02em] text-[#df1c41] transition-opacity hover:opacity-80"
      >
        <Trash2 className="size-5 shrink-0" aria-hidden />
        Delete PrepTest
      </button>
    </section>
  )
}

function AnalyticsPrepTestResultsPage() {
  const { testId = "" } = useParams<{ testId: string }>()
  const navigate = useNavigate()
  const analyticsApi = useAnalyticsApi()
  const practiceApi = usePracticeApi()
  const [questionFilter, setQuestionFilter] = useState<(typeof QUESTION_FILTER_OPTIONS)[number]>("Question")
  const [excludeFromAnalytics, setExcludeFromAnalytics] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<PrepTestResultsDetail | null>(null)
  const [completedAt, setCompletedAt] = useState<string>("")
  const [prepTestId, setPrepTestId] = useState<string>("")
  const [prepTestTitle, setPrepTestTitle] = useState<string>("")
  const [moduleId, setModuleId] = useState<string | null>(null)

  useEffect(() => {
    if (!analyticsApi || !testId) {
      setLoading(false)
      if (!testId) setError("Missing session id")
      return
    }
    setLoading(true)
    void analyticsApi
      .getPrepTestSessionDetail(testId)
      .then((api) => {
        setDetail(mapPrepTestDetailToResults(api))
        setCompletedAt(api.completedAt)
        setPrepTestId(api.prepTestId)
        setPrepTestTitle(api.prepTestTitle)
        setModuleId(api.moduleId)
        setExcludeFromAnalytics(api.excluded)
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false))
  }, [analyticsApi, testId])

  const pageTitle = useMemo(() => {
    if (!completedAt) return prepTestTitle || "PrepTest results"
    return formatPrepTestResultsTitle(prepTestTitle, moduleId, completedAt)
  }, [completedAt, moduleId, prepTestTitle])

  if (loading) {
    return (
      <StudentMain>
        <div className="flex items-center gap-2 text-sm text-[#666d80]">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading results…
        </div>
      </StudentMain>
    )
  }
  if (error || !detail) {
    return (
      <StudentMain>
        <p className="text-sm text-red-600">{error ?? "Results not found"}</p>
      </StudentMain>
    )
  }

  return (
    <>
      <StudentSubnavStrip
        crumbs={[
          { label: "Analytics", href: "/app/analytics" },
          { label: "Foundations" },
          { label: "PrepTests", href: "/app/analytics/preptests" },
          { label: "Results" },
        ]}
      />
      <StudentMain>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold leading-[1.3] text-[#062357]">{pageTitle}</h1>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe1e7] bg-white px-4 text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#0d47a1] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f3f7ff]"
            >
              <Share2 className="size-4 shrink-0" aria-hidden />
              Share
            </button>
            <button
              type="button"
              onClick={() => navigate(`/app/practice/preptest/${encodeURIComponent(prepTestId || testId)}`)}
              className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#df1c41] px-4 text-sm font-semibold leading-[1.5] tracking-[0.02em] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#df1c41]/90"
            >
              <FolderOpen className="size-4 shrink-0" aria-hidden />
              Review
            </button>
          </div>
        </div>

        <ResultsSummaryPanel detail={detail} />

        <TotalQuestionsBar total={detail.totalQuestions} filter={questionFilter} onFilterChange={setQuestionFilter} />

        {detail.lrSections.map((lrSection) => (
          <SectionBlock
            key={lrSection.sectionTitle}
            sectionTitle={lrSection.sectionTitle}
            badgeKind="LR"
            score={lrSection.scoreDisplay}
            blind={lrSection.blindReviewDisplay}
          >
            <>
              {lrSection.passages.map((p) => (
                <PassageSummaryRow key={p.id} passage={p} />
              ))}
              {(questionFilter === "Incorrect only"
                ? lrSection.questions.filter((q) => !q.actualCorrect)
                : lrSection.questions
              ).map((q) => (
                <QuestionResultRow key={q.id} row={q} variant="belowPassage" />
              ))}
            </>
          </SectionBlock>
        ))}

        {detail.rcSection.questions.length > 0 ? (
          <RcSectionPanel block={detail.rcSection} questionFilter={questionFilter} />
        ) : null}

        <AboutPrepTestCard
          meta={detail.about}
          excludeFromAnalytics={excludeFromAnalytics}
          onExcludeFromAnalyticsChange={(next) => {
            setExcludeFromAnalytics(next)
            if (practiceApi && testId) {
              void practiceApi.updateSession({ sessionId: testId, excluded: next })
            }
          }}
        />
      </StudentMain>
    </>
  )
}

export { AnalyticsPrepTestResultsPage }
