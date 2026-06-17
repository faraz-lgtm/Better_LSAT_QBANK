import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ChevronRight } from "lucide-react"

import { StudentPageLoader } from "@/features/student/components/student-page-loader"

import { Button } from "@/components/ui/button"
import { parseFlaggedQuestionIds } from "@/features/student/practice-session/practice-question-flags"
import { PracticeQuestionResultCard } from "@/features/student/practice-session/practice-question-result-card"
import {
  buildPracticeSectionSummaries,
  PracticeResultsSummaryPanel,
} from "@/features/student/practice-session/practice-results-summary-panel"
import type { DrillQuestion, DrillSectionType } from "@/features/student/drills/drill-types"
import { parseDrillBlindReviewFromMetadata, parseSectionBlindReviewFromMetadata } from "@/features/student/drills/parse-drill-blind-review"
import type { SectionSessionResponse } from "@/features/student/sections/section-types"
import type { DrillSessionResponse } from "@/features/student/drills/drill-types"
import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import { StudentMain } from "@/features/student/components/student-main"
import { createExplanationsApi } from "@/lib/api/explanations"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatSupabaseCallError } from "@/lib/supabase/format-call-error"

type LoadedResults = {
  kind: "DRILL" | "SECTION"
  title: string
  rawScore: number
  questionCount: number
  elapsedSeconds: number
  questions: DrillQuestion[]
  answersByQuestion: Map<string, { selectedAnswer: string; isCorrect: boolean }>
  flaggedIds: Set<string>
  sessionMetadata: Record<string, unknown>
  returnTo: string
  defaultSectionKind: DrillSectionType
  fallbackSectionNumber: number | null
  scaledScore: number | null
  percentile: number | null
  blindReviewRawScore: number | null
  blindReviewAnswersByQuestion: Map<string, { isCorrect: boolean }> | null
}

function sessionElapsedSeconds(startedAt: string, completedAt: string): number {
  const started = new Date(startedAt).getTime()
  const completed = new Date(completedAt).getTime()
  if (!Number.isFinite(started) || !Number.isFinite(completed)) return 0
  return Math.max(0, Math.round((completed - started) / 1000))
}

function mapDrillResponse(data: DrillSessionResponse, returnTo: string): LoadedResults {
  const answersByQuestion = new Map<string, { selectedAnswer: string; isCorrect: boolean }>()
  for (const a of data.answers) {
    answersByQuestion.set(a.questionId, {
      selectedAnswer: a.selectedAnswer,
      isCorrect: a.isCorrect,
    })
  }
  const completedAt = data.session.completed_at ?? new Date().toISOString()
  const blindReview = parseDrillBlindReviewFromMetadata(data.session.metadata)
  return {
    kind: "DRILL",
    title: data.drillLabel ?? data.metadata.title ?? "Drill results",
    rawScore: data.session.raw_score ?? 0,
    questionCount: data.questions.length > 0 ? data.questions.length : 1,
    elapsedSeconds: sessionElapsedSeconds(data.session.started_at, completedAt),
    questions: data.questions,
    answersByQuestion,
    flaggedIds: new Set(data.metadata.flaggedQuestionIds ?? parseFlaggedQuestionIds(data.session.metadata)),
    sessionMetadata: data.session.metadata,
    returnTo,
    defaultSectionKind: data.metadata.sectionType,
    fallbackSectionNumber: null,
    scaledScore: data.session.scaled_score,
    percentile: data.session.percentile,
    blindReviewRawScore: blindReview?.rawScore ?? null,
    blindReviewAnswersByQuestion: blindReview?.answersByQuestion ?? null,
  }
}

function mapBlindReviewFromAnswers(
  answers: Array<{ questionId: string; isCorrect: boolean }> | undefined,
  rawScore: number | null | undefined,
): {
  blindReviewRawScore: number | null
  blindReviewAnswersByQuestion: Map<string, { isCorrect: boolean }> | null
} {
  if (!answers || answers.length === 0) {
    return { blindReviewRawScore: null, blindReviewAnswersByQuestion: null }
  }
  const answersByQuestion = new Map<string, { isCorrect: boolean }>()
  for (const answer of answers) {
    answersByQuestion.set(answer.questionId, { isCorrect: answer.isCorrect })
  }
  const computedRawScore =
    rawScore != null
      ? rawScore
      : answers.filter((answer) => answer.isCorrect).length
  return { blindReviewRawScore: computedRawScore, blindReviewAnswersByQuestion: answersByQuestion }
}

