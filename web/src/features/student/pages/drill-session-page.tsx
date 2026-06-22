import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { LrDrillOptionRow } from "@/features/student/drills/lr-drill-option-row"
import type { DrillQuestion, DrillSessionResponse } from "@/features/student/drills/drill-types"
import { PracticeAnnotatedContent } from "@/features/student/practice-session/practice-annotated-content"
import {
  PracticeBlindReviewAnswerToggle,
  type BlindReviewAnswerView,
} from "@/features/student/practice-session/practice-blind-review-answer-toggle"
import { PracticeBlindReviewSessionHeader } from "@/features/student/practice-session/practice-blind-review-session-header"
import type { BlindReviewSectionOption } from "@/features/student/practice-session/practice-blind-review-section-select"
import { PracticeQuestionStem } from "@/features/student/practice-session/practice-question-stem"
import { PracticeSessionHeader } from "@/features/student/practice-session/practice-session-header"
import { PracticeSessionNotesPanel } from "@/features/student/practice-session/practice-session-notes-panel"
import {
  canChangePracticeAnswer,
  type PracticeSessionVariant,
  type PracticeToolMode,
} from "@/features/student/practice-session/practice-session-types"
import { usePracticeHighlights } from "@/features/student/practice-session/use-practice-highlights"
import { PracticeCompleteModal } from "@/features/student/practice-session/practice-complete-modal"
import { PracticeSessionFinishMenu } from "@/features/student/practice-session/practice-session-finish-menu"
import { PracticeSubmitSectionModal } from "@/features/student/practice-session/practice-submit-section-modal"
import { PracticeSessionImmersiveFrame } from "@/features/student/practice-session/practice-session-immersive-frame"
import { PracticeSessionQuestionNavButton } from "@/features/student/practice-session/practice-session-question-nav-button"
import { parseFlaggedQuestionIds } from "@/features/student/practice-session/practice-question-flags"
import { usePracticeQuestionFlags } from "@/features/student/practice-session/use-practice-question-flags"
import {
  computeElapsedTimerProgress,
  resolveTimerBudgetSeconds,
  usePracticeSessionTimer,
} from "@/features/student/practice-session/use-practice-session-timer"
import { stashDrillBlindReviewResult } from "@/features/prep-course/lib/merge-drill-blind-review-attempt"
import {
  DASHBOARD_ADAPTIVE_DRILL_QUERY,
  drillSessionSupportsBlindReview,
  isDashboardAdaptiveDrill,
} from "@/features/student/drills/drill-blind-review-policy"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { createPracticeApi } from "@/lib/api/practice"
import { formatSupabaseCallError } from "@/lib/supabase/format-call-error"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

function choiceIndexFromAnswer(choices: DrillQuestion["choices"], selectedAnswer: string): number | null {
  const letter = selectedAnswer.trim().toUpperCase()
  const byId = choices.findIndex((c) => c.id.toUpperCase() === letter)
  if (byId >= 0) return byId
  const idx = letter.charCodeAt(0) - 65
  if (idx >= 0 && idx < choices.length) return idx
  return null
}

function regionKey(questionId: string, part: string) {
  return `${questionId}:${part}`
}

type QuestionAnswerState = { selectedAnswer: string; isCorrect: boolean }

type QuestionPanelProps = {
  question: DrillQuestion
  questionNumber: number
  findQuery: string
  selectedIndex: number | null
  revealed: boolean
  isCorrect: boolean | null
  submitting: boolean
  allowReselect: boolean
  getRegionHtml: (key: string, base: string) => string
  toolMode: PracticeToolMode
  onContentMouseUp: ReturnType<typeof usePracticeHighlights>["handleContentMouseUp"]
  onContentClick: ReturnType<typeof usePracticeHighlights>["handleContentClick"]
  onSelect: (index: number) => void
  flagged: boolean
  onToggleFlag: () => void
  flagsDisabled?: boolean
  variant?: PracticeSessionVariant
  blindReviewChrome?: boolean
  answerView?: BlindReviewAnswerView
  onAnswerViewChange?: (view: BlindReviewAnswerView) => void
  recommendedForBr?: boolean
  choicesDisabled?: boolean
}

