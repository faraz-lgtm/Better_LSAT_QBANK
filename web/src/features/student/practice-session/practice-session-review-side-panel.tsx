import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Check, ChevronUp, Clock3, Tags, Target } from "lucide-react"

import { resolveAnswerPopularityRows } from "@/features/student/explanation-detail/answer-popularity-rows"
import { ExplanationExplainTabPanel } from "@/features/student/explanation-detail/explanation-explain-tab-panel"
import type { ExplanationAnswerPopularityRow, ExplanationQuestionDetailView } from "@/features/student/explanation-detail/types"
import type { PracticeReviewSidePanel } from "@/features/student/practice-session/practice-blind-review-session-header"
import {
  BLIND_REVIEW_NOTES_SIDEBAR_CLASS,
  REVIEW_SIDEBAR_CLASS,
} from "@/features/student/practice-session/practice-session-blind-review-styles"
import { difficultyLabelFromLevel, tagsFromTopicName } from "@/features/student/practice-session/practice-results-ui"
import { createExplanationsApi, type ExplanationDetailPayload } from "@/lib/api/explanations"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type PracticeSessionReviewSidePanelProps = {
  mode: Exclude<PracticeReviewSidePanel, "notes" | null>
  questionId: string | null
  onClose: () => void
  /** Local analytics (diagnostic) — skips explanations API when mode is insights. */
  analyticsSeed?: ExplanationQuestionDetailView["analytics"] | null
}

function difficultyTone(level: number): "orange" | "red" | "teal" {
  if (level >= 4) return "red"
  if (level >= 3) return "orange"
  return "teal"
}

function viewFromDetail(detail: ExplanationDetailPayload): ExplanationQuestionDetailView {
  const diffLevel = detail.difficulty ?? 3
  const label = difficultyLabelFromLevel(diffLevel)
  const answerPopularity = resolveAnswerPopularityRows(
    detail.answerPopularity,
    detail.choices,
    detail.correctChoiceId ?? "",
  )
  const totalResponses = answerPopularity.reduce((sum, row) => sum + row.count, 0)
  const letter = detail.userSelectedLetter?.trim().toUpperCase().slice(0, 1) ?? ""

  return {
    routeKey: detail.questionId,
    headingCode: `Q${detail.questionNumber ?? ""}`,
    subtitleTrail: detail.prepTestTitle,
    questionNumber: detail.questionNumber ?? 1,
    passage: {
      displayNumber: detail.passage.displayNumber,
      title: detail.passage.title,
      body: detail.passage.body,
    },
    questionStem: detail.stemText ?? "",
    choices: detail.choices.map((c) => ({
      id: c.id,
      index: c.index,
      text: c.text,
      explanationHtml: c.explanationHtml,
    })),
    correctChoiceId: detail.correctChoiceId ?? "",
    videos: [
      {
        id: "v-passage",
        headerVariant: "yellow",
        authorTitle: "J.Y.'s explanation",
        dropdownLabel: "Passage explanation",
        dropdownOptions: [{ value: "passage", label: "Passage explanation" }],
        postedLine: "",
        videoUrl: null,
        // Video Explanation panel is video-only — never fall back to passage HTML.
        explanationHtml: null,
      },
      {
        id: "v-question",
        headerVariant: "muted",
        authorTitle: "J.Y.'s explanation",
        dropdownLabel: "Question explanation",
        dropdownOptions: [{ value: "question", label: "Question explanation" }],
        postedLine: detail.prepTestTitle ? `Taken on ${detail.prepTestTitle}` : "",
        videoUrl: detail.videoUrl,
        explanationHtml: null,
      },
    ],
    analytics: {
      questionDifficulty: {
        filled: diffLevel,
        max: 5,
        label: label === "Hardest" ? "Hard" : label,
        caption: "Question difficulty based on student performance.",
        tone: difficultyTone(diffLevel),
      },
      passageDifficulty: {
        filled: Math.max(1, diffLevel - 1),
        max: 5,
        label: diffLevel >= 4 ? "Hard" : diffLevel >= 3 ? "Medium" : "Easy",
        caption: "Passage difficulty relative to other passages.",
        tone: difficultyTone(Math.max(1, diffLevel - 1)),
      },
      scoreBand: {
        headline: totalResponses > 0 ? "150" : "—",
        range: totalResponses > 0 ? "75% - 160" : "—",
        caption: "Score of students with a 50% chance of getting this right",
      },
      answerPopularity,
      answerPopularityTotal: totalResponses,
      userSelectedLetter: /^[A-E]$/.test(letter) ? letter : null,
      questionStemTags: detail.tags?.length ? detail.tags : tagsFromTopicName(detail.topicName),
      passageTags: tagsFromTopicName(detail.passage.title),
      history: [],
    },
    neighbors: { prevRouteKey: null, nextRouteKey: null },
    hasExplanationTab: Boolean(detail.videoUrl?.trim()),
  }
}

