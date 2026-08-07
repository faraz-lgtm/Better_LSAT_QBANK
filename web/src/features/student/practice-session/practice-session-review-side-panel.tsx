import { useEffect, useMemo, useState } from "react"

import { resolveAnswerPopularityRows } from "@/features/student/explanation-detail/answer-popularity-rows"
import { ExplanationAnalyticsTabPanel } from "@/features/student/explanation-detail/explanation-analytics-tab-panel"
import { ExplanationExplainTabPanel } from "@/features/student/explanation-detail/explanation-explain-tab-panel"
import type { ExplanationQuestionDetailView } from "@/features/student/explanation-detail/types"
import type { PracticeReviewSidePanel } from "@/features/student/practice-session/practice-blind-review-session-header"
import {
  BLIND_REVIEW_NOTES_SIDEBAR_CLASS,
} from "@/features/student/practice-session/practice-session-blind-review-styles"
import { difficultyLabelFromLevel, tagsFromTopicName } from "@/features/student/practice-session/practice-results-ui"
import { createExplanationsApi, type ExplanationDetailPayload } from "@/lib/api/explanations"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type PracticeSessionReviewSidePanelProps = {
  mode: Exclude<PracticeReviewSidePanel, "notes" | null>
  questionId: string | null
  onClose: () => void
}

function difficultyTone(level: number): "orange" | "red" | "teal" {
  if (level >= 4) return "red"
  if (level >= 3) return "orange"
  return "teal"
}

function viewFromDetail(detail: ExplanationDetailPayload): ExplanationQuestionDetailView {
  const diffLevel = 3
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
        authorTitle: "Passage Explanation",
        dropdownLabel: "Passage explanation",
        dropdownOptions: [{ value: "passage", label: "Passage explanation" }],
        postedLine: "",
        videoUrl: null,
        explanationHtml: null,
      },
      {
        id: "v-question",
        headerVariant: "muted",
        authorTitle: "Video Explanation",
        dropdownLabel: "Question explanation",
        dropdownOptions: [{ value: "question", label: "Question explanation" }],
        postedLine: detail.prepTestTitle ? `Taken on ${detail.prepTestTitle}` : "",
        videoUrl: detail.videoUrl,
        explanationHtml: detail.explanationHtml,
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
      passageTags: [],
      history: [],
    },
    neighbors: { prevRouteKey: null, nextRouteKey: null },
    hasExplanationTab: false,
  }
}

function PracticeSessionReviewSidePanel({
  mode,
  questionId,
  onClose,
}: PracticeSessionReviewSidePanelProps) {
  const [detail, setDetail] = useState<ExplanationDetailPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const explanationsApi = useMemo(() => {
    try {
      return createExplanationsApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (!questionId || !explanationsApi) {
      setDetail(null)
      return
    }
    let alive = true
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
    return () => {
      alive = false
    }
  }, [questionId, explanationsApi])

  const view = useMemo(() => (detail ? viewFromDetail(detail) : null), [detail])

  return (
    <aside className={cn(BLIND_REVIEW_NOTES_SIDEBAR_CLASS, "w-[451px]")}>
      <div className="flex shrink-0 items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
        <p className="m-0 text-base font-semibold tracking-[0.02em] text-[#062357]">
          {mode === "explanation" ? "Explanation" : "Insights"}
        </p>
        <button
          type="button"
          className="rounded-[10px] px-2 py-1 text-sm font-medium text-[#666d80] transition-colors hover:bg-[#f6f8fa] hover:text-[#062357]"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <div className="practice-session-scroll-hidden min-h-0 flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="m-0 text-sm text-[#666d80]">Loading…</p>
        ) : error ? (
          <p className="m-0 text-sm text-red-600">{error}</p>
        ) : !view ? (
          <p className="m-0 text-sm text-[#666d80]">No content available for this question yet.</p>
        ) : mode === "explanation" ? (
          <ExplanationExplainTabPanel videos={view.videos} />
        ) : (
          <div className="[&>div]:grid-cols-1">
            <ExplanationAnalyticsTabPanel analytics={view.analytics} />
          </div>
        )}
      </div>
    </aside>
  )
}

export { PracticeSessionReviewSidePanel }
