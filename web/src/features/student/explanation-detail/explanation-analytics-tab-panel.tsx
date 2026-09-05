import type { ReactNode } from "react"
import { BookOpen, Check, Clock, FileText, Users } from "lucide-react"

import { useAccommodations } from "@/features/student/accommodations/accommodations-context"
import type { ExplanationQuestionDetailView } from "@/features/student/explanation-detail/types"
import {
  formatMmSs,
  formatPaddedTargetTime,
  formatYourTimeAgainstTarget,
} from "@/features/student/practice-session/practice-results-ui"
import { NOT_ENOUGH_ANSWERS_YET, hasEnoughPlatformAnswerSample } from "@/lib/platform-answer-sample"
import { cn } from "@/lib/utils"

type ExplanationAnalyticsTabPanelProps = {
  analytics: ExplanationQuestionDetailView["analytics"]
  correctChoiceLetter?: string
}

const cardSurface =
  "rounded-[24px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-7 shadow-[0px_1px_1px_rgba(6,35,87,0.04),0px_12px_16px_rgba(6,35,87,0.22)]"

const BAR_TRACK_HEIGHT = 200

function difficultyToneStyles(tone: "green" | "teal" | "red"): {
  pillBg: string
  pillText: string
  bar: string
} {
  if (tone === "red") {
    return { pillBg: "bg-[rgba(239,68,68,0.1)]", pillText: "text-[#ef4444]", bar: "bg-[#ef4444]" }
  }
  if (tone === "teal") {
    return { pillBg: "bg-[rgba(11,188,201,0.1)]", pillText: "text-[#0bbcc9]", bar: "bg-[#0bbcc9]" }
  }
  return { pillBg: "bg-[rgba(64,196,170,0.12)]", pillText: "text-[#0f9d82]", bar: "bg-[#40c4aa]" }
}

function ComplexityStat({
  label,
  filled,
  max,
  difficultyLabel,
  caption,
  tone,
}: {
  label: string
  filled: number
  max: number
  difficultyLabel: string
  caption: string
  tone: "green" | "teal" | "red"
}) {
  const safe = Math.max(0, Math.min(max, Math.round(filled)))
  const colors = difficultyToneStyles(tone)

  return (
    <div className="rounded-2xl border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.03em] text-[var(--greyscale-500)]">{label}</p>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", colors.pillBg, colors.pillText)}>
          {difficultyLabel}
        </span>
      </div>
      <div className="mt-4 flex h-[26px] items-center gap-2 pt-0">
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            className={cn("h-2.5 min-w-0 flex-1 rounded-full", i < safe ? colors.bar : "bg-[var(--greyscale-100)]")}
          />
        ))}
      </div>
      <p className="m-0 pt-1.5 text-[11px] font-medium leading-[16.5px] text-[var(--greyscale-400)]">
        {safe} of {max}
      </p>
      <p className="m-0 pt-3 text-[13px] leading-[21px] text-[var(--greyscale-500)]">{caption}</p>
    </div>
  )
}

