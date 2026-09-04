import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ChevronRight } from "lucide-react"

import { StudentPageLoader } from "@/features/student/components/student-page-loader"

import {
  PT_RESULTS_HERO_CARD_CLASS,
  PT_RESULTS_PAGE_BG_CLASS,
  PT_RESULTS_PAGE_GAP_CLASS,
} from "@/features/student/analytics/prep-test-results-section-styles"
import { Button } from "@/components/ui/button"
import { parseFlaggedQuestionIds } from "@/features/student/practice-session/practice-question-flags"
import { buildPracticeResultsSectionGroups } from "@/features/student/practice-session/build-practice-results-section-groups"
import {
  filterPracticeResultPassages,
  filterPracticeResultQuestions,
  practiceResultQuestionBookmarkId,
} from "@/features/student/practice-session/filter-practice-result-questions"
import { PracticeQuestionResultCard } from "@/features/student/practice-session/practice-question-result-card"
import {
  PRACTICE_RESULTS_STACK_CLASS,
  PracticeResultsPassageRow,
  PracticeResultsSectionCard,
  PracticeResultsTotalQuestionsBar,
} from "@/features/student/practice-session/practice-results-list-layout"
import { formatSectionResultsTitle } from "@/features/student/practice-session/lr-drill-results-format"
import { LrDrillResultsView } from "@/features/student/practice-session/lr-drill-results-view"
import { RcDrillResultsView } from "@/features/student/practice-session/rc-drill-results-view"
import {
  buildPracticeSectionSummaries,
  PracticeResultsSummaryPanel,
} from "@/features/student/practice-session/practice-results-summary-panel"
import type { DrillQuestion, DrillSectionType } from "@/features/student/drills/drill-types"
import {
  applyActualFallbackToBlindReview,
  parseDrillBlindReviewFromMetadata,
  resolveSectionBlindReviewForResults,
} from "@/features/student/drills/parse-drill-blind-review"
import type { SectionSessionResponse } from "@/features/student/sections/section-types"
import type { DrillSessionResponse } from "@/features/student/drills/drill-types"
import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import { useExplanationQuestionBookmarks } from "@/features/student/explanation-detail/use-explanation-question-bookmarks"
import { StudentMain } from "@/features/student/components/student-main"
import { createExplanationsApi } from "@/lib/api/explanations"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { formatSupabaseCallError } from "@/lib/supabase/format-call-error"
import { cn } from "@/lib/utils"

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
  blindReviewAnswersByQuestion: Map<string, { selectedAnswer: string; isCorrect: boolean }> | null
  excluded: boolean
  timing: string
  take: number
  prepTestTitle: string | null
}

function parseTakeNumber(metadata: Record<string, unknown>): number {
  const raw = metadata.take ?? metadata.attempt ?? metadata.attemptNumber
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number.parseInt(raw, 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : 1
}

function parseTiming(metadata: Record<string, unknown>, fallback = "unlimited"): string {
  return typeof metadata.timing === "string" && metadata.timing.trim() ? metadata.timing : fallback
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
  const blindReviewWithFallback = applyActualFallbackToBlindReview({
    questionIds: data.questions.map((q) => q.id),
    actualByQuestion: answersByQuestion,
    blindReviewAnswersByQuestion: blindReview?.answersByQuestion ?? null,
  })
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
    blindReviewRawScore: blindReviewWithFallback.rawScore,
    blindReviewAnswersByQuestion: blindReviewWithFallback.answersByQuestion,
    excluded: data.session.excluded,
    timing: parseTiming(data.session.metadata, data.metadata.timing),
    take: parseTakeNumber(data.session.metadata),
    prepTestTitle: null,
  }
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

  const resolvedBlindReview = resolveSectionBlindReviewForResults({
    sessionMetadata: data.session.metadata,
    blindReviewAnswers: data.blindReviewAnswers,
    blindReviewRawScore: data.blindReviewRawScore,
  })
  const blindReviewWithFallback = applyActualFallbackToBlindReview({
    questionIds: data.questions.map((q) => q.id),
    actualByQuestion: answersByQuestion,
    blindReviewAnswersByQuestion: resolvedBlindReview.answersByQuestion,
  })

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
    blindReviewRawScore: blindReviewWithFallback.rawScore,
    blindReviewAnswersByQuestion: blindReviewWithFallback.answersByQuestion,
    excluded: data.session.excluded,
    timing: parseTiming(data.session.metadata, data.metadata.timing ?? "35"),
    take: parseTakeNumber(data.session.metadata),
    prepTestTitle: data.metadata.prepTestTitle ?? data.section.prepTestTitle ?? null,
  }
}

