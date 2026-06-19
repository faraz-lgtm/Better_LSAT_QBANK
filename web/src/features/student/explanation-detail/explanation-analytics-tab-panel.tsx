import { Users } from "lucide-react"

import type { ExplanationQuestionDetailView } from "@/features/student/explanation-detail/types"
import { cn } from "@/lib/utils"

type ExplanationAnalyticsTabPanelProps = {
  analytics: ExplanationQuestionDetailView["analytics"]
}

const cardSurface =
  "flex flex-col gap-6 rounded-[14px] border border-[color:var(--greyscale-100)] bg-white p-6 shadow-[0px_1px_1.5px_0px_rgba(0,0,0,0.1),0px_1px_1px_0px_rgba(0,0,0,0.1)]"

function difficultyBarColors(tone: "orange" | "red" | "teal"): { fill: string; text: string } {
  if (tone === "red") return { fill: "bg-[#ef4444]", text: "text-[#ef4444]" }
  if (tone === "teal") return { fill: "bg-[#0bbcc9]", text: "text-[#0bbcc9]" }
  return { fill: "bg-[#0bbcc9]", text: "text-[#0bbcc9]" }
}

function DifficultyMeterBadge({
  filled,
  max,
  label,
  tone,
}: {
  filled: number
  max: number
  label: string
  tone: "orange" | "red" | "teal"
}) {
  const safe = Math.max(0, Math.min(max, Math.round(filled)))
  const colors = difficultyBarColors(tone)

  return (
    <div className="flex h-10 w-[132px] items-center gap-2.5 rounded-[10px] bg-[var(--primary-0)] px-2.5">
      <div className="flex items-center gap-1.5" role="img" aria-label={`${safe} of ${max} bars`}>
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-4 w-1.5 shrink-0 rounded-full",
              i < safe ? colors.fill : "bg-[#ced0e7]",
            )}
          />
        ))}
      </div>
      <span className={cn("text-xs font-semibold tracking-[0.02em]", colors.text)}>{label}</span>
    </div>
  )
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
  tone: "orange" | "red" | "teal"
}) {
  return (
    <div className="flex max-w-[366px] flex-col gap-3">
      <p className="m-0 text-base font-normal tracking-[0.02em] text-[#666d80]">{label}</p>
      <DifficultyMeterBadge filled={filled} max={max} label={difficultyLabel} tone={tone} />
      <p className="m-0 text-sm leading-5 text-[#4a5565]">{caption}</p>
    </div>
  )
}

function ExplanationAnalyticsTabPanel({ analytics }: ExplanationAnalyticsTabPanelProps) {
  const popularityTotal = analytics.answerPopularityTotal

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
      <div className="flex flex-col gap-6">
        <section className={cardSurface}>
          <h3 className="m-0 text-xl font-bold leading-[1.35] text-[#062357]">Difficulty</h3>
          <div className="flex flex-col justify-between gap-8 md:flex-row md:gap-6">
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
          <div className="border-t border-[#e5e7eb] pt-6">
            <div className="flex items-center gap-3">
              <Users className="size-5 shrink-0 text-[#818898]" strokeWidth={1.75} aria-hidden />
              <div className="min-w-0">
                <p className="m-0 text-sm leading-5 text-[#6a7282]">{analytics.scoreBand.caption}</p>
                <p className="m-0 mt-0.5 text-2xl font-bold leading-[1.3] tabular-nums text-[#062357]">
                  {analytics.scoreBand.headline}
                </p>
                <p className="m-0 text-xs font-bold leading-normal tracking-[0.02em] tabular-nums text-[#666d80]">
                  {analytics.scoreBand.range}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={cardSurface}>
          <h3 className="m-0 text-xl font-bold leading-[1.35] text-[#062357]">Answer Popularity</h3>
          <div className="flex flex-col gap-4">
            {popularityTotal === 0 ? (
              <p className="m-0 rounded-[14px] border border-dashed border-[color:var(--greyscale-100)] bg-[var(--greyscale-25)] px-4 py-6 text-center text-sm text-[#666d80]">
                No one has answered this question on the platform yet.
              </p>
            ) : null}
            {analytics.answerPopularity.map((row) => (
              <div
                key={row.letter}
                className="flex items-start gap-3 rounded-[14px] border border-[color:var(--greyscale-100)] bg-white p-4"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-[10px] border border-[color:var(--greyscale-100)] bg-white text-sm font-medium tracking-[0.02em] text-[#666d80]">
                  {row.letter}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-sm font-normal tracking-[0.02em] tabular-nums text-[#666d80]">
                      {row.pct}%
                    </span>
                    <span className="text-sm font-normal tracking-[0.02em] tabular-nums text-[#666d80]">
                      Avg score: —
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#eceff3]">
                    <div
                      className={cn(
                        "h-full min-w-0 rounded-full transition-[width]",
                        row.highlight ? "bg-[#0bbcc9]" : "bg-[#a4acb9]",
                      )}
                      style={{ width: `${Math.min(100, Math.max(row.pct > 0 ? 3 : 0, row.pct))}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-6">
        <section className={cardSurface}>
          <h3 className="m-0 text-xl font-bold leading-[1.35] text-[#062357]">Analysis</h3>
          <div className="space-y-4">
            <div>
              <p className="m-0 text-base font-normal tracking-[0.02em] text-[#666d80]">Question Stem Tags</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {analytics.questionStemTags.length > 0 ? (
                  analytics.questionStemTags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex h-6 items-center rounded-full bg-[var(--greyscale-25)] px-3 text-xs font-normal tracking-[0.02em] text-[#062357]"
                    >
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[#666d80]">—</span>
                )}
              </div>
            </div>
            <div>
              <p className="m-0 text-base font-normal tracking-[0.02em] text-[#666d80]">Passage Tags</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {analytics.passageTags.length > 0 ? (
                  analytics.passageTags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex h-6 items-center rounded-full bg-[var(--greyscale-25)] px-3 text-xs font-normal tracking-[0.02em] text-[#062357]"
                    >
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[#666d80]">—</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className={cardSurface}>
          <h3 className="m-0 text-xl font-bold leading-[1.35] text-[#062357]">Question History</h3>
          <div className="flex flex-col gap-3">
            {analytics.history.length === 0 ? (
              <p className="m-0 py-2 text-sm text-[#666d80]">No attempts recorded yet.</p>
            ) : (
              analytics.history.map((h, i) => (
                <div
                  key={i}
                  className="flex h-[60px] items-center justify-between rounded-[10px] bg-[#f9fafb] p-3"
                >
                  <div className="min-w-0">
                    <p className="m-0 truncate text-sm font-medium tracking-[0.02em] text-[#062357]">{h.source}</p>
                    <p className="m-0 text-xs leading-4 text-[#6a7282]">{h.dateLabel}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={cn(
                        "size-3 rounded-full",
                        h.status === "answered" ? "bg-[#40c4aa]" : "bg-[#f59e0b]",
                      )}
                      aria-hidden
                    />
                    <span className="font-mono text-xs leading-4 tabular-nums text-[#6a7282]">{h.timeRange}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export { ExplanationAnalyticsTabPanel }