type AnalyticsView = ExplanationQuestionDetailView["analytics"]

function InsightsSectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="w-full overflow-hidden rounded-[14px] border border-[#dfe1e7] bg-white px-px pb-4 pt-px">
      <div className="flex h-[53px] items-start justify-between bg-[#edf3ff] px-4 pt-4">
        <h3 className="m-0 text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#1a1b25]">
          {title}
        </h3>
        <ChevronUp className="size-5 shrink-0 text-[#666d80]" strokeWidth={2} aria-hidden />
      </div>
      <div className="flex flex-col items-center gap-4 px-3 pt-4">{children}</div>
    </section>
  )
}

function difficultyToneClasses(tone: "orange" | "red" | "teal") {
  if (tone === "red") return { fill: "bg-[#ef4444]", text: "text-[#ef4444]", badge: "bg-[#ef4444]/10" }
  return { fill: "bg-[#0bbcc9]", text: "text-[#0bbcc9]", badge: "bg-[#0bbcc9]/10" }
}

function DifficultyStatCard({
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
  const safe = Math.max(0, Math.min(max, Math.round(filled)))
  const colors = difficultyToneClasses(tone)
  return (
    <div className="w-full rounded-[16px] border border-[#dfe1e7] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-[13px] font-semibold uppercase leading-[19.5px] tracking-[0.325px] text-[#666d80]">
          {label}
        </p>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold leading-[18px]", colors.badge, colors.text)}>
          {difficultyLabel}
        </span>
      </div>
      <div className="flex h-[26px] items-center gap-2 pt-4" role="img" aria-label={`${safe} of ${max}`}>
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            className={cn("h-2.5 min-w-0 flex-1 rounded-full", i < safe ? colors.fill : "bg-[#e8ebf2]")}
          />
        ))}
      </div>
      <p className="m-0 pt-1.5 text-[11px] font-medium leading-[16.5px] text-[#99a1af]">
        {safe} of {max}
      </p>
      <p className="m-0 pt-3 text-[13px] font-normal leading-[21px] text-[#666d80]">{caption}</p>
    </div>
  )
}

function ScoreBandCard({ scoreBand }: { scoreBand: AnalyticsView["scoreBand"] }) {
  return (
    <div className="w-full overflow-hidden rounded-[16px] border border-[#0d47a1]/15 bg-[linear-gradient(158deg,#0d47a1_0%,#062357_100%)] p-5 text-white">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-white/10">
            <Target className="size-3.5 text-white/80" strokeWidth={1.8} aria-hidden />
          </span>
          <p className="m-0 max-w-[175px] text-xs font-normal leading-[1.5] tracking-[0.24px] text-white/75">
            {scoreBand.caption}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="m-0 text-2xl font-bold leading-[1.3]">{scoreBand.headline}</p>
          <p className="m-0 pt-1 text-[8px] leading-[1.5] tracking-[0.16px] text-[#f3f7ff]">{scoreBand.range}</p>
        </div>
      </div>
      <div className="pt-4">
        <div className="h-1.5 rounded-full bg-white/15">
          <div className="h-1.5 w-1/2 rounded-full bg-gradient-to-r from-[#0d47a1] to-[#419df8]" />
        </div>
        <div className="flex justify-between pt-1.5 text-[10px] font-medium leading-[15px] text-white/50">
          <span>120</span>
          <span>150</span>
          <span>180</span>
        </div>
      </div>
    </div>
  )
}

