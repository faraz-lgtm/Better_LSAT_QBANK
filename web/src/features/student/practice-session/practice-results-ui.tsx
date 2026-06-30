import { Check, Minus, X } from "lucide-react"
import type { ReactNode } from "react"

import type { ExplanationAnswerPopularityRow, ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import { cn } from "@/lib/utils"

export type PracticeDifficultyLabel = "Easiest" | "Easy" | "Medium" | "Hard" | "Hardest"

const DIFFICULTY_STYLE: Record<
  PracticeDifficultyLabel,
  { dots: number; color: string; inactive: string }
> = {
  Easiest: { dots: 1, color: "#40c4aa", inactive: "#ced0e7" },
  Easy: { dots: 2, color: "#ffbd4c", inactive: "#ced0e7" },
  Medium: { dots: 3, color: "#ff6f00", inactive: "#ced0e7" },
  Hard: { dots: 4, color: "#df1c41", inactive: "#ced0e7" },
  Hardest: { dots: 5, color: "#df1c41", inactive: "#ced0e7" },
}

export function difficultyLabelFromLevel(level: number): PracticeDifficultyLabel {
  if (level <= 1) return "Easiest"
  if (level === 2) return "Easy"
  if (level === 3) return "Medium"
  if (level === 4) return "Hard"
  return "Hardest"
}

export function formatPtQuestionTitle(detail: ExplanationDetailPayload): string {
  const pt = detail.prepTestNumber?.trim() || detail.prepTestTitle || "—"
  const section = detail.sectionNumber != null ? `S${detail.sectionNumber}` : "S—"
  const q = detail.questionNumber != null ? `Q${detail.questionNumber}` : "Q—"
  return `PT ${pt} . ${section} . ${q}`
}

export function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function targetTimeForDifficulty(label: PracticeDifficultyLabel): string {
  if (label === "Hardest" || label === "Hard") return "01:45"
  if (label === "Medium") return "01:30"
  return "01:15"
}

export function tagsFromTopicName(topicName: string): string[] {
  const t = topicName.trim()
  if (!t || t === "—") return []
  if (t.includes(",")) return t.split(",").map((s) => s.trim()).filter(Boolean)
  if (t.includes("·")) return t.split("·").map((s) => s.trim()).filter(Boolean)
  if (t.includes("|")) return t.split("|").map((s) => s.trim()).filter(Boolean)
  return [t]
}

export function resolveQuestionResultTags(
  detail: Pick<ExplanationDetailPayload, "topicName" | "tags" | "sectionType" | "passage">,
): string[] {
  if (detail.tags && detail.tags.length > 0) return detail.tags

  const fromTopic = tagsFromTopicName(detail.topicName)
  if (fromTopic.length > 0) return fromTopic

  const passageTitle = detail.passage?.title?.trim() ?? ""
  if (
    passageTitle &&
    !/^Passage \d+$/i.test(passageTitle) &&
    !/^Game \d+$/i.test(passageTitle)
  ) {
    const fromPassage = tagsFromTopicName(passageTitle)
    if (fromPassage.length > 0) return fromPassage
  }

  if (detail.sectionType) return [detail.sectionType]

  return []
}

export function correctChoiceLetter(
  choices: { id: string; index: number }[],
  correctChoiceId: string | null,
): string {
  if (!correctChoiceId) return "A"
  const normalized = correctChoiceId.trim().toUpperCase()
  const byId = choices.findIndex((c) => c.id.toUpperCase() === normalized)
  if (byId >= 0) return String.fromCharCode(65 + byId)
  const idx = choices.findIndex((c) => c.index === Number.parseInt(normalized, 10))
  if (idx >= 0) return String.fromCharCode(65 + idx)
  return normalized.slice(0, 1) || "A"
}

export function PracticeDifficultyMeter({ difficulty }: { difficulty: PracticeDifficultyLabel }) {
  const { dots, color, inactive } = DIFFICULTY_STYLE[difficulty]
  return (
    <div className="flex h-10 w-fit items-center gap-2.5 rounded-[10px] bg-[#f3f7ff] px-3">
      <div className="flex shrink-0 items-center gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="block h-4 w-1.5 rounded-full"
            style={{ backgroundColor: i < dots ? color : inactive }}
          />
        ))}
      </div>
      <span
        className="shrink-0 whitespace-nowrap text-xs font-semibold leading-normal tracking-[0.02em]"
        style={{ color }}
      >
        {difficulty}
      </span>
    </div>
  )
}

