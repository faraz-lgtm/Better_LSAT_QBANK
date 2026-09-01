import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"

import {
  PT_RESULTS_HERO_CARD_CLASS,
  PT_RESULTS_PAGE_BG_CLASS,
  PT_RESULTS_PAGE_GAP_CLASS,
  PT_RESULTS_SURFACE_CARD_CLASS,
} from "@/features/student/analytics/prep-test-results-section-styles"
import { useAnalyticsApi } from "@/features/student/analytics/hooks/use-analytics-api"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import { PracticeQuestionResultCard } from "@/features/student/practice-session/practice-question-result-card"
import {
  FIGMA_DROPDOWN_CARD_OPEN_CLASS,
  FIGMA_DROPDOWN_PILL_FILTER_CLASS,
  FigmaDropdown,
} from "@/components/ui/figma-dropdown"
import { createExplanationsApi } from "@/lib/api/explanations"
import type { QuestionTypeReviewPayload } from "@/lib/api/analytics"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatSupabaseCallError } from "@/lib/supabase/format-call-error"
import { cn } from "@/lib/utils"

const FILTER_OPTIONS = ["All", "Incorrect only"] as const
type FilterOption = (typeof FILTER_OPTIONS)[number]

function ReviewTotalBar({
  total,
  filter,
  onFilterChange,
}: {
  total: number
  filter: FilterOption
  onFilterChange: (next: FilterOption) => void
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <section
      className={cn(
        PT_RESULTS_SURFACE_CARD_CLASS,
        "px-[24px] py-4",
        dropdownOpen && FIGMA_DROPDOWN_CARD_OPEN_CLASS,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-2xl font-bold leading-[1.3] text-[#062357]">Total Questions: {total}</p>
        <FigmaDropdown
          variant="pill"
          value={filter}
          onChange={(next) => onFilterChange(next as FilterOption)}
          onOpenChange={setDropdownOpen}
          options={FILTER_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
          className={FIGMA_DROPDOWN_PILL_FILTER_CLASS}
        />
      </div>
    </section>
  )
}

function AnalyticsQuestionTypeReviewPage() {
  const { questionTypeId: questionTypeIdParam } = useParams<{ questionTypeId: string }>()
  const questionTypeId = questionTypeIdParam ? decodeURIComponent(questionTypeIdParam) : ""
  const analyticsApi = useAnalyticsApi()
  const explanationsApi = useMemo(() => {
    try {
      return createExplanationsApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [review, setReview] = useState<QuestionTypeReviewPayload | null>(null)
  const [detailsByQuestion, setDetailsByQuestion] = useState<Record<string, ExplanationDetailPayload>>({})
  const [filter, setFilter] = useState<FilterOption>("All")

  useEffect(() => {
    if (!questionTypeId) {
      setLoading(false)
      setError("Missing question type id")
      return
    }
    if (!analyticsApi) {
      setLoading(false)
      setError("Supabase env is missing.")
      return
    }

    let alive = true
    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const payload = await analyticsApi.getQuestionTypeReview(questionTypeId)
        if (!alive) return
        setReview(payload)

        if (explanationsApi && payload.attempts.length > 0) {
          const detailEntries = await Promise.all(
            payload.attempts.map(async (attempt) => {
              try {
                const detail = await explanationsApi.getExplanationDetail(attempt.questionId)
                return [attempt.questionId, detail] as const
              } catch {
                return [attempt.questionId, null] as const
              }
            }),
          )
          if (!alive) return
          const next: Record<string, ExplanationDetailPayload> = {}
          for (const [id, detail] of detailEntries) {
            if (detail) next[id] = detail
          }
          setDetailsByQuestion(next)
        } else {
          setDetailsByQuestion({})
        }
      } catch (e) {
        if (!alive) return
        setError(e instanceof Error ? formatSupabaseCallError(e) : "Failed to load review")
        setReview(null)
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [analyticsApi, explanationsApi, questionTypeId])

  const visibleAttempts = useMemo(() => {
    if (!review) return []
    if (filter === "Incorrect only") return review.attempts.filter((a) => !a.isCorrect)
    return review.attempts
  }, [filter, review])

  if (loading) {
    return (
      <StudentMain contentClassName="flex min-h-0 flex-1 flex-col">
        <StudentPageLoader centered className="min-h-0 flex-1" label="Loading review…" />
      </StudentMain>
    )
  }

  if (error || !review) {
    return (
      <StudentMain>
        <p className="text-sm text-red-600">{error ?? "Review not found"}</p>
        <Link to="/app/analytics" className="mt-3 inline-block text-sm font-semibold text-[#0d47a1] hover:underline">
          Back to Overview
        </Link>
      </StudentMain>
    )
  }

  const incorrectCount = review.attemptCount - review.correctCount

  return (
    <StudentMain
      className={cn("min-h-full", PT_RESULTS_PAGE_BG_CLASS)}
      contentClassName={cn("min-h-full", PT_RESULTS_PAGE_BG_CLASS)}
    >
      <div className={PT_RESULTS_PAGE_GAP_CLASS}>
        <section className={PT_RESULTS_HERO_CARD_CLASS}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-col gap-2">
              <Link
                to="/app/analytics"
                className="text-sm font-semibold tracking-[0.02em] text-[#0d47a1] hover:underline"
              >
                ← Overview
              </Link>
              <h1 className="!m-0 !text-[24px] font-bold leading-[1.3] text-[#062357]">{review.name}</h1>
              {review.sectionType ? (
                <p className="text-sm font-semibold tracking-[0.02em] text-[#666d80]">
                  {review.sectionType === "LR"
                    ? "Logical Reasoning"
                    : review.sectionType === "RC"
                      ? "Reading Comprehension"
                      : "Logic Games"}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col gap-1 rounded-[16px] bg-[#0d47a1] px-6 py-4 text-white sm:min-w-[200px]">
              <p className="text-xs font-semibold tracking-[0.28px] text-[#edf3ff]">YOUR ACCURACY</p>
              <p className="text-[32px] font-extrabold leading-[1.2]">
                {review.attemptCount > 0
                  ? `${Math.round((100 * review.correctCount) / review.attemptCount)}%`
                  : "—"}
              </p>
              <p className="text-sm font-semibold tracking-[0.02em] text-[#edf3ff]">
                {review.correctCount}/{review.attemptCount} correct
                {incorrectCount > 0 ? ` · ${incorrectCount} missed` : ""}
              </p>
            </div>
          </div>
        </section>

        <div className={PT_RESULTS_PAGE_GAP_CLASS}>
          <ReviewTotalBar total={visibleAttempts.length} filter={filter} onFilterChange={setFilter} />

          {visibleAttempts.length === 0 ? (
            <section className={cn(PT_RESULTS_SURFACE_CARD_CLASS, "p-6")}>
              <p className="text-sm text-[#666d80]">
                {filter === "Incorrect only"
                  ? "No incorrect attempts for this question type."
                  : "No attempts for this question type yet."}
              </p>
            </section>
          ) : (
            visibleAttempts.map((attempt, index) => (
              <PracticeQuestionResultCard
                key={attempt.answerEventId}
                number={attempt.questionNumber ?? index + 1}
                detail={detailsByQuestion[attempt.questionId] ?? null}
                titleOverride={attempt.title}
                isCorrect={attempt.isCorrect}
                isUnanswered={!attempt.selectedAnswer.trim()}
                selectedAnswer={attempt.selectedAnswer}
                variant="default"
              />
            ))
          )}
        </div>
      </div>
    </StudentMain>
  )
}

export { AnalyticsQuestionTypeReviewPage }
