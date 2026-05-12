import { Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExplanationFiveBarMeter } from "@/features/student/explanation-detail/explanation-five-bar-meter"
import type { ExplanationQuestionDetailView } from "@/features/student/explanation-detail/types"
import { cn } from "@/lib/utils"

type ExplanationAnalyticsTabPanelProps = {
  analytics: ExplanationQuestionDetailView["analytics"]
}

const cardSurface = "rounded-2xl border border-solid border-[color:var(--greyscale-100)] bg-white shadow-[var(--shadow-medium)]"

function difficultyMeterFill(tone: "orange" | "red"): string {
  return tone === "orange" ? "bg-[color:var(--rc-progress)]" : "bg-[#ef4444]"
}

function difficultyPillClass(tone: "orange" | "red"): string {
  return tone === "orange"
    ? "bg-[var(--rc-row)] text-[color:var(--rc-header-text)] ring-1 ring-[color:var(--greyscale-100)]"
    : "bg-red-50 text-red-600 ring-1 ring-red-100"
}

function DifficultyColumn({
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
  tone: "orange" | "red"
}) {
  return (
    <div>
      <p className="text-sm font-medium text-[color:var(--text)]">{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2.5">
        <ExplanationFiveBarMeter filled={filled} max={max} fillClassName={difficultyMeterFill(tone)} />
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", difficultyPillClass(tone))}>{difficultyLabel}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[color:var(--text)]">{caption}</p>
    </div>
  )
}

function ExplanationAnalyticsTabPanel({ analytics }: ExplanationAnalyticsTabPanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card className={cardSurface}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-[color:var(--color-student-heading)]">Difficulty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid gap-8 md:grid-cols-2 md:gap-10">
              <DifficultyColumn
                label="Question"
                filled={analytics.questionDifficulty.filled}
                max={analytics.questionDifficulty.max}
                difficultyLabel={analytics.questionDifficulty.label}
                caption={analytics.questionDifficulty.caption}
                tone={analytics.questionDifficulty.tone}
              />
              <DifficultyColumn
                label="Passage"
                filled={analytics.passageDifficulty.filled}
                max={analytics.passageDifficulty.max}
                difficultyLabel={analytics.passageDifficulty.label}
                caption={analytics.passageDifficulty.caption}
                tone={analytics.passageDifficulty.tone}
              />
            </div>

            <div className="border-t border-[#eef1f6] pt-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <Users className="size-8 shrink-0 text-[#94a3b8] sm:size-9" strokeWidth={1.75} aria-hidden />
                <div className="min-w-0 flex flex-col gap-1">
                  <p className="text-xs font-normal leading-snug text-[#94a3b8] sm:text-[13px]">{analytics.scoreBand.caption}</p>
                  <p className="text-3xl font-bold tabular-nums leading-none text-[color:var(--color-student-heading)] sm:text-[2.25rem]">
                    {analytics.scoreBand.headline}
                  </p>
                  <p className="text-[11px] font-bold leading-tight tabular-nums text-[#94a3b8] sm:text-xs">{analytics.scoreBand.range}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cardSurface}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-[color:var(--color-student-heading)]">Answer Popularity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {analytics.answerPopularity.map((row) => (
              <div
                key={row.letter}
                className="rounded-xl border border-solid border-[color:var(--greyscale-100)] bg-[color:var(--background)] px-4 py-3.5"
              >
                <div className="flex gap-3">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500"
                    aria-hidden
                  >
                    {row.letter}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-xs font-medium tabular-nums text-[color:var(--text)]">{row.pct}%</span>
                      <span className="text-xs text-[color:var(--text)]">
                        Avg score:{" "}
                        <span className="font-semibold tabular-nums text-[color:var(--color-student-heading)]">{row.avgScore}</span>
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef1f6]">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width]",
                          row.highlight ? "bg-[color:var(--rc-progress)]" : "bg-[#94a3b8]",
                        )}
                        style={{ width: `${Math.min(100, row.pct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className={cardSurface}>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[color:var(--color-student-heading)]">Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text)]">Question stem tags</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {analytics.questionStemTags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-[color:var(--greyscale-100)] bg-[var(--greyscale-25)] px-3 py-1 text-xs font-medium text-[color:var(--text)]"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[color:var(--text)]">Passage tags</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {analytics.passageTags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-[color:var(--color-student-accent)] bg-[var(--greyscale-25)] px-3 py-1 text-xs font-medium text-[color:var(--color-student-heading)]"
                >
                  {t}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={cardSurface}>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[color:var(--color-student-heading)]">Question History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.history.map((h, i) => (
              <div key={i} className="rounded-xl border border-[#eef1f6] bg-[#fafbfd] px-3 py-3">
                <p className="text-sm font-semibold text-[color:var(--color-student-heading)]">{h.source}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[color:var(--text)]">
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        h.status === "answered" ? "bg-emerald-500" : "bg-[color:var(--drill-medium)]",
                      )}
                      aria-hidden
                    />
                    {h.dateLabel}
                  </span>
                  <span className="font-mono tabular-nums">{h.timeRange}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { ExplanationAnalyticsTabPanel }