function PracticeSessionResultsPage() {
  const { sessionId = "" } = useParams<{ sessionId: string }>()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get("returnTo")?.trim() ?? ""
  const navigate = useNavigate()
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])
  const explanationsApi = useMemo(() => createExplanationsApi(getSupabaseBrowserClient()), [])
  const { bookmarkedIds, toggleQuestionBookmark } = useExplanationQuestionBookmarks()
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<LoadedResults | null>(null)
  const [detailsByQuestion, setDetailsByQuestion] = useState<Record<string, ExplanationDetailPayload>>({})
  const [startingAnother, setStartingAnother] = useState(false)

  useEffect(() => {
    if (results?.kind !== "SECTION") return
    if (searchParams.get("source") === "section") return
    const next = new URLSearchParams(searchParams)
    next.set("source", "section")
    navigate({ search: `?${next.toString()}` }, { replace: true })
  }, [navigate, results?.kind, searchParams])

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

  const sectionGroups = useMemo(() => {
    if (!results) return []
    return buildPracticeResultsSectionGroups({
      questions: results.questions,
      answersByQuestion: results.answersByQuestion,
      blindReviewAnswersByQuestion: results.blindReviewAnswersByQuestion,
      detailsByQuestion,
      defaultKind: results.defaultSectionKind,
      fallbackSectionNumber: results.fallbackSectionNumber,
      perQuestionSeconds,
    })
  }, [detailsByQuestion, perQuestionSeconds, results])

  const filteredSectionGroups = useMemo(() => {
    const options = {
      incorrectOnly: false,
      bookmarkedOnly,
      bookmarkedIds,
    }
    return sectionGroups
      .map((section) => ({
        ...section,
        passages: filterPracticeResultPassages(section.passages, options),
        questions: filterPracticeResultQuestions(section.questions, options),
      }))
      .filter((section) => section.passages.length > 0 || section.questions.length > 0)
  }, [bookmarkedIds, bookmarkedOnly, sectionGroups])

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
          className="mt-3 text-sm font-semibold text-[var(--primary)] hover:underline"
          onClick={handleBack}
        >
          Go back
        </button>
      </StudentMain>
    )
  }

  const showBlindReview = results.blindReviewAnswersByQuestion != null
  const isLrDrill = results.kind === "DRILL" && results.defaultSectionKind === "LR"
  const isLrSection = results.kind === "SECTION" && results.defaultSectionKind === "LR"
  const isRcDrill = results.kind === "DRILL" && results.defaultSectionKind === "RC"
  const isRcSection = results.kind === "SECTION" && results.defaultSectionKind === "RC"
  const lrDrillQuestions = sectionGroups.flatMap((section) => [
    ...section.passages.flatMap((group) => group.questions),
    ...section.questions,
  ])
  const rcDrillPassages = sectionGroups.flatMap((section) =>
    section.passages.length > 0
      ? section.passages
      : section.questions.length > 0
        ? [
            {
              passage: {
                id: `${section.id}-passage`,
                passageLabel: "P1",
                title: "Passage 1",
                tags: [],
                difficulty: "Medium" as const,
                targetTime: "01:30",
                yourTime: "00:00",
                yourTimeNote: "",
              },
              questions: section.questions,
            },
          ]
        : [],
  )
  const firstQuestionDetail = detailsByQuestion[results.questions[0]?.id ?? ""]
  const sectionResultsTitle = formatSectionResultsTitle({
    prepTestNumber: firstQuestionDetail?.prepTestNumber,
    prepTestTitle: firstQuestionDetail?.prepTestTitle ?? results.prepTestTitle,
    sectionNumber: firstQuestionDetail?.sectionNumber ?? results.fallbackSectionNumber,
  })
  const rcSectionLabel =
    results.fallbackSectionNumber != null || firstQuestionDetail?.sectionNumber != null
      ? `Section ${firstQuestionDetail?.sectionNumber ?? results.fallbackSectionNumber}`
      : "Section 1"
  const reviewInTesterHref = () => {
    const backParams = new URLSearchParams(searchParams)
    if (results.kind === "SECTION") backParams.set("source", "section")
    const backQuery = backParams.toString()
    const back = `/app/practice/results/${encodeURIComponent(sessionId)}${
      backQuery ? `?${backQuery}` : ""
    }`
    if (results.kind === "SECTION") {
      const q = new URLSearchParams({ review: "1", returnTo: back })
      navigate(`/app/practice/sections/session/${encodeURIComponent(sessionId)}?${q.toString()}`)
    } else {
      navigate(`/app/practice/drills/session/${encodeURIComponent(sessionId)}?returnTo=${encodeURIComponent(back)}`)
    }
  }

  function handleExcludedChange(next: boolean) {
    setResults((current) => (current ? { ...current, excluded: next } : current))
    void practiceApi.updateSession({ sessionId, excluded: next }).catch(() => {
      setResults((current) => (current ? { ...current, excluded: !next } : current))
    })
  }

  return (
    <StudentMain
      className={cn("min-h-full", PT_RESULTS_PAGE_BG_CLASS)}
      contentClassName={cn("min-h-full", PT_RESULTS_PAGE_BG_CLASS)}
    >
      {isLrDrill || isLrSection ? (
        <LrDrillResultsView
          variant={isLrSection ? "section" : "drill"}
          heroTitle={isLrSection ? sectionResultsTitle : undefined}
          questionCount={results.questionCount}
          rawScore={results.rawScore}
          scaledScore={results.scaledScore}
          elapsedSeconds={results.elapsedSeconds}
          timing={results.timing}
          take={results.take}
          excluded={results.excluded}
          questions={lrDrillQuestions}
          showBlindReview={showBlindReview}
          bookmarkedIds={bookmarkedIds}
          onToggleBookmark={toggleQuestionBookmark}
          onReviewInTester={reviewInTesterHref}
          onExcludedChange={handleExcludedChange}
        />
      ) : isRcDrill || isRcSection ? (
        <RcDrillResultsView
          variant={isRcSection ? "section" : "drill"}
          heroTitle={isRcSection ? sectionResultsTitle : undefined}
          compactLabel={isRcSection ? rcSectionLabel : "Score"}
          questionCount={results.questionCount}
          rawScore={results.rawScore}
          scaledScore={results.scaledScore}
          elapsedSeconds={results.elapsedSeconds}
          timing={results.timing}
          take={results.take}
          excluded={results.excluded}
          passages={rcDrillPassages}
          questions={lrDrillQuestions}
          showBlindReview={showBlindReview}
          bookmarkedIds={bookmarkedIds}
          onToggleBookmark={toggleQuestionBookmark}
          onReviewInTester={reviewInTesterHref}
          onExcludedChange={handleExcludedChange}
        />
      ) : (
      <div className={PT_RESULTS_PAGE_GAP_CLASS}>
        <section className={PT_RESULTS_HERO_CARD_CLASS}>
          <h1 className="!m-0 !text-[24px] font-bold leading-[1.3] text-[var(--color-student-heading)]">{results.title}</h1>

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
        </section>

        {isPrepCourseDrill ? (
          <div className="flex justify-end">
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

        <div className={PRACTICE_RESULTS_STACK_CLASS}>
          <PracticeResultsTotalQuestionsBar
            total={results.questionCount}
            bookmarkedOnly={bookmarkedOnly}
            onBookmarkedOnlyChange={setBookmarkedOnly}
          />

          {filteredSectionGroups.map((section) => (
            <PracticeResultsSectionCard
              key={section.id}
              sectionTitle={section.sectionTitle}
              badgeKind={section.kind}
              scoreDisplay={section.scoreDisplay}
              blindReviewDisplay={section.blindReviewDisplay}
              showBlindReview={showBlindReview}
            >
              {section.passages.map(({ passage, questions }) => (
                <div key={passage.id}>
                  <PracticeResultsPassageRow passage={passage} />
                  {questions.map((q) => (
                    <PracticeQuestionResultCard
                      key={q.question.id}
                      number={q.number}
                      detail={q.detail}
                      isCorrect={q.isCorrect}
                      isUnanswered={q.isUnanswered}
                      selectedAnswer={q.selectedAnswer}
                      blindReviewCorrect={q.blindReviewCorrect}
                      blindReviewUnanswered={q.blindReviewUnanswered}
                      showBlindReview={showBlindReview}
                      yourTimeSeconds={q.yourTimeSeconds}
                      bookmarked={bookmarkedIds.has(practiceResultQuestionBookmarkId(q))}
                      onToggleBookmark={toggleQuestionBookmark}
                      variant="in-section"
                    />
                  ))}
                </div>
              ))}
              {section.questions.map((q) => (
                <PracticeQuestionResultCard
                  key={q.question.id}
                  number={q.number}
                  detail={q.detail}
                  isCorrect={q.isCorrect}
                  isUnanswered={q.isUnanswered}
                  selectedAnswer={q.selectedAnswer}
                  blindReviewCorrect={q.blindReviewCorrect}
                  blindReviewUnanswered={q.blindReviewUnanswered}
                  showBlindReview={showBlindReview}
                  yourTimeSeconds={q.yourTimeSeconds}
                  bookmarked={bookmarkedIds.has(practiceResultQuestionBookmarkId(q))}
                  onToggleBookmark={toggleQuestionBookmark}
                  variant="in-section"
                />
              ))}
            </PracticeResultsSectionCard>
          ))}
          {bookmarkedOnly && filteredSectionGroups.length === 0 ? (
            <p className="rounded-[16px] border border-dashed border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-6 py-8 text-center text-sm text-[var(--greyscale-500)]">
              {results.kind === "SECTION"
                ? "No bookmarked questions in this section. Bookmark a question to see it here."
                : "No bookmarked questions in this drill. Bookmark a question to see it here."}
            </p>
          ) : null}
        </div>

        {returnTo.startsWith("/app/prep-course/") ? (
          <p className="text-center text-sm text-[var(--greyscale-500)]">
            <Link to={returnTo} className="font-semibold text-[var(--primary)] hover:underline">
              Return to lesson
            </Link>
          </p>
        ) : null}
      </div>
      )}
    </StudentMain>
  )
}

export { PracticeSessionResultsPage }