function ScoreBandCard({
  headline,
  range,
  caption,
}: {
  headline: string
  range: string
  caption: string
}) {
  const score = Number.parseInt(headline, 10)
  if (!Number.isFinite(score)) {
    return (
      <p className="m-0 rounded-[14px] border border-dashed border-[#dfe1e7] bg-[#f6f8fa] px-4 py-6 text-center text-sm text-[#666d80]">
        {caption}
      </p>
    )
  }
  const sliderPct = Math.max(0, Math.min(100, ((score - 120) / 60) * 100))

  return (
    <div
      className="rounded-2xl border border-[rgba(13,71,161,0.15)] p-5"
      style={{
        backgroundImage:
          "linear-gradient(169.42deg, rgb(13, 71, 161) 0%, rgb(12, 68, 155) 7.14%, rgb(6, 35, 87) 100%)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Users className="size-5 text-white" aria-hidden />
          </div>
          <p className="m-0 max-w-[240px] text-[13px] leading-[17.875px] text-white/75">{caption}</p>
        </div>
        <div className="text-right">
          <p className="m-0 text-[34px] font-bold leading-[34px] text-white">{headline}</p>
          <p className="m-0 pt-1 text-[11px] font-medium leading-[16.5px] text-[var(--primary-900)]">{range}</p>
        </div>
      </div>
      <div className="relative mt-4 h-[43px] pt-4">
        <div className="absolute inset-x-0 top-[19px] h-1.5 rounded-full bg-white/15" />
        <div
          className="absolute top-[19px] h-1.5 rounded-full bg-gradient-to-r from-[var(--primary)] to-[#419df8]"
          style={{ width: `${sliderPct}%` }}
        />
        <span
          className="absolute top-4 size-3 rounded-full bg-[var(--greyscale-0)] shadow-sm"
          style={{ left: `calc(${sliderPct}% - 6px)` }}
          aria-hidden
        />
        <div className="absolute inset-x-0 top-[31px] flex justify-between text-[10px] font-medium leading-[15px] text-white/50">
          <span>120</span>
          <span>150</span>
          <span>180</span>
        </div>
      </div>
    </div>
  )
}

const BAR_GRAY_GRADIENT =
  "linear-gradient(0deg, rgb(154, 163, 178) 0%, rgb(167, 175, 189) 33.333%, rgb(180, 188, 201) 66.667%, rgb(193, 200, 212) 100%)"

function TopAnswerBar({
  letter,
  pct,
  highlight,
}: {
  letter: string
  pct: number
  highlight?: boolean
}) {
  const barHeight = pct > 0 ? Math.max(4, Math.round((pct / 100) * BAR_TRACK_HEIGHT)) : 0

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
      <div className="relative flex h-[200px] w-16 max-w-[64px] items-end justify-center overflow-hidden rounded-2xl border border-[var(--greyscale-100)] bg-[rgba(243,247,255,0.6)]">
        {barHeight > 0 ? (
          <div
            className={cn(
              "relative w-[62px] rounded-t-[10px]",
              highlight && "bg-gradient-to-t from-[var(--primary-600)] to-[var(--primary)] shadow-[0px_-6px_18px_0px_rgba(11,188,201,0.6)]",
            )}
            style={
              highlight
                ? { height: `${barHeight}px` }
                : { height: `${barHeight}px`, backgroundImage: BAR_GRAY_GRADIENT }
            }
          />
        ) : null}
        {highlight ? (
          <span className="absolute left-1/2 top-2 flex size-5 -translate-x-1/2 items-center justify-center rounded-full bg-[var(--greyscale-0)] shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.1)]">
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

function historyStatusPill(status: "in_process" | "answered"): {
  label: string
  className: string
  dotClass: string
} {
  if (status === "answered") {
    return {
      label: "Completed",
      className: "bg-[rgba(64,196,170,0.12)] text-[#0f9d82]",
      dotClass: "bg-[#40c4aa]",
    }
  }
  return {
    label: "In progress",
    className: "bg-[rgba(245,158,11,0.12)] text-[#c07a06]",
    dotClass: "bg-[#f59e0b]",
  }
}

function TagGroup({
  icon,
  iconBg,
  title,
  tags,
  tagClassName,
}: {
  icon: ReactNode
  iconBg: string
  title: string
  tags: string[]
  tagClassName: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--greyscale-100)] bg-[rgba(243,247,255,0.4)] p-4">
      <div className="flex items-center gap-2.5">
        <span className={cn("flex size-7 items-center justify-center rounded-lg", iconBg)}>{icon}</span>
        <p className="m-0 text-[13px] font-semibold leading-[19.5px] text-[var(--color-student-heading)]">{title}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.length > 0 ? (
          tags.map((t) => (
            <span
              key={t}
              className={cn(
                "inline-flex h-[30px] items-center rounded-full px-3.5 text-xs font-medium",
                tagClassName,
              )}
            >
              {t}
            </span>
          ))
        ) : (
          <span className="text-sm text-[var(--greyscale-500)]">—</span>
        )}
      </div>
    </div>
  )
}

function TimingStat({
  targetTime,
  yourTime,
  yourTimeNote,
}: {
  targetTime: string
  yourTime: string
  yourTimeNote: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-5">
      <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.03em] text-[var(--greyscale-500)]">
        Timing
      </p>
      <div className="mt-4 flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-1 text-sm leading-normal tracking-[0.02em]">
          <span className="font-normal text-[var(--greyscale-500)]">Target time:</span>
          <span className="font-semibold text-[var(--greyscale-500)]">{targetTime}</span>
        </div>
        <div className="flex flex-wrap gap-1 text-sm leading-normal tracking-[0.02em]">
          <span className="font-normal text-[var(--greyscale-500)]">Your time:</span>
          <span className="font-semibold text-[var(--primary)]">{yourTime}</span>
          {yourTimeNote ? (
            <span className="font-semibold text-[var(--greyscale-500)]">{yourTimeNote}</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ExplanationAnalyticsTabPanel({ analytics, correctChoiceLetter }: ExplanationAnalyticsTabPanelProps) {
  const { scaleFactor } = useAccommodations()
  const attemptCount = analytics.history.length
  const showPopularity = hasEnoughPlatformAnswerSample(analytics.answerPopularityTotal)
  const popularityRows = showPopularity ? analytics.answerPopularity : []

  const targetSec = Math.round(analytics.targetTimeSeconds * scaleFactor)
  const targetTime = formatPaddedTargetTime(targetSec)
  const { yourTime, yourTimeNote } = formatYourTimeAgainstTarget(targetSec, analytics.yourTimeSeconds)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <section className={cn(cardSurface, "flex flex-col gap-6")}>
          <div>
            <h3 className="m-0 text-lg font-semibold leading-[1.4] tracking-[0.02em] text-[var(--color-student-heading)]">Complexity</h3>
            <p className="m-0 mt-1 text-xs leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">
              How this item performs against the test-taker pool.
            </p>
          </div>
          <div
            className={cn(
              "grid gap-4",
              analytics.passageDifficulty ? "md:grid-cols-2" : "md:grid-cols-1",
            )}
          >
            <ComplexityStat
              label="Question"
              filled={analytics.questionDifficulty.filled}
              max={analytics.questionDifficulty.max}
              difficultyLabel={analytics.questionDifficulty.label}
              caption={analytics.questionDifficulty.caption}
              tone={analytics.questionDifficulty.tone}
            />
            {analytics.passageDifficulty ? (
              <ComplexityStat
                label="Passage"
                filled={analytics.passageDifficulty.filled}
                max={analytics.passageDifficulty.max}
                difficultyLabel={analytics.passageDifficulty.label}
                caption={analytics.passageDifficulty.caption}
                tone={analytics.passageDifficulty.tone}
              />
            ) : null}
          </div>
          <TimingStat targetTime={targetTime} yourTime={yourTime} yourTimeNote={yourTimeNote} />
          <ScoreBandCard
            headline={analytics.scoreBand.headline}
            range={analytics.scoreBand.range}
            caption={analytics.scoreBand.caption}
          />
        </section>

        <section className={cn(cardSurface, "flex flex-col")}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="m-0 text-base font-semibold leading-normal tracking-[0.02em] text-[var(--color-student-heading)]">
              Answer Choice Distribution
              </h3>
              <p className="m-0 mt-1 text-xs leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">
                Distribution of responses across all test takers.
              </p>
            </div>
            {correctChoiceLetter ? (
              <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-[var(--primary-25)] px-3 py-1 text-xs font-semibold leading-[18px] text-[var(--primary)]">
                <Check className="size-3.5" aria-hidden />
                {correctChoiceLetter} is correct
              </span>
            ) : null}
          </div>
          <div className="flex items-start gap-5 pt-6">
            {showPopularity && popularityRows.length > 0 ? (
              popularityRows.map((row) => (
                <TopAnswerBar
                  key={row.letter}
                  letter={row.letter}
                  pct={row.pct}
                  highlight={row.highlight}
                />
              ))
            ) : (
              <p className="m-0 w-full rounded-[14px] border border-dashed border-[#dfe1e7] bg-[#f6f8fa] px-4 py-6 text-center text-sm text-[#666d80]">
                {NOT_ENOUGH_ANSWERS_YET}
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className={cn(cardSurface, "flex flex-col")}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="m-0 text-lg font-semibold leading-[1.4] tracking-[0.02em] text-[var(--color-student-heading)]">
              Question History
            </h3>
            {attemptCount > 0 ? (
              <span className="rounded-full bg-[var(--primary-0)] px-2.5 py-1 text-[11px] font-semibold leading-[16.5px] text-[var(--greyscale-500)]">
                {attemptCount} {attemptCount === 1 ? "attempt" : "attempts"}
              </span>
            ) : null}
          </div>

          <div className="relative mt-6 min-h-[180px]">
            {analytics.history.length === 0 ? (
              <p className="m-0 py-6 text-sm text-[var(--greyscale-500)]">No attempts recorded yet.</p>
            ) : (
              <>
                <span className="absolute bottom-2 left-[7px] top-2 w-px bg-[var(--greyscale-100)]" aria-hidden />
                <div className="flex flex-col gap-6">
                  {analytics.history.map((h, i) => {
                    const pill = historyStatusPill(h.status)
                    return (
                      <div key={i} className="relative pl-8">
                        <span
                          className={cn(
                            "absolute left-0 top-1 flex size-3.5 items-center justify-center rounded-full",
                            pill.dotClass,
                          )}
                          aria-hidden
                        >
                          <span className="size-1.5 rounded-full bg-white/70" />
                        </span>
                        <div className="rounded-2xl border border-[var(--greyscale-100)] bg-[rgba(243,247,255,0.4)] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <p className="m-0 max-w-[185px] text-sm font-semibold leading-[19.25px] text-[var(--color-student-heading)]">
                              {h.source}
                            </p>
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-[16.5px]",
                                pill.className,
                              )}
                            >
                              {pill.label}
                            </span>
                          </div>
                          <div className="mt-2.5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5 text-xs leading-[18px] text-[var(--greyscale-500)]">
                              <Clock className="size-3.5 shrink-0" aria-hidden />
                              <span className="font-mono tabular-nums">
                                Your time {h.timeRange}
                                <span className="text-[var(--greyscale-400)]">
                                  {" "}
                                  · Target {formatMmSs(targetSec)}
                                </span>
                              </span>
                            </div>
                            <p className="m-0 text-xs leading-[18px] text-[var(--greyscale-500)]">{h.dateLabel}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        <section className={cn(cardSurface, "flex flex-col gap-5")}>
          <h3 className="m-0 text-lg font-semibold leading-[1.4] tracking-[0.02em] text-[var(--color-student-heading)]">Insights</h3>
          <TagGroup
            icon={<FileText className="size-4 text-[var(--primary)]" aria-hidden />}
            iconBg="bg-[var(--primary-25)]"
            title="Question Stem Tags"
            tags={analytics.questionStemTags}
            tagClassName="border border-[rgba(13,71,161,0.15)] bg-[var(--primary-25)] text-[var(--primary)]"
          />
          <TagGroup
            icon={<BookOpen className="size-4 text-[#0a8a94]" aria-hidden />}
            iconBg="bg-[rgba(11,188,201,0.1)]"
            title="Passage Tags"
            tags={analytics.passageTags}
            tagClassName="border border-[rgba(11,188,201,0.2)] bg-[rgba(11,188,201,0.1)] text-[#0a8a94]"
          />
        </section>
      </div>
    </div>
  )
}

export { ExplanationAnalyticsTabPanel }