function mapSectionResponse(data: SectionSessionResponse, returnTo: string): LoadedResults {
  const answersByQuestion = new Map<string, { selectedAnswer: string; isCorrect: boolean }>()
  for (const a of data.answers) {
    answersByQuestion.set(a.questionId, {
      selectedAnswer: a.selectedAnswer,
      isCorrect: a.isCorrect,
    })
  }
  const completedAt = data.session.completed_at ?? new Date().toISOString()
  const label =
    data.sessionLabel ??
    [data.metadata.prepTestTitle, data.metadata.sectionTitle].filter(Boolean).join(" — ") ??
    "Section results"

  const blindReviewFromApi = mapBlindReviewFromAnswers(data.blindReviewAnswers, data.blindReviewRawScore)
  const blindReviewFromMeta = parseSectionBlindReviewFromMetadata(data.session.metadata)
  const blindReviewRawScore =
    blindReviewFromApi.blindReviewRawScore ?? blindReviewFromMeta?.rawScore ?? null
  const blindReviewAnswersByQuestion =
    blindReviewFromApi.blindReviewAnswersByQuestion ?? blindReviewFromMeta?.answersByQuestion ?? null

  return {
    kind: "SECTION",
    title: label,
    rawScore: data.session.raw_score ?? 0,
    questionCount: data.questions.length > 0 ? data.questions.length : 1,
    elapsedSeconds: sessionElapsedSeconds(data.session.started_at, completedAt),
    questions: data.questions,
    answersByQuestion,
    flaggedIds: new Set(
      data.metadata.flaggedQuestionIds ?? parseFlaggedQuestionIds(data.session.metadata),
    ),
    sessionMetadata: data.session.metadata,
    returnTo,
    defaultSectionKind: data.metadata.sectionType,
    fallbackSectionNumber: data.section.sectionNumber,
    scaledScore: data.session.scaled_score,
    percentile: data.session.percentile,
    blindReviewRawScore,
    blindReviewAnswersByQuestion,
  }
}