function CorrectAnswerPopularityBadge() {
  return (
    <span
      className="flex size-3 shrink-0 items-center justify-center rounded-full bg-[#00d492]"
      aria-hidden
    >
      <Check className="size-2 text-white" strokeWidth={3} />
    </span>
  )
}

const PRACTICE_RESULT_STATS_LABEL_CLASS =
  "m-0 text-sm font-semibold leading-normal tracking-[0.02em] text-[#666d80]"

const PRACTICE_RESULT_STATS_TIMING_LABEL_CLASS =
  "w-20 shrink-0 text-xs font-normal leading-normal tracking-[0.02em] text-[#666d80]"

function WrongAnswerPopularityBadge() {
  return (
    <span
      className="flex size-3 shrink-0 items-center justify-center rounded-full bg-[#ef4444]"
      aria-hidden
    >
      <X className="size-2 text-white" strokeWidth={3} />
    </span>
  )
}

function UnansweredAnswerPopularityBadge() {
  return (
    <span
      className="flex size-3 shrink-0 items-center justify-center rounded-full bg-[#ff6683]"
      aria-hidden
    >
      <Minus className="size-2 text-white" strokeWidth={3} />
    </span>
  )
}

const PRACTICE_QUESTION_RESULT_GRID_CLASS =
  "grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.35fr)_auto] items-start gap-x-6 gap-y-4 xl:gap-x-12"

type PracticeQuestionResultCardLayoutProps = {
  title: string
  tags: string[]
  resultContent: ReactNode
  actions?: ReactNode
  targetTime: string
  yourTime: string
  yourTimeNote: string
  difficulty: PracticeDifficultyLabel
  popularityRows: ExplanationAnswerPopularityRow[]
  correctLetter: string
  selectedLetter?: string | null
  isUnanswered?: boolean
  className?: string
}