function TopAnswerBars({
  rows,
  selectedLetter,
}: {
  rows: ExplanationAnswerPopularityRow[]
  selectedLetter: string | null
}) {
  const highlighted =
    rows.find((row) => row.highlight)?.letter ??
    rows.reduce<ExplanationAnswerPopularityRow | null>(
      (best, row) => (!best || row.pct > best.pct ? row : best),
      null,
    )?.letter
  if (rows.length === 0) {
    return (
      <p className="m-0 w-full rounded-[14px] border border-dashed border-[#dfe1e7] bg-[#f6f8fa] px-4 py-6 text-center text-sm text-[#666d80]">
        No answer popularity yet.
      </p>
    )
  }

  return (
    <div className="flex w-full items-end justify-between gap-2">
      {rows.map((row) => {
        const active = row.letter === highlighted || row.letter === selectedLetter
        const fillHeight = `${Math.min(100, Math.max(row.pct > 0 ? 6 : 0, row.pct))}%`
        return (
          <div key={row.letter} className="flex min-w-0 flex-1 flex-col items-center">
            <p className={cn("m-0 pb-2 text-base font-bold leading-6", active ? "text-[#0d47a1]" : "text-[#666d80]")}>
              {row.pct}%
            </p>
            <div className="relative flex h-[100px] w-10 items-end justify-center overflow-hidden rounded-[10px] border border-[#dfe1e7] bg-[#f3f7ff]/60">
              <div
                className={cn(
                  "w-full rounded-t-[10px]",
                  active
                    ? "bg-gradient-to-t from-[#093377] to-[#0d47a1] shadow-[0px_-6px_18px_rgba(11,188,201,0.45)]"
                    : "bg-gradient-to-t from-[#9aa3b2] via-[#adb5c3] to-[#c1c8d4]",
                )}
                style={{ height: fillHeight }}
              />
              {active ? (
                <span className="absolute top-2 flex size-5 items-center justify-center rounded-full bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.14)]">
                  <Check className="size-3 text-[#0d47a1]" strokeWidth={3} aria-hidden />
                </span>
              ) : null}
            </div>
            <span
              className={cn(
                "mt-3 flex size-9 items-center justify-center rounded-[12px] border text-sm font-semibold leading-[21px]",
                active
                  ? "border-[#0d47a1] bg-[#0d47a1] text-white shadow-[0px_4px_3px_rgba(11,188,201,0.3)]"
                  : "border-[#dfe1e7] bg-white text-[#666d80]",
              )}
            >
              {row.letter}
            </span>
            <p className="m-0 pt-2 text-[11px] font-normal leading-[16.5px] text-[#666d80]">
              Avg {row.count || "—"}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function TagGroup({
  title,
  tags,
  tone,
}: {
  title: string
  tags: string[]
  tone: "blue" | "teal"
}) {
  const iconClasses = tone === "blue" ? "bg-[#edf3ff] text-[#0d47a1]" : "bg-[#0bbcc9]/10 text-[#0a8a94]"
  const chipClasses =
    tone === "blue"
      ? "border-[#0d47a1]/15 bg-[#edf3ff] text-[#0d47a1]"
      : "border-[#0bbcc9]/20 bg-[#0bbcc9]/10 text-[#0a8a94]"
  return (
    <div className="w-full rounded-[16px] border border-[#dfe1e7] bg-[#f3f7ff]/40 p-4">
      <div className="flex items-center gap-2.5">
        <span className={cn("flex size-7 items-center justify-center rounded-lg", iconClasses)}>
          <Tags className="size-4" strokeWidth={1.8} aria-hidden />
        </span>
        <p className="m-0 text-[13px] font-semibold leading-[19.5px] text-[#062357]">{title}</p>
      </div>
      <div className="flex flex-wrap gap-2 pt-3">
        {(tags.length > 0 ? tags : ["—"]).map((tag) => (
          <span
            key={tag}
            className={cn("inline-flex h-8 items-center rounded-full border px-3.5 py-1.5 text-xs font-medium leading-[18px]", chipClasses)}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

function QuestionHistory({ history }: { history: AnalyticsView["history"] }) {
  return (
    <div className="relative w-full">
      <div className="absolute left-[7px] top-2 h-[calc(100%-16px)] w-px bg-[#dfe1e7]" aria-hidden />
      <div className="flex flex-col gap-4">
        {history.length === 0 ? (
          <div className="relative pl-8">
            <span className="absolute left-0 top-1 flex size-3.5 rounded-full bg-[#40c4aa]" aria-hidden />
            <div className="rounded-[16px] border border-[#dfe1e7] bg-[#f3f7ff]/40 p-4">
              <p className="m-0 text-sm font-semibold leading-[19.25px] text-[#062357]">No attempts recorded yet.</p>
            </div>
          </div>
        ) : (
          history.map((row, index) => {
            const done = row.status === "answered"
            return (
              <div key={`${row.source}-${index}`} className="relative pl-8">
                <span className={cn("absolute left-0 top-1 flex size-3.5 rounded-full", done ? "bg-[#40c4aa]" : "bg-[#f59e0b]")} aria-hidden />
                <div className="rounded-[16px] border border-[#dfe1e7] bg-[#f3f7ff]/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="m-0 text-sm font-semibold leading-[19.25px] text-[#062357]">{row.source}</p>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-[16.5px]", done ? "bg-[#40c4aa]/12 text-[#0f9d82]" : "bg-[#f59e0b]/12 text-[#c07a06]")}>
                      {done ? "Completed" : "In progress"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-2.5 text-xs leading-[18px] text-[#666d80]">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="size-3.5" strokeWidth={1.7} aria-hidden />
                      {row.timeRange}
                    </span>
                    <span>{row.dateLabel}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function ReviewInsightsPanel({ analytics }: { analytics: AnalyticsView }) {
  return (
    <div className="flex w-full flex-col gap-6">
      <InsightsSectionCard title="Complexity">
        <DifficultyStatCard
          label="Question"
          filled={analytics.questionDifficulty.filled}
          max={analytics.questionDifficulty.max}
          difficultyLabel={analytics.questionDifficulty.label}
          caption={analytics.questionDifficulty.caption}
          tone={analytics.questionDifficulty.tone}
        />
        <DifficultyStatCard
          label="Passage"
          filled={analytics.passageDifficulty.filled}
          max={analytics.passageDifficulty.max}
          difficultyLabel={analytics.passageDifficulty.label}
          caption={analytics.passageDifficulty.caption}
          tone={analytics.passageDifficulty.tone}
        />
        <ScoreBandCard scoreBand={analytics.scoreBand} />
      </InsightsSectionCard>

      <InsightsSectionCard title="Top Answer">
        <TopAnswerBars rows={analytics.answerPopularity} selectedLetter={analytics.userSelectedLetter} />
      </InsightsSectionCard>

      <InsightsSectionCard title="Insights">
        <TagGroup title="Question Stem Tags" tags={analytics.questionStemTags} tone="blue" />
        <TagGroup title="Passage Tags" tags={analytics.passageTags} tone="teal" />
      </InsightsSectionCard>

      <InsightsSectionCard title="Question History">
        <QuestionHistory history={analytics.history} />
      </InsightsSectionCard>
    </div>
  )
}

function PracticeSessionReviewSidePanel({
  mode,
  questionId,
  onClose,
  analyticsSeed = null,
}: PracticeSessionReviewSidePanelProps) {
  const [detail, setDetail] = useState<ExplanationDetailPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const useSeedAnalytics = mode === "insights" && analyticsSeed != null

  const explanationsApi = useMemo(() => {
    if (useSeedAnalytics) return null
    try {
      return createExplanationsApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [useSeedAnalytics])

  useEffect(() => {
    if (useSeedAnalytics) return
    let alive = true
    queueMicrotask(() => {
      if (!alive) return
      if (!questionId || !explanationsApi) {
        setDetail(null)
        setLoading(false)
        setError(null)
        return
      }
      setLoading(true)
      setError(null)
      void explanationsApi
        .getExplanationDetail(questionId)
        .then((d) => {
          if (!alive) return
          setDetail(d)
        })
        .catch((e) => {
          if (!alive) return
          setError(e instanceof Error ? e.message : "Failed to load")
          setDetail(null)
        })
        .finally(() => {
          if (alive) setLoading(false)
        })
    })
    return () => {
      alive = false
    }
  }, [questionId, explanationsApi, useSeedAnalytics])

  const view = useMemo(() => (detail ? viewFromDetail(detail) : null), [detail])
  const insightsAnalytics = useSeedAnalytics ? analyticsSeed : view?.analytics

  return (
    <aside className={cn(BLIND_REVIEW_NOTES_SIDEBAR_CLASS, REVIEW_SIDEBAR_CLASS)}>
      <div className="flex h-[70px] shrink-0 items-center justify-between px-6 pb-3 pt-9">
        <p className="m-0 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#062357]">
          {mode === "explanation" ? "Explanation" : "Insights"}
        </p>
        <button
          type="button"
          className="sr-only"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <div className="practice-session-scroll-hidden min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        {useSeedAnalytics ? (
          insightsAnalytics ? <ReviewInsightsPanel analytics={insightsAnalytics} /> : null
        ) : loading ? (
          <p className="m-0 text-sm text-[#666d80]">Loading…</p>
        ) : error ? (
          <p className="m-0 text-sm text-red-600">{error}</p>
        ) : !view ? (
          <p className="m-0 text-sm text-[#666d80]">No content available for this question yet.</p>
        ) : mode === "explanation" ? (
          <ExplanationExplainTabPanel videos={view.videos} videoOnly />
        ) : (
          <ReviewInsightsPanel analytics={view.analytics} />
        )}
      </div>
    </aside>
  )
}

export { PracticeSessionReviewSidePanel }