function PracticeSessionResultsPage() {
  const { sessionId = "" } = useParams<{ sessionId: string }>()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get("returnTo")?.trim() ?? ""
  const navigate = useNavigate()
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])
  const explanationsApi = useMemo(() => createExplanationsApi(getSupabaseBrowserClient()), [])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<LoadedResults | null>(null)
  const [detailsByQuestion, setDetailsByQuestion] = useState<Record<string, ExplanationDetailPayload>>({})
  const [startingAnother, setStartingAnother] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      setError("Missing session.")
      return
    }
    let alive = true
    setLoading(true)
    setError(null)

    async function load() {
      try {
        let loaded: LoadedResults | null = null

        const loadSection = async () => {
          const section = await practiceApi.getSectionSession(sessionId)
          if (!section.session.completed_at) {
            throw new Error("This section is not finished yet.")
          }
          return mapSectionResponse(section, returnTo)
        }

        const loadDrill = async () => {
          const drill = await practiceApi.getDrillSession(sessionId)
          if (!drill.session.completed_at) {
            throw new Error("This drill is not finished yet.")
          }
          return mapDrillResponse(drill, returnTo)
        }

        try {
          loaded = await loadSection()
        } catch (sectionErr) {
          const sectionMsg =
            sectionErr instanceof Error ? sectionErr.message.toLowerCase() : ""
          if (!sectionMsg.includes("not a section")) {
            throw sectionErr
          }
          loaded = await loadDrill()
        }

        if (!alive || !loaded) return
        setResults(loaded)

        const detailEntries = await Promise.all(
          loaded.questions.map(async (q) => {
            try {
              const detail = await explanationsApi.getExplanationDetail(q.id)
              return [q.id, detail] as const
            } catch {
              return [q.id, null] as const
            }
          }),
        )
        if (!alive) return
        const next: Record<string, ExplanationDetailPayload> = {}
        for (const [id, detail] of detailEntries) {
          if (detail) next[id] = detail
        }
        setDetailsByQuestion(next)
      } catch (e) {
        if (!alive) return
        setError(e instanceof Error ? formatSupabaseCallError(e) : "Failed to load results")
        setResults(null)
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [explanationsApi, practiceApi, returnTo, sessionId])

  const perQuestionSeconds = useMemo(() => {
    if (!results || results.questions.length === 0) return 0
    return Math.max(1, Math.round(results.elapsedSeconds / results.questions.length))
  }, [results])

  const sectionSummaries = useMemo(() => {
    if (!results) return []
    return buildPracticeSectionSummaries({
      questionIds: results.questions.map((q) => q.id),
      answersByQuestion: results.answersByQuestion,
      detailsByQuestion,
      defaultKind: results.defaultSectionKind,
      fallbackSectionNumber: results.fallbackSectionNumber,
    })
  }, [detailsByQuestion, results])

  const isPrepCourseDrill =
    results?.kind === "DRILL" &&
    (results.sessionMetadata.source === "prep_course_active_drill" ||
      results.sessionMetadata.source === "prep_course_adaptive_drill")

  function handleBack() {
    if (returnTo.startsWith("/app/")) {
      navigate(returnTo, { replace: true })
      return
    }
    if (results?.kind === "SECTION") {
      navigate("/app/practice/sections", { replace: true })
      return
    }
    navigate("/app/practice/drills", { replace: true })
  }

  async function handleStartAnotherDrill() {
    if (!results || !isPrepCourseDrill) return
    const lessonId = typeof results.sessionMetadata.lessonId === "string" ? results.sessionMetadata.lessonId : ""
    if (!lessonId) {
      handleBack()
      return
    }
    const firstQuestionId = results.questions[0]?.id ?? null
    setStartingAnother(true)
    try {
      const { session } = await practiceApi.startLessonDrill({
        lessonId,
        questionId: firstQuestionId,
      })
      const back = returnTo || "/app/prep-course"
      navigate(
        `/app/practice/drills/session/${encodeURIComponent(session.id)}?returnTo=${encodeURIComponent(back)}`,
        { replace: true },
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start another drill")
    } finally {
      setStartingAnother(false)
    }
  }

  if (loading) {
    return (
      <StudentMain>
        <StudentPageLoader centered label="Loading results…" />
      </StudentMain>
    )
  }

  if (error || !results) {
    return (
      <StudentMain>
        <p className="text-sm text-red-600">{error ?? "Results not found."}</p>
        <button
          type="button"
          className="mt-3 text-sm font-semibold text-[#0d47a1] hover:underline"
          onClick={handleBack}
        >
          Go back
        </button>
      </StudentMain>
    )
  }

  return (
    <StudentMain className="w-full max-w-none" contentClassName="max-w-none">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-[32px] font-bold leading-[1.25] text-[#062357] md:text-[40px]">
          {results.title}
        </h1>
        <button
          type="button"
          className="text-sm font-semibold text-[#0d47a1] hover:underline"
          onClick={handleBack}
        >
          Back
        </button>
      </div>

      <PracticeResultsSummaryPanel
        rawScore={results.rawScore}
        questionCount={results.questionCount}
        elapsedSeconds={results.elapsedSeconds}
        sections={sectionSummaries}
        scaledScore={results.scaledScore}
        percentile={results.percentile}
        prediction={results.blindReviewRawScore != null ? results.rawScore : null}
        blindReviewScore={results.blindReviewRawScore}
      />

      {isPrepCourseDrill ? (
        <div className="mb-6 flex justify-end">
          <Button
            type="button"
            variant="default"
            className="gap-1"
            disabled={startingAnother}
            onClick={() => void handleStartAnotherDrill()}
          >
            {startingAnother ? "Starting…" : "Start another Drill"}
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
      ) : null}

      <section className="mb-6 flex flex-col rounded-2xl border border-[#dfe1e7] bg-white px-6 py-4">
        <p className="text-2xl font-bold leading-[1.3] text-[#062357]">
          Total Questions: {results.questionCount}
        </p>
      </section>

      <ul className="flex flex-col gap-4">
        {results.questions.map((q, i) => {
          const ans = results.answersByQuestion.get(q.id)
          const blindReviewAns = results.blindReviewAnswersByQuestion?.get(q.id)
          return (
            <li key={q.id}>
              <PracticeQuestionResultCard
                number={i + 1}
                detail={detailsByQuestion[q.id] ?? null}
                isCorrect={ans?.isCorrect ?? false}
                blindReviewCorrect={
                  results.blindReviewAnswersByQuestion != null
                    ? (blindReviewAns?.isCorrect ?? false)
                    : undefined
                }
                yourTimeSeconds={perQuestionSeconds}
                flagged={results.flaggedIds.has(q.id)}
              />
            </li>
          )
        })}
      </ul>

      {returnTo.startsWith("/app/prep-course/") ? (
        <p className="mt-6 text-center text-sm text-[#666d80]">
          <Link to={returnTo} className="font-semibold text-[#0d47a1] hover:underline">
            Return to lesson
          </Link>
        </p>
      ) : null}
    </StudentMain>
  )
}

export { PracticeSessionResultsPage }
