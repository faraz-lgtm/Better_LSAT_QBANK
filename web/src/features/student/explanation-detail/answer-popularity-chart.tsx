import { Check } from "lucide-react"

import type { ExplanationAnswerPopularityRow } from "@/features/student/explanation-detail/types"
import {
  ANSWER_POPULARITY_TRACK_HEIGHT,
  answerPopularityBarFillHeight,
} from "@/features/student/explanation-detail/answer-popularity-bar-height"
import { cn } from "@/lib/utils"

const BAR_GRAY_GRADIENT =
  "linear-gradient(0deg, rgb(154, 163, 178) 0%, rgb(167, 175, 189) 33.333%, rgb(180, 188, 201) 66.667%, rgb(193, 200, 212) 100%)"

type AnswerPopularityChartProps = {
  rows: ExplanationAnswerPopularityRow[]
  className?: string
  trackHeight?: number
}

function AnswerPopularityBar({
  letter,
  pct,
  highlight,
  trackHeight,
}: {
  letter: string
  pct: number
  highlight?: boolean
  trackHeight: number
}) {
  const barHeight = answerPopularityBarFillHeight(pct, trackHeight)

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      <p
        className={cn(
          "m-0 pb-2 text-base font-bold leading-6 tabular-nums",
          highlight ? "text-[var(--primary)]" : "text-[var(--greyscale-500)]",
        )}
      >
        {pct}%
      </p>
      <div
        className="relative flex w-16 max-w-[64px] items-end justify-center overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[rgba(243,247,255,0.6)]"
        style={{ height: `${trackHeight}px` }}
      >
        {barHeight > 0 ? (
          <div
            className={cn(
              "relative w-[62px] shrink-0 rounded-t-[10px]",
              highlight &&
                "bg-gradient-to-t from-[var(--primary-600)] to-[var(--primary)] shadow-[0px_-6px_18px_0px_rgba(11,188,201,0.6)]",
            )}
            style={
              highlight
                ? { height: `${barHeight}px` }
                : { height: `${barHeight}px`, backgroundImage: BAR_GRAY_GRADIENT }
            }
          />
        ) : null}
        {highlight ? (
          <span className="absolute left-[21px] top-2 flex size-5 items-center justify-center rounded-full bg-[var(--greyscale-0)] shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.1)]">
            <Check className="size-3 text-[var(--primary)]" strokeWidth={3} aria-hidden />
          </span>
        ) : null}
      </div>
      <span
        className={cn(
          "mt-3 flex size-9 items-center justify-center rounded-xl text-sm font-semibold leading-[21px]",
          highlight
            ? "border border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0px_4px_3px_rgba(11,188,201,0.3),0px_2px_2px_rgba(11,188,201,0.3)]"
            : "border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-[var(--greyscale-500)]",
        )}
      >
        {letter}
      </span>
    </div>
  )
}

function AnswerPopularityChart({
  rows,
  className,
  trackHeight = ANSWER_POPULARITY_TRACK_HEIGHT,
}: AnswerPopularityChartProps) {
  return (
    <div className={cn("flex items-end gap-5 pt-6", className)}>
      {rows.map((row) => (
        <AnswerPopularityBar
          key={row.letter}
          letter={row.letter}
          pct={row.pct}
          highlight={row.highlight}
          trackHeight={trackHeight}
        />
      ))}
    </div>
  )
}

export { AnswerPopularityChart }