function DrillQuestionPanel({
  question,
  questionNumber,
  findQuery,
  selectedIndex,
  revealed,
  isCorrect,
  submitting,
  allowReselect,
  getRegionHtml,
  toolMode,
  onContentMouseUp,
  onContentClick,
  onSelect,
  flagged,
  onToggleFlag,
  flagsDisabled,
  variant,
  blindReviewChrome = false,
  answerView = "blind_review",
  onAnswerViewChange,
  recommendedForBr = false,
  choicesDisabled = false,
}: QuestionPanelProps) {
  const [hiddenChoices, setHiddenChoices] = useState<Record<number, boolean>>({})
  const stemKey = regionKey(question.id, "stem")
  const stemHtml = getRegionHtml(stemKey, question.stemText ?? "")
  const isBlindReviewLayout = blindReviewChrome && variant === "blind-review"

  if (isBlindReviewLayout) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-[#e5e7eb] bg-[#f6f8fa] p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[14px] border-2 border-[#ff6f00] bg-white text-lg font-bold text-[#ff6f00] shadow-[0px_0px_5px_#fc7753]">
                {questionNumber}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {recommendedForBr ? (
                    <span className="inline-flex h-8 items-center rounded-2xl px-4 text-xs font-medium tracking-[0.02em] text-[#ff6f00]">
                      Recommended for BR
                    </span>
                  ) : (
                    <span />
                  )}
                  {onAnswerViewChange ? (
                    <PracticeBlindReviewAnswerToggle value={answerView} onChange={onAnswerViewChange} />
                  ) : null}
                </div>
                <PracticeAnnotatedContent
                  regionKey={stemKey}
                  html={stemHtml}
                  findQuery={findQuery}
                  toolMode={toolMode}
                  onMouseUp={onContentMouseUp}
                  onClickCapture={onContentClick}
                  className="text-lg font-medium leading-[1.4] tracking-[0.02em] text-[#0d0d12]"
                />
              </div>
            </div>
          </div>
        </div>
        {revealed && isCorrect != null ? (
          <p className="shrink-0 px-6 pt-4 text-xs font-semibold text-[#df1c41]">{isCorrect ? "Correct" : "Incorrect"}</p>
        ) : null}
        <div className="practice-session-scroll-hidden min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3 p-6">
            {question.choices.map((choice, index) => (
              <LrDrillOptionRow
                key={choice.id}
                index={index}
                html={getRegionHtml(regionKey(question.id, `choice-${choice.id}`), choice.text)}
                findQuery={findQuery}
                regionKey={regionKey(question.id, `choice-${choice.id}`)}
                selected={selectedIndex === index}
                hidden={Boolean(hiddenChoices[index])}
                disabled={submitting || choicesDisabled}
                selectedIndex={selectedIndex}
                allowReselect={allowReselect}
                onSelect={() => onSelect(index)}
                onToggleHidden={() =>
                  setHiddenChoices((prev) => ({
                    ...prev,
                    [index]: !prev[index],
                  }))
                }
                toolMode={toolMode}
                onContentMouseUp={onContentMouseUp}
                onContentClick={onContentClick}
                variant="blind-review"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {blindReviewChrome ? (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3",
            variant === "active-drill" ? "px-4 pt-4" : "",
          )}
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-full border-2 border-[#ff9d51] bg-white text-sm font-bold text-[#ff9d51]">
              {questionNumber}
            </span>
            {recommendedForBr ? (
              <span className="inline-flex rounded-full border border-[#ff9d51] bg-[#fff3ea] px-3 py-1 text-xs font-semibold text-[#c45a00]">
                Recommended for BR
              </span>
            ) : null}
          </div>
          {onAnswerViewChange ? (
            <PracticeBlindReviewAnswerToggle value={answerView} onChange={onAnswerViewChange} />
          ) : null}
        </div>
      ) : null}
      <PracticeQuestionStem
        questionNumber={questionNumber}
        regionKey={stemKey}
        html={stemHtml}
        findQuery={findQuery}
        toolMode={toolMode}
        onContentMouseUp={onContentMouseUp}
        onContentClick={onContentClick}
        flagged={flagged}
        onToggleFlag={onToggleFlag}
        flagsDisabled={flagsDisabled}
        variant={variant}
        hideQuestionNumber={blindReviewChrome || variant === "active-drill"}
      />
      {revealed && isCorrect != null ? (
        <p
          className="text-xs font-semibold"
          style={{ color: isCorrect ? "var(--color-student-accent)" : "#df1c41" }}
        >
          {isCorrect ? "Correct" : "Incorrect"}
        </p>
      ) : null}
      <div className={variant === "active-drill" ? "flex flex-col gap-4 px-4 pb-4 pt-4" : "flex flex-col gap-2"}>
        {question.choices.map((choice, index) => (
          <LrDrillOptionRow
            key={choice.id}
            index={index}
            html={getRegionHtml(regionKey(question.id, `choice-${choice.id}`), choice.text)}
            findQuery={findQuery}
            regionKey={regionKey(question.id, `choice-${choice.id}`)}
            selected={selectedIndex === index}
            hidden={Boolean(hiddenChoices[index])}
            disabled={submitting || choicesDisabled}
            selectedIndex={selectedIndex}
            allowReselect={allowReselect}
            onSelect={() => onSelect(index)}
            onToggleHidden={() =>
              setHiddenChoices((prev) => ({
                ...prev,
                [index]: !prev[index],
              }))
            }
            toolMode={toolMode}
            onContentMouseUp={onContentMouseUp}
            onContentClick={onContentClick}
            variant={variant}
          />
        ))}
      </div>
    </>
  )
}

function DrillSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])
  const returnTo = searchParams.get("returnTo")?.trim() ?? ""
  const dashboardAdaptiveEntry = searchParams.get(DASHBOARD_ADAPTIVE_DRILL_QUERY) === "1"
  const sessionBodyRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drill, setDrill] = useState<DrillSessionResponse | null>(null)
  const [qIndex, setQIndex] = useState(1)
  const [findQuery, setFindQuery] = useState("")
  const [answersByQuestion, setAnswersByQuestion] = useState<
    Record<string, { selectedAnswer: string; isCorrect: boolean }>
  >({})
  const [submitting, setSubmitting] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [completeModal, setCompleteModal] = useState<{
    rawScore: number
    questionCount: number
  } | null>(null)
  const [scoreHidden, setScoreHidden] = useState(true)
  const [reviewAfterComplete, setReviewAfterComplete] = useState(false)
  const [answerViewTab, setAnswerViewTab] = useState<BlindReviewAnswerView>("blind_review")
  const [notesOpen, setNotesOpen] = useState(false)
  const [actualAnswersByQuestion, setActualAnswersByQuestion] = useState<Record<string, QuestionAnswerState>>({})

  const drillBlindReviewActiveKey = sessionId ? `drill-br-active-${sessionId}` : null
  const drillActualAnswersKey = sessionId ? `drill-actual-answers-${sessionId}` : null
  const drillBlindReviewAnswersKey = sessionId ? `drill-br-answers-${sessionId}` : null

  function clearDrillBlindReviewStorage() {
    if (drillBlindReviewActiveKey) sessionStorage.removeItem(drillBlindReviewActiveKey)
    if (drillActualAnswersKey) sessionStorage.removeItem(drillActualAnswersKey)
    if (drillBlindReviewAnswersKey) sessionStorage.removeItem(drillBlindReviewAnswersKey)
  }

  function persistBlindReviewAnswers(next: Record<string, { selectedAnswer: string; isCorrect: boolean }>) {
    if (drillBlindReviewAnswersKey) {
      sessionStorage.setItem(drillBlindReviewAnswersKey, JSON.stringify(next))
    }
  }

  function collectBlindReviewAnswersForSubmit(): Array<{ questionId: string; selectedAnswer: string }> {
    let map = { ...answersByQuestion }
    if (drillBlindReviewAnswersKey) {
      const raw = sessionStorage.getItem(drillBlindReviewAnswersKey)
      if (raw) {
        try {
          map = { ...JSON.parse(raw), ...map }
        } catch {
          /* ignore malformed storage */
        }
      }
    }
    return Object.entries(map)
      .filter(([, answer]) => Boolean(answer?.selectedAnswer?.trim()))
      .map(([questionId, answer]) => ({
        questionId,
        selectedAnswer: answer.selectedAnswer,
      }))
  }

  function startDrillBlindReview() {
    if (!sessionId) return
    const actual = { ...answersByQuestion }
    setActualAnswersByQuestion(actual)
    if (drillActualAnswersKey) {
      sessionStorage.setItem(drillActualAnswersKey, JSON.stringify(actual))
    }
    if (drillBlindReviewActiveKey) {
      sessionStorage.setItem(drillBlindReviewActiveKey, "1")
    }
    if (drillBlindReviewAnswersKey) {
      sessionStorage.removeItem(drillBlindReviewAnswersKey)
    }
    setAnswersByQuestion({})
    setAnswerViewTab("blind_review")
    setNotesOpen(false)
    setCompleteModal(null)
    setReviewAfterComplete(true)
    setScoreHidden(true)
    setQIndex(1)
    setError(null)
  }

  const { elapsed, paused, togglePause, resetElapsed } = usePracticeSessionTimer()
  const highlights = usePracticeHighlights()

  const load = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    try {
      const data = await practiceApi.getDrillSession(sessionId)
      setDrill(data)
      const map: Record<string, { selectedAnswer: string; isCorrect: boolean }> = {}
      for (const a of data.answers) {
        map[a.questionId] = { selectedAnswer: a.selectedAnswer, isCorrect: a.isCorrect }
      }

      const blindReviewActive =
        Boolean(data.session.completed_at) &&
        drillBlindReviewActiveKey != null &&
        sessionStorage.getItem(drillBlindReviewActiveKey) === "1"

      if (blindReviewActive) {
        const actualRaw = drillActualAnswersKey ? sessionStorage.getItem(drillActualAnswersKey) : null
        const actualAnswers = actualRaw ? (JSON.parse(actualRaw) as typeof map) : map
        setActualAnswersByQuestion(actualAnswers)
        const brRaw = drillBlindReviewAnswersKey ? sessionStorage.getItem(drillBlindReviewAnswersKey) : null
        const blindReviewAnswers = brRaw ? (JSON.parse(brRaw) as typeof map) : {}
        setAnswersByQuestion(blindReviewAnswers)
        setReviewAfterComplete(true)
        setAnswerViewTab("blind_review")
        const firstBlindUnanswered = data.questions.findIndex((q) => !blindReviewAnswers[q.id])
        setQIndex(firstBlindUnanswered >= 0 ? firstBlindUnanswered + 1 : 1)
      } else {
        setAnswersByQuestion(map)
        setActualAnswersByQuestion(map)
        setReviewAfterComplete(false)
        setAnswerViewTab("blind_review")
        const firstUnanswered = data.questions.findIndex((q) => !map[q.id])
        setQIndex(firstUnanswered >= 0 ? firstUnanswered + 1 : 1)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load drill")
    } finally {
      setLoading(false)
    }
  }, [practiceApi, sessionId, drillBlindReviewActiveKey, drillActualAnswersKey, drillBlindReviewAnswersKey])

  useEffect(() => {
    void load()
  }, [load])

  const questions = drill?.questions ?? []
  const metadata = drill?.metadata
  const showAnswersMode = metadata?.showAnswers ?? "end"
  const sectionType = metadata?.sectionType ?? "LR"
  const questionIds = useMemo(() => questions.map((q) => q.id), [questions])
  const initialFlaggedIds = useMemo(
    () =>
      drill?.metadata?.flaggedQuestionIds ??
      parseFlaggedQuestionIds(drill?.session.metadata),
    [drill?.metadata?.flaggedQuestionIds, drill?.session.metadata],
  )
  const sessionCompleted = Boolean(drill?.session.completed_at)
  const questionFlags = usePracticeQuestionFlags({
    sessionId: sessionId ?? "",
    questionIds,
    initialFlaggedIds,
    practiceApi,
    enabled: Boolean(sessionId) && !sessionCompleted,
  })

  const safeIndex = Math.min(Math.max(qIndex, 1), Math.max(questions.length, 1))
  const current = questions[safeIndex - 1]
  const editingBlindReviewAnswers = !reviewAfterComplete || answerViewTab === "blind_review"
  const displayAnswer = current
    ? reviewAfterComplete && answerViewTab === "actual"
      ? actualAnswersByQuestion[current.id]
      : answersByQuestion[current.id]
    : undefined
  const currentAnswer = displayAnswer
  const selectedIndex =
    current && currentAnswer
      ? choiceIndexFromAnswer(current.choices, currentAnswer.selectedAnswer)
      : null
  const recommendedForBr = Boolean(
    current &&
      reviewAfterComplete &&
      (!actualAnswersByQuestion[current.id] || actualAnswersByQuestion[current.id]?.isCorrect === false),
  )
  const revealed = reviewAfterComplete
    ? false
    : showAnswersMode === "each"
      ? Boolean(currentAnswer)
      : false

  const passageBody =
    sectionType === "RC" && current?.passage
      ? current.passage.body
      : current?.stimulusText ?? ""

  const passageKey = current ? regionKey(current.id, "passage") : ""
  const passageHtml = current ? highlights.getRegionHtml(passageKey, passageBody) : ""

  useEffect(() => {
    if (!findQuery.trim()) return
    const root = sessionBodyRef.current
    if (!root) return
    const mark = root.querySelector("mark.practice-find-mark")
    mark?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, [findQuery, safeIndex, current?.id])

  async function handleSelectChoice(index: number) {
    if (!sessionId || !current || submitting) return
    if (reviewAfterComplete && !editingBlindReviewAnswers) return
    if (reviewAfterComplete) {
      const choice = current.choices[index]
      if (!choice || selectedIndex === index) return
      const optimistic = { selectedAnswer: choice.id, isCorrect: false }
      setAnswersByQuestion((prev) => {
        const next = { ...prev, [current.id]: optimistic }
        persistBlindReviewAnswers(next)
        return next
      })
      return
    }
    if (!canChangePracticeAnswer(showAnswersMode, Boolean(currentAnswer), { blindReview: reviewAfterComplete })) {
      return
    }
    if (selectedIndex === index) return
    const choice = current.choices[index]
    if (!choice) return

    const optimistic = { selectedAnswer: choice.id, isCorrect: false }
    setAnswersByQuestion((prev) => ({ ...prev, [current.id]: optimistic }))
    setSubmitting(true)

    try {
      const event = await practiceApi.submitAnswer({
        sessionId,
        questionId: current.id,
        selectedAnswer: choice.id,
      })
      setAnswersByQuestion((prev) => ({
        ...prev,
        [current.id]: {
          selectedAnswer: event.selected_answer,
          isCorrect: event.is_correct,
        },
      }))
      if (showAnswersMode === "each") {
        window.setTimeout(() => {
          setQIndex((i) => Math.min(questions.length, i + 1))
        }, 600)
      }
    } catch (e) {
      setAnswersByQuestion((prev) => {
        const next = { ...prev }
        delete next[current.id]
        return next
      })
      setError(e instanceof Error ? e.message : "Failed to submit answer")
    } finally {
      setSubmitting(false)
    }
  }

  function resolveReturnPath(): string {
    if (returnTo.startsWith("/app/")) return returnTo
    const meta = drill?.session.metadata
    if (
      meta &&
      typeof meta === "object" &&
      (meta.source === "prep_course_active_drill" || meta.source === "prep_course_adaptive_drill")
    ) {
      const lessonId = typeof meta.lessonId === "string" ? meta.lessonId : ""
      if (lessonId) {
        return returnTo || "/app/prep-course"
      }
    }
    return ""
  }

  function leaveDrillSession() {
    clearDrillBlindReviewStorage()
    const path = resolveReturnPath()
    if (path) {
      navigate(path, { replace: true })
      return
    }
    const meta =
      drill?.session.metadata != null && typeof drill.session.metadata === "object"
        ? (drill.session.metadata as Record<string, unknown>)
        : null
    if (
      isDashboardAdaptiveDrill({
        metadata: meta,
        dashboardAdaptiveEntry,
      })
    ) {
      navigate("/app", { replace: true })
      return
    }
    navigate("/app/practice/drills", { replace: true })
  }

  async function viewDrillResults() {
    if (!sessionId) return

    if (reviewAfterComplete) {
      const answers = collectBlindReviewAnswersForSubmit()
      setFinishing(true)
      setError(null)
      try {
        if (answers.length > 0) {
          const session = await practiceApi.completeDrillBlindReview({ sessionId, answers })
          const lessonId =
            drill?.session.metadata != null &&
            typeof drill.session.metadata === "object" &&
            typeof drill.session.metadata.lessonId === "string"
              ? drill.session.metadata.lessonId
              : null
          stashDrillBlindReviewResult(session, lessonId)
        }
      } catch (e) {
        setError(e instanceof Error ? formatSupabaseCallError(e) : "Failed to save blind review")
        setFinishing(false)
        return
      } finally {
        setFinishing(false)
      }
    }

    clearDrillBlindReviewStorage()
    setReviewAfterComplete(false)
    const path = resolveReturnPath()
    if (path.startsWith("/app/prep-course/")) {
      navigate(path, { replace: true })
      return
    }
    const params = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""
    navigate(`/app/practice/results/${encodeURIComponent(sessionId)}${params}`, { replace: true })
  }

  const unansweredCount = useMemo(
    () => questions.filter((q) => !answersByQuestion[q.id]).length,
    [questions, answersByQuestion],
  )

  const submitDrillMessage = useMemo(() => {
    if (reviewAfterComplete) {
      if (unansweredCount > 0) {
        const noun = unansweredCount === 1 ? "question" : "questions"
        return `Finish blind review and view your results? You have ${unansweredCount} unanswered ${noun} in blind review.`
      }
      return "Finish blind review and view your results?"
    }
    if (unansweredCount > 0) {
      const noun = unansweredCount === 1 ? "question" : "questions"
      return `Are you sure you want to submit this drill? You have ${unansweredCount} unanswered ${noun}.`
    }
    return "Are you sure you want to submit this drill?"
  }, [reviewAfterComplete, unansweredCount])

  function requestSubmitDrill() {
    if (!sessionId || finishing) return

    if (sessionCompleted && !reviewAfterComplete) {
      setCompleteModal({
        rawScore: drill?.session.raw_score ?? 0,
        questionCount: questions.length > 0 ? questions.length : 1,
      })
      setScoreHidden(true)
      return
    }

    setSubmitModalOpen(true)
  }

  async function handleConfirmSubmitDrill() {
    if (!sessionId || finishing) return

    if (reviewAfterComplete) {
      setSubmitModalOpen(false)
      await viewDrillResults()
      return
    }

    setFinishing(true)
    setError(null)
    try {
      const completed = await practiceApi.completeSession(sessionId)
      setDrill((prev) => (prev ? { ...prev, session: completed } : prev))
      const questionCount = questions.length > 0 ? questions.length : 1
      const rawScore = completed.raw_score ?? 0
      setSubmitModalOpen(false)
      setCompleteModal({ rawScore, questionCount })
      setScoreHidden(true)
    } catch (e) {
      setError(e instanceof Error ? formatSupabaseCallError(e) : "Failed to complete drill")
    } finally {
      setFinishing(false)
    }
  }

  if (!sessionId) {
    return (
      <StudentMain layout="immersive">
        <p className="text-sm text-red-600">Missing drill session.</p>
        <Link to="/app/practice/drills" className="mt-2 text-sm font-semibold text-[#0d47a1] hover:underline">
          Back to drills
        </Link>
      </StudentMain>
    )
  }

  if (loading) {
    return (
      <StudentMain layout="immersive" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <PracticeSessionImmersiveFrame>
          <StudentPageLoader centered label="Loading drill…" />
        </PracticeSessionImmersiveFrame>
      </StudentMain>
    )
  }

  if (error && !drill) {
    return (
      <StudentMain layout="immersive">
        <p className="text-sm text-red-600">{error}</p>
        <Link to="/app/practice/drills" className="mt-2 text-sm font-semibold text-[#0d47a1] hover:underline">
          Back to drills
        </Link>
      </StudentMain>
    )
  }

  if (!current || questions.length === 0) {
    return (
      <StudentMain layout="immersive">
        <p className="text-sm text-muted-foreground">This drill has no questions.</p>
        <Link to="/app/practice/drills" className="mt-2 text-sm font-semibold text-[#0d47a1] hover:underline">
          Back to drills
        </Link>
      </StudentMain>
    )
  }

  const headerLabel = drill?.drillLabel ?? metadata?.title ?? (sectionType === "LR" ? "LR Drill" : "RC Drill")
  const isPrepCourseDrill = Boolean(resolveReturnPath())
  const sessionMetadata =
    drill?.session.metadata != null && typeof drill.session.metadata === "object"
      ? (drill.session.metadata as Record<string, unknown>)
      : null
  const showBlindReviewOnComplete = drillSessionSupportsBlindReview({
    metadata: sessionMetadata,
    dashboardAdaptiveEntry,
  })
  const isDashboardAdaptiveDrillFlow = isDashboardAdaptiveDrill({
    metadata: sessionMetadata,
    dashboardAdaptiveEntry,
  })
  const isPrepCourseAdaptiveDrill = sessionMetadata?.source === "prep_course_adaptive_drill"
  const blindReviewMode = reviewAfterComplete
  const useBlindReviewLayout = blindReviewMode
  const useActiveDrillLayout = !useBlindReviewLayout
  const sessionVariant: PracticeSessionVariant = useBlindReviewLayout
    ? "blind-review"
    : useActiveDrillLayout
      ? "active-drill"
      : "default"
  const timerBudgetSeconds = resolveTimerBudgetSeconds({
    timing: metadata?.timing,
    questionCount: questions.length,
  })
  const timerProgress = computeElapsedTimerProgress(elapsed, timerBudgetSeconds)
  const allowReselect = canChangePracticeAnswer(showAnswersMode, Boolean(currentAnswer), {
    blindReview: reviewAfterComplete,
  })
  const prepTestLabel = headerLabel.replace(/^PrepTest\s*/i, "PT ")
  const questionRefLabel = `Q${safeIndex}`
  const drillSectionOptions: BlindReviewSectionOption[] = sessionId
    ? [
        {
          sectionSessionId: sessionId,
          label: sectionType === "LR" ? "LR Drill" : "RC Drill",
          sectionNumber: 1,
        },
      ]
    : []
  const notesStorageKey = sessionId ? `br-notes-${sessionId}` : "br-notes"
  const showNotesPanel = useBlindReviewLayout && answerViewTab === "blind_review" && notesOpen

  function handleAnswerViewChange(view: BlindReviewAnswerView) {
    setAnswerViewTab(view)
    if (view === "actual") setNotesOpen(false)
  }

  function handleToggleNotes() {
    if (answerViewTab !== "blind_review") return
    setNotesOpen((open) => !open)
  }

  const finishButton = blindReviewMode ? null : (
    <PracticeSessionFinishMenu
      finishing={finishing}
      submitLabel="Submit Drill"
      buttonClassName={
        useActiveDrillLayout
          ? "h-[52px] w-[106px] shrink-0 gap-2 rounded-2xl border border-[#dfe1e7] bg-[#f6f8fa] px-3 text-base font-medium tracking-[0.02em] text-[#062357] shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
          : undefined
      }
      onSubmitSection={requestSubmitDrill}
      onExit={leaveDrillSession}
    />
  )

  const sessionCardContent = (
    <>
      {blindReviewMode ? (
        <PracticeBlindReviewSessionHeader
          prepTestLabel={prepTestLabel}
          sectionOptions={drillSectionOptions}
          activeSectionSessionId={sessionId ?? null}
          onSelectSection={() => {}}
          questionRef={questionRefLabel}
          actualScoreLabel="Actual: BR"
          answerView={answerViewTab}
          activeColor={highlights.activeColor}
          toolMode={highlights.toolMode}
          fontScale={highlights.fontScale}
          lineSpacing={highlights.lineSpacing}
          boldEnabled={highlights.boldEnabled}
          italicEnabled={highlights.italicEnabled}
          onSelectColor={highlights.selectColor}
          onEraser={highlights.selectEraser}
          onUnderline={highlights.selectUnderline}
          onFontSize={highlights.cycleFontSize}
          onLineSpacing={highlights.cycleLineSpacing}
          onToggleBold={highlights.toggleBold}
          onToggleItalic={highlights.toggleItalic}
          notesOpen={notesOpen}
          notesEnabled={answerViewTab === "blind_review"}
          onToggleNotes={handleToggleNotes}
          onExitSection={requestSubmitDrill}
          exiting={finishing}
          showSectionSelect={false}
          exitButtonLabel="Finish Section"
          exitingLabel="Finishing…"
        />
      ) : (
        <PracticeSessionHeader
          variant={sessionVariant}
          title={headerLabel}
          findQuery={findQuery}
          onFindQueryChange={setFindQuery}
          activeColor={highlights.activeColor}
          toolMode={highlights.toolMode}
          fontScale={highlights.fontScale}
          lineSpacing={highlights.lineSpacing}
          boldEnabled={highlights.boldEnabled}
          italicEnabled={highlights.italicEnabled}
          onSelectColor={highlights.selectColor}
          onEraser={highlights.selectEraser}
          onUnderline={highlights.selectUnderline}
          onFontSize={highlights.cycleFontSize}
          onLineSpacing={highlights.cycleLineSpacing}
          onToggleBold={highlights.toggleBold}
          onToggleItalic={highlights.toggleItalic}
          timerDisplaySeconds={elapsed}
          timerPaused={paused}
          onToggleTimerPause={togglePause}
          onResetTimer={useActiveDrillLayout ? undefined : resetElapsed}
          timerProgress={timerProgress}
          showTimer
          finishButton={finishButton}
        />
      )}

      <div className="practice-session-body flex min-h-0 flex-1 flex-col overflow-hidden">
        {showNotesPanel && useBlindReviewLayout ? (
          <div className="flex min-h-0 flex-1 gap-5 overflow-hidden p-6">
            <div className="practice-session-br-notes-stack">
              <div className="practice-session-br-notes-pane practice-session-scroll-hidden rounded-2xl border border-[#e5e7eb] bg-white px-8 pb-8 pt-8 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
                {sectionType === "RC" && current.passage ? (
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{current.passage.title}</p>
                ) : null}
                <PracticeAnnotatedContent
                  regionKey={passageKey}
                  html={passageHtml}
                  findQuery={findQuery}
                  toolMode={highlights.toolMode}
                  onMouseUp={highlights.handleContentMouseUp}
                  onClickCapture={highlights.handleContentClick}
                  className="text-base leading-[1.625] text-[#364153]"
                />
              </div>
              <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
                <DrillQuestionPanel
                  key={current.id}
                  question={current}
                  questionNumber={safeIndex}
                  findQuery={findQuery}
                  selectedIndex={selectedIndex}
                  revealed={revealed}
                  isCorrect={currentAnswer?.isCorrect ?? null}
                  submitting={submitting}
                  allowReselect={allowReselect}
                  getRegionHtml={highlights.getRegionHtml}
                  toolMode={highlights.toolMode}
                  onContentMouseUp={highlights.handleContentMouseUp}
                  onContentClick={highlights.handleContentClick}
                  onSelect={(index) => void handleSelectChoice(index)}
                  flagged={current ? questionFlags.isFlagged(current.id) : false}
                  onToggleFlag={() => current && questionFlags.toggleFlag(current.id)}
                  flagsDisabled={sessionCompleted || blindReviewMode}
                  variant={sessionVariant}
                  blindReviewChrome={blindReviewMode}
                  answerView={answerViewTab}
                  onAnswerViewChange={handleAnswerViewChange}
                  recommendedForBr={recommendedForBr}
                  choicesDisabled={blindReviewMode && !editingBlindReviewAnswers}
                />
              </div>
            </div>
            <PracticeSessionNotesPanel
              open
              variant="blind-review"
              storageKey={notesStorageKey}
              questionTag={questionRefLabel}
              activeQuestionId={current?.id ?? null}
              onClose={() => setNotesOpen(false)}
            />
          </div>
        ) : (
          <div
            ref={sessionBodyRef}
            className={cn(
              "grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-hidden",
              useActiveDrillLayout
                ? "px-[23px] pt-[23px] lg:grid-cols-[524px_minmax(0,680px)] lg:gap-7"
                : "lg:grid-cols-2 lg:divide-x divide-[#dfe1e7]",
            )}
            style={highlights.contentStyle}
          >
            <div
              className={cn(
                "practice-session-pane min-h-0",
                useActiveDrillLayout
                  ? "pr-1"
                  : "border-[#dfe1e7] border-b p-5 lg:border-b-0",
              )}
            >
              {sectionType === "RC" && current.passage ? (
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{current.passage.title}</p>
              ) : null}
              <PracticeAnnotatedContent
                regionKey={passageKey}
                html={passageHtml}
                findQuery={findQuery}
                toolMode={highlights.toolMode}
                onMouseUp={highlights.handleContentMouseUp}
                onClickCapture={highlights.handleContentClick}
                className={useActiveDrillLayout ? "text-lg leading-[1.5] tracking-[0.02em] text-[#0d0d12]" : undefined}
              />
            </div>
            <div
              className={cn(
                "practice-session-pane min-h-0",
                useActiveDrillLayout
                  ? "rounded-2xl bg-white shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"
                  : "gap-4 border-[#dfe1e7] p-5",
              )}
            >
              <DrillQuestionPanel
                key={current.id}
                question={current}
                questionNumber={safeIndex}
                findQuery={findQuery}
                selectedIndex={selectedIndex}
                revealed={revealed}
                isCorrect={currentAnswer?.isCorrect ?? null}
                submitting={submitting}
                allowReselect={allowReselect}
                getRegionHtml={highlights.getRegionHtml}
                toolMode={highlights.toolMode}
                onContentMouseUp={highlights.handleContentMouseUp}
                onContentClick={highlights.handleContentClick}
                onSelect={(index) => void handleSelectChoice(index)}
                flagged={current ? questionFlags.isFlagged(current.id) : false}
                onToggleFlag={() => current && questionFlags.toggleFlag(current.id)}
                flagsDisabled={sessionCompleted || blindReviewMode}
                variant={sessionVariant}
                blindReviewChrome={blindReviewMode}
                answerView={answerViewTab}
                onAnswerViewChange={handleAnswerViewChange}
                recommendedForBr={recommendedForBr}
                choicesDisabled={blindReviewMode && !editingBlindReviewAnswers}
              />
            </div>
          </div>
        )}
      </div>

      <footer
        className={cn(
          "practice-session-footer relative z-10 flex shrink-0 items-center justify-between border-t border-[#dfe1e7] py-3",
          useActiveDrillLayout
            ? "min-h-[80px] gap-2 rounded-b-2xl bg-[#eceff3] px-4"
            : "gap-3 bg-background px-6 md:gap-4 md:px-6",
        )}
      >
        <div
          className={cn(
            "practice-session-scroll-hidden min-h-0 min-w-0 flex-1",
            useActiveDrillLayout || useBlindReviewLayout
              ? "practice-session-question-nav-grid"
              : "flex flex-nowrap items-stretch gap-1.5 overflow-x-auto overflow-y-hidden pb-0.5 pt-2.5 sm:gap-2",
          )}
        >
          {questions.map((q, i) => {
            const n = i + 1
            return (
              <PracticeSessionQuestionNavButton
                key={q.id}
                number={n}
                active={n === safeIndex}
                answered={Boolean(answersByQuestion[q.id])}
                flagged={questionFlags.isFlagged(q.id)}
                variant={sessionVariant}
                onClick={() => setQIndex(n)}
              />
            )
          })}
        </div>
        <div className={cn("flex shrink-0 self-center items-center", useActiveDrillLayout ? "gap-2" : "gap-2")}>
          <button
            type="button"
            className={
              useActiveDrillLayout
                ? "inline-flex size-[52px] items-center justify-center rounded-2xl border-2 border-[#dfe1e7] bg-[#f6f8fa] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition hover:bg-white disabled:opacity-40"
                : "inline-flex size-10 items-center justify-center rounded-full border bg-background transition hover:bg-muted disabled:opacity-40"
            }
            style={useActiveDrillLayout ? undefined : { borderColor: "var(--greyscale-100)" }}
            disabled={safeIndex <= 1}
            aria-label="Previous question"
            onClick={() => setQIndex((i) => Math.max(1, i - 1))}
          >
            <ChevronLeft className="size-6 text-[#666d80]" strokeWidth={2} />
          </button>
          <button
            type="button"
            className={
              useActiveDrillLayout
                ? "inline-flex size-[52px] items-center justify-center rounded-2xl border-2 border-[#dfe1e7] bg-[#f6f8fa] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition hover:bg-white disabled:opacity-40"
                : "inline-flex size-10 items-center justify-center rounded-full border bg-background transition hover:bg-muted disabled:opacity-40"
            }
            style={useActiveDrillLayout ? undefined : { borderColor: "var(--greyscale-100)" }}
            disabled={safeIndex >= questions.length}
            aria-label="Next question"
            onClick={() => setQIndex((i) => Math.min(questions.length, i + 1))}
          >
            <ChevronRight className="size-6 text-[#666d80]" strokeWidth={2} />
          </button>
        </div>
      </footer>
    </>
  )

  return (
    <StudentMain
      layout="immersive"
      className={cn(
        "flex min-h-0 max-w-none flex-1 flex-col overflow-hidden",
        !useActiveDrillLayout && "px-0 py-4 md:py-5",
        blindReviewMode && "bg-[color-mix(in_srgb,var(--color-student-accent)_6%,var(--greyscale-25))]",
        !useActiveDrillLayout && !blindReviewMode && "bg-[var(--primary-900,#041A44)]",
      )}
    >
      {useActiveDrillLayout ? (
        <PracticeSessionImmersiveFrame>
          {error ? (
            <p className="mb-3 shrink-0 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <div
            className={cn(
              "practice-session-card practice-session-card--active-drill flex h-full min-h-0 w-full flex-col rounded-2xl border border-[#dfe1e7] bg-[#f6f8fa] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]",
            )}
          >
            {sessionCardContent}
          </div>
        </PracticeSessionImmersiveFrame>
      ) : (
        <div
          className="mx-auto flex min-h-0 w-full flex-1 flex-col px-4 md:px-6"
          style={{ maxWidth: showNotesPanel ? 1440 : 1280 }}
        >
          {error ? (
            <p className="mb-3 shrink-0 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <div className="practice-session-card flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border border-[#dfe1e7] bg-background shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]">
            {sessionCardContent}
          </div>
        </div>
      )}

      <PracticeSubmitSectionModal
        open={submitModalOpen}
        title={reviewAfterComplete ? "Finish Section" : "Submit Drill"}
        confirmLabel={reviewAfterComplete ? "Finish Section" : "Submit Drill"}
        message={submitDrillMessage}
        submitting={finishing}
        onCancel={() => setSubmitModalOpen(false)}
        onConfirm={() => void handleConfirmSubmitDrill()}
      />

      <PracticeCompleteModal
        open={completeModal != null}
        titleId="drill-complete-title"
        subtitle={
          isPrepCourseAdaptiveDrill
            ? "You've completed the adaptive drill"
            : isPrepCourseDrill
              ? "You've completed the active drill"
              : "You've completed the drill"
        }
        rawScore={completeModal?.rawScore ?? 0}
        questionCount={completeModal?.questionCount ?? 1}
        scoreHidden={scoreHidden}
        onToggleScoreHidden={() => setScoreHidden((h) => !h)}
        showBlindReview={showBlindReviewOnComplete}
        onBlindReview={startDrillBlindReview}
        onSkipDetails={viewDrillResults}
        doneLabel={isDashboardAdaptiveDrillFlow ? "Return To Dashboard" : "Done"}
        onDone={leaveDrillSession}
      />
    </StudentMain>
  )
}

export { DrillSessionPage }