function PracticeQuestionResultCardLayout({
  title,
  tags,
  resultContent,
  actions,
  targetTime,
  yourTime,
  yourTimeNote,
  difficulty,
  popularityRows,
  correctLetter,
  selectedLetter = null,
  isUnanswered = false,
  className,
}: PracticeQuestionResultCardLayoutProps) {
  return (
    <div className={cn(PRACTICE_QUESTION_RESULT_GRID_CLASS, className)}>
      <div className="col-span-2 flex min-w-0 flex-col gap-2">
        <h3 className="m-0 text-xl font-bold leading-[1.35] text-[#062357]">{title}</h3>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex h-5 items-center rounded-[16px] border border-[#dfe1e7] bg-[#f6f8fa] px-2 py-0.5 text-[10px] font-normal leading-normal tracking-[0.02em] text-[#0d0d12]"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <p className={PRACTICE_RESULT_STATS_LABEL_CLASS}>Result</p>
        {resultContent}
      </div>

      {actions ? <div className="flex shrink-0 justify-end self-start">{actions}</div> : <div aria-hidden />}

      <div className="flex min-w-0 flex-col gap-3">
        <p className={PRACTICE_RESULT_STATS_LABEL_CLASS}>Timing</p>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap gap-1">
            <span className={PRACTICE_RESULT_STATS_TIMING_LABEL_CLASS}>Target time:</span>
            <span className="text-sm font-semibold leading-normal tracking-[0.02em] text-[#666d80]">
              {targetTime}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            <span className={PRACTICE_RESULT_STATS_TIMING_LABEL_CLASS}>Your time:</span>
            <span className="whitespace-nowrap text-sm font-semibold leading-normal tracking-[0.02em] text-[#0d47a1]">
              {yourTime}
            </span>
            {yourTimeNote ? (
              <span className="text-sm font-semibold leading-normal tracking-[0.02em] text-[#666d80]">
                {yourTimeNote}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <p className={PRACTICE_RESULT_STATS_LABEL_CLASS}>Difficulty</p>
        <PracticeDifficultyMeter difficulty={difficulty} />
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <PracticeAnswerPopularityBars
          rows={popularityRows}
          correctLetter={correctLetter}
          selectedLetter={selectedLetter}
          isUnanswered={isUnanswered}
          showLabel
        />
      </div>

      <div aria-hidden />
    </div>
  )
}

type PracticeQuestionResultStatsRowProps = {
  targetTime: string
  yourTime: string
  yourTimeNote: string
  difficulty: PracticeDifficultyLabel
  popularityRows: ExplanationAnswerPopularityRow[]
  correctLetter: string
  selectedLetter?: string | null
  isUnanswered?: boolean
  className?: string
}

function PracticeQuestionResultStatsRow({
  targetTime,
  yourTime,
  yourTimeNote,
  difficulty,
  popularityRows,
  correctLetter,
  selectedLetter = null,
  isUnanswered = false,
  className,
}: PracticeQuestionResultStatsRowProps) {
  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className="flex w-full min-w-0 items-start gap-6 xl:gap-12">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className={PRACTICE_RESULT_STATS_LABEL_CLASS}>Timing</p>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap gap-1">
              <span className={PRACTICE_RESULT_STATS_TIMING_LABEL_CLASS}>Target time:</span>
              <span className="text-sm font-semibold leading-normal tracking-[0.02em] text-[#666d80]">
                {targetTime}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className={PRACTICE_RESULT_STATS_TIMING_LABEL_CLASS}>Your time:</span>
              <span className="whitespace-nowrap text-sm font-semibold leading-normal tracking-[0.02em] text-[#0d47a1]">
                {yourTime}
              </span>
              {yourTimeNote ? (
                <span className="text-sm font-semibold leading-normal tracking-[0.02em] text-[#666d80]">
                  {yourTimeNote}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className={PRACTICE_RESULT_STATS_LABEL_CLASS}>Difficulty</p>
          <PracticeDifficultyMeter difficulty={difficulty} />
        </div>

        <div className="flex min-w-0 flex-[1.35] flex-col gap-3">
          <PracticeAnswerPopularityBars
            rows={popularityRows}
            correctLetter={correctLetter}
            selectedLetter={selectedLetter}
            isUnanswered={isUnanswered}
            showLabel
          />
        </div>
      </div>
    </div>
  )
}

export function PracticeAnswerPopularityBars({
  rows,
  correctLetter,
  selectedLetter = null,
  isUnanswered = false,
  showLabel = true,
  className,
}: {
  rows: ExplanationAnswerPopularityRow[]
  correctLetter: string
  selectedLetter?: string | null
  isUnanswered?: boolean
  showLabel?: boolean
  className?: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.pct))
  const normalizedSelected = selectedLetter?.trim().toUpperCase() ?? null
  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      {showLabel ? <p className={PRACTICE_RESULT_STATS_LABEL_CLASS}>Answer Popularity</p> : null}
      <div className="flex w-full items-end gap-2">
        {rows.map((row) => {
          const h = Math.round((row.pct / max) * 100)
          const isCorrect = row.letter === correctLetter
          const isUserWrong =
            !isUnanswered &&
            normalizedSelected === row.letter &&
            !isCorrect
          const isUserMiss = isUnanswered && normalizedSelected === row.letter
          const hasOutcomeBadge = isCorrect || isUserWrong || isUserMiss
          const fillHeight = isCorrect
            ? row.pct > 0
              ? `${Math.max(8, h)}%`
              : "10%"
            : isUserWrong
              ? `${Math.max(8, h > 0 ? h : 8)}%`
              : row.pct > 0
                ? `${Math.max(4, h)}%`
                : "0%"
          return (
            <div
              key={row.letter}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1",
                hasOutcomeBadge ? "h-20" : "h-[68px]",
              )}
            >
              <div className="flex min-h-0 w-full flex-1 flex-col justify-end overflow-hidden rounded-t-[10px] bg-[#f3f4f6]">
                {isUserWrong ? (
                  <div
                    className="w-full shrink-0 rounded-t-[10px] bg-[#ef4444]"
                    style={{ height: fillHeight }}
                  />
                ) : (
                  <div
                    className={cn(
                      "w-full shrink-0 rounded-t-[10px]",
                      isCorrect ? "bg-[#00d492]" : "bg-[#dfe1e7]",
                    )}
                    style={{ height: fillHeight }}
                  />
                )}
              </div>
              <div className={cn("flex flex-col items-center", hasOutcomeBadge ? "h-7" : "h-4")}>
                <span
                  className={cn(
                    "text-xs leading-4",
                    isCorrect
                      ? "font-bold text-[#00d492]"
                      : isUserWrong
                        ? "font-normal text-[#6a7282]"
                        : "font-normal text-[#666d80]",
                  )}
                >
                  {row.letter}
                </span>
                {isCorrect ? (
                  <CorrectAnswerPopularityBadge />
                ) : isUserWrong ? (
                  <WrongAnswerPopularityBadge />
                ) : isUserMiss ? (
                  <UnansweredAnswerPopularityBadge />
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { PracticeQuestionResultCardLayout, PracticeQuestionResultStatsRow }
