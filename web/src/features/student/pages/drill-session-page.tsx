import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import { isQuestionRecommendedForBlindReview } from "@/features/student/blind-review/blind-review-navigation"
import type { DrillQuestion, DrillSessionResponse } from "@/features/student/drills/drill-types"
import { ACTIVE_DRILL_BODY_GRID_CLASS, ACTIVE_DRILL_FINISH_BUTTON_CLASS, ACTIVE_DRILL_FOOTER_CLASS, ACTIVE_DRILL_PASSAGE_PANE_CLASS, ACTIVE_DRILL_PASSAGE_TEXT_CLASS, ACTIVE_DRILL_QUESTION_PANE_CLASS } from "@/features/student/practice-session/practice-session-active-drill-styles"
import {
  OFFICIAL_BODY_GRID_CLASS,
  OFFICIAL_CARD_CLASS,
  OFFICIAL_FOOTER_CLASS,
  OFFICIAL_PASSAGE_PANE_CLASS,
  OFFICIAL_PASSAGE_TEXT_CLASS,
  OFFICIAL_QUESTION_PANE_CLASS,
} from "@/features/student/practice-session/practice-session-official-styles"
import { PracticeSessionActiveDrillFooterNav } from "@/features/student/practice-session/practice-session-active-drill-footer-nav"
import { PracticeAnnotatedContent } from "@/features/student/practice-session/practice-annotated-content"
import { PracticeSessionHighlightPopover } from "@/features/student/practice-session/practice-session-highlight-popover"
import type { BlindReviewAnswerView } from "@/features/student/practice-session/practice-blind-review-answer-toggle"
import {
  PracticeBlindReviewSessionHeader,
  type PracticeReviewSidePanel,
} from "@/features/student/practice-session/practice-blind-review-session-header"
import {
  BLIND_REVIEW_BODY_CLASS,
  BLIND_REVIEW_BODY_GRID_CLASS,
  BLIND_REVIEW_CARD_CLASS,
  BLIND_REVIEW_FOOTER_CLASS,
  BLIND_REVIEW_FOOTER_NAV_CLASS,
  BLIND_REVIEW_FOOTER_ROW_CLASS,
  BLIND_REVIEW_NAV_ARROW_BUTTON_CLASS,
  BLIND_REVIEW_NAV_ARROW_GROUP_CLASS,
  BLIND_REVIEW_NOTES_LAYOUT_CLASS,
  BLIND_REVIEW_NOTES_PASSAGE_PANEL_CLASS,
  BLIND_REVIEW_NOTES_QUESTION_PANEL_CLASS,
  BLIND_REVIEW_NOTES_STACK_CLASS,
  BLIND_REVIEW_PASSAGE_PANEL_CLASS,
  BLIND_REVIEW_PASSAGE_TEXT_CLASS,
  BLIND_REVIEW_QUESTION_PANEL_CLASS,
  BLIND_REVIEW_SHELL_CLASS,
  REVIEW_BODY_CLASS,
  REVIEW_CARD_CLASS,
  REVIEW_EXIT_BUTTON_CLASS,
  REVIEW_FOOTER_NAV_CLASS,
  REVIEW_FOOTER_ROW_CLASS,
  REVIEW_NAV_ARROW_BUTTON_CLASS,
  REVIEW_NAV_ARROW_GROUP_CLASS,
  REVIEW_PASSAGE_PANEL_CLASS,
  REVIEW_QUESTION_PANEL_CLASS,
  REVIEW_SHELL_CLASS,
  REVIEW_SIDE_PANEL_LAYOUT_CLASS,
} from "@/features/student/practice-session/practice-session-blind-review-styles"
import type { BlindReviewSectionOption } from "@/features/student/practice-session/practice-blind-review-section-select"
import { PracticeDrillQuestionPanel, regionKey } from "@/features/student/practice-session/practice-drill-question-panel"
import { PracticeSessionAccessibilityPanel } from "@/features/student/practice-session/practice-session-accessibility-panel"
import { usePracticeSessionAccessibilityPanel } from "@/features/student/practice-session/use-practice-session-accessibility-panel"
import { usePracticeSessionPauseModal } from "@/features/student/practice-session/use-practice-session-pause-modal"
import { usePracticeSessionZoomShortcuts } from "@/features/student/practice-session/use-practice-session-zoom-shortcuts"
import { PracticeSessionReviewPanel } from "@/features/student/practice-session/practice-session-review-panel"
import { PracticeSessionHeader } from "@/features/student/practice-session/practice-session-header"
import { PracticeSessionPauseModal } from "@/features/student/practice-session/practice-session-pause-modal"
import { PracticeSessionNotesPanel } from "@/features/student/practice-session/practice-session-notes-panel"
import { PracticeSessionReviewSidePanel } from "@/features/student/practice-session/practice-session-review-side-panel"
import {
  canChangePracticeAnswer,
  isOfficialLayout,
  resolveExamSessionVariant,
  type PracticeSessionVariant,
} from "@/features/student/practice-session/practice-session-types"
import { useExamFullscreen, useOfficialInterfacePreference } from "@/features/student/practice-session/use-official-interface"
import { usePracticeHighlights } from "@/features/student/practice-session/use-practice-highlights"
import { PracticeCompleteModal } from "@/features/student/practice-session/practice-complete-modal"
import { PracticeSessionFinishMenu } from "@/features/student/practice-session/practice-session-finish-menu"
import { PracticeSubmitSectionModal } from "@/features/student/practice-session/practice-submit-section-modal"
import { PracticeSessionImmersiveFrame } from "@/features/student/practice-session/practice-session-immersive-frame"
import { PracticeSessionNavArrowButton } from "@/features/student/practice-session/practice-session-nav-arrow-button"
import { PracticeSessionQuestionNavStrip } from "@/features/student/practice-session/practice-session-question-nav-strip"
import { resolvePracticeSessionQuestionNavOutcome } from "@/features/student/practice-session/practice-session-question-nav-outcome"
import { parseFlaggedQuestionIds } from "@/features/student/practice-session/practice-question-flags"
import { usePracticeQuestionFlags } from "@/features/student/practice-session/use-practice-question-flags"
import {
  computeElapsedTimerProgress,
  computeRemainingTimerProgress,
  isDrillCountdownTiming,
  resolveTimerBudgetSeconds,
  usePracticeSessionTimer,
} from "@/features/student/practice-session/use-practice-session-timer"
import { stashDrillBlindReviewResult } from "@/features/prep-course/lib/merge-drill-blind-review-attempt"
import {
  DASHBOARD_ADAPTIVE_DRILL_QUERY,
  drillSessionSupportsBlindReview,
  isDashboardAdaptiveDrill,
  showDrillSessionTimer,
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

type QuestionAnswerState = { selectedAnswer: string; isCorrect: boolean }

function ReviewStaticSwitch({ checked = false }: { checked?: boolean }) {
  return (
    <span
      role="switch"
      aria-checked={checked}
      aria-disabled="true"
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent",
        checked ? "bg-[#0d47a1]" : "bg-[#c5cad3]",
      )}
    >
      <span
        className={cn(
          "block size-4 rounded-full bg-white shadow-sm",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </span>
  )
}

function ReviewPassageCardHeader() {
  return (
    <div className="mb-8 flex h-8 shrink-0 items-center justify-between gap-4">
      <span className="inline-flex h-8 items-center rounded-[8px] bg-[#f6f8fa] px-4 py-1 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#0d47a1]">
        Passage Only View
      </span>
      <span className="inline-flex h-8 items-center gap-4" aria-label="Analysis View is display only">
        <span className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#062357]">
          Analysis View
        </span>
        <ReviewStaticSwitch />
      </span>
    </div>
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
  const passagePaneRef = useRef<HTMLDivElement>(null)
  const questionPaneRef = useRef<HTMLDivElement>(null)

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
  const [reviewSidePanel, setReviewSidePanel] = useState<PracticeReviewSidePanel>(null)
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false)
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false)
  const [passageOnlyView, setPassageOnlyView] = useState(false)
  const [lineFocus, setLineFocus] = useState(false)
  const { officialInterface, setOfficialInterface } = useOfficialInterfacePreference()
  const { isFullscreen, toggleExamFullscreen } = useExamFullscreen()
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

  const { elapsed, countdown, paused, pauseTimer, resumeTimer, resetElapsed, setInitialCountdown } =
    usePracticeSessionTimer()
  const pauseModal = usePracticeSessionPauseModal(pauseTimer, resumeTimer)
  const highlights = usePracticeHighlights()
  const accessibilityPanel = usePracticeSessionAccessibilityPanel(
    highlights.accessibilitySettings,
    highlights.applyAccessibilitySettings,
  )
  const useActiveDrillLayoutForZoom = !reviewAfterComplete
  const handleZoomScaleChange = useCallback(
    (zoomScale: number) => {
      highlights.applyAccessibilitySettings({
        ...highlights.accessibilitySettings,
        zoomScale,
      })
    },
    [highlights.applyAccessibilitySettings, highlights.accessibilitySettings],
  )
  usePracticeSessionZoomShortcuts(
    useActiveDrillLayoutForZoom,
    highlights.accessibilitySettings.zoomScale,
    handleZoomScaleChange,
  )

  const loadGenerationRef = useRef(0)
  const load = useCallback(async () => {
    if (!sessionId) return
    const generation = ++loadGenerationRef.current
    setLoading(true)
    setError(null)
    try {
      const data = await practiceApi.getDrillSession(sessionId)
      if (generation !== loadGenerationRef.current) return
      setDrill(data)
      const drillTiming = data.metadata.timing
      if (isDrillCountdownTiming(drillTiming)) {
        setInitialCountdown(
          resolveTimerBudgetSeconds({
            timing: drillTiming,
            questionCount: data.questions.length,
          }),
        )
      } else {
        setInitialCountdown(null)
      }
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
      if (generation !== loadGenerationRef.current) return
      setError(e instanceof Error ? formatSupabaseCallError(e) : "Failed to load drill")
    } finally {
      if (generation === loadGenerationRef.current) setLoading(false)
    }
  }, [practiceApi, sessionId, drillBlindReviewActiveKey, drillActualAnswersKey, drillBlindReviewAnswersKey, setInitialCountdown])

  useEffect(() => {
    void load()
    return () => {
      loadGenerationRef.current += 1
    }
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
  const resultsReviewMode =
    !reviewAfterComplete &&
    returnTo.includes("/app/practice/results/")
  const questionFlags = usePracticeQuestionFlags({
    sessionId: sessionId ?? "",
    questionIds,
    initialFlaggedIds,
    practiceApi,
    enabled: Boolean(sessionId) && !sessionCompleted && !resultsReviewMode,
  })

  useEffect(() => {
    if (resultsReviewMode && answerViewTab === "blind_review") {
      setAnswerViewTab("actual")
    }
  }, [answerViewTab, resultsReviewMode])

  const safeIndex = Math.min(Math.max(qIndex, 1), Math.max(questions.length, 1))
  const current = questions[safeIndex - 1]
  const editingBlindReviewAnswers = !reviewAfterComplete || answerViewTab === "blind_review"
  const displayAnswer = current
    ? resultsReviewMode
      ? answerViewTab === "clean"
        ? undefined
        : answerViewTab === "actual"
          ? actualAnswersByQuestion[current.id]
          : answersByQuestion[current.id]
      : reviewAfterComplete && answerViewTab === "actual"
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
      isQuestionRecommendedForBlindReview(actualAnswersByQuestion[current.id]),
  )
  function answerOutcome(
    answer: { selectedAnswer: string; isCorrect: boolean } | undefined,
  ) {
    if (answer == null || !answer.selectedAnswer.trim()) return "unanswered" as const
    return answer.isCorrect ? "correct" as const : "incorrect" as const
  }
  const actualOutcome = current ? answerOutcome(actualAnswersByQuestion[current.id]) : null
  const blindReviewOutcome = current ? answerOutcome(answersByQuestion[current.id]) : null
  const reviewNavOutcome = reviewAfterComplete || resultsReviewMode
    ? (questionId: string) =>
        resolvePracticeSessionQuestionNavOutcome(
          answerViewTab === "blind_review"
            ? answersByQuestion[questionId]
            : actualAnswersByQuestion[questionId],
        )
    : undefined
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
    passagePaneRef.current?.scrollTo({ top: 0 })
    questionPaneRef.current?.scrollTo({ top: 0 })
  }, [safeIndex, current?.id])

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
      setError(e instanceof Error ? formatSupabaseCallError(e) : "Failed to submit answer")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetResponse() {
    if (!sessionId || !current || submitting) return
    if (reviewAfterComplete && !editingBlindReviewAnswers) return
    if (!canChangePracticeAnswer(showAnswersMode, Boolean(currentAnswer), { blindReview: reviewAfterComplete })) {
      return
    }

    setAnswersByQuestion((prev) => {
      const next = { ...prev }
      delete next[current.id]
      if (reviewAfterComplete) persistBlindReviewAnswers(next)
      return next
    })

    if (reviewAfterComplete) return

    setSubmitting(true)
    try {
      await practiceApi.submitAnswer({
        sessionId,
        questionId: current.id,
        selectedAnswer: "",
      })
    } catch (e) {
      setError(e instanceof Error ? formatSupabaseCallError(e) : "Failed to reset response")
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
  const useBlindReviewLayout = blindReviewMode || resultsReviewMode
  const useActiveDrillLayout = !useBlindReviewLayout
  const sessionVariant: PracticeSessionVariant = resolveExamSessionVariant({
    blindReview: useBlindReviewLayout,
    officialInterface: useActiveDrillLayout && officialInterface,
  })
  const officialChrome = isOfficialLayout(sessionVariant)
  const timerBudgetSeconds = resolveTimerBudgetSeconds({
    timing: metadata?.timing,
    questionCount: questions.length,
  })
  const timedDrill = isDrillCountdownTiming(metadata?.timing) && countdown != null
  const timerLabel = timedDrill ? "Remaining" : "Elapsed"
  const timerDisplaySeconds = timedDrill ? countdown : elapsed
  const timerProgress = timedDrill
    ? computeRemainingTimerProgress(countdown, timerBudgetSeconds)
    : computeElapsedTimerProgress(elapsed, timerBudgetSeconds)
  const allowReselect =
    !resultsReviewMode &&
    canChangePracticeAnswer(showAnswersMode, Boolean(currentAnswer), {
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
  const showNotesPanel = useBlindReviewLayout && (resultsReviewMode ? reviewSidePanel === "notes" : answerViewTab === "blind_review" && notesOpen)
  const showReviewContentPanel =
    resultsReviewMode && (reviewSidePanel === "explanation" || reviewSidePanel === "insights")

  function handleAnswerViewChange(view: BlindReviewAnswerView) {
    setAnswerViewTab(view)
    if (view === "actual") setNotesOpen(false)
  }

  function handleToggleNotes() {
    if (resultsReviewMode) {
      setReviewSidePanel((prev) => (prev === "notes" ? null : "notes"))
      return
    }
    if (answerViewTab !== "blind_review") return
    setNotesOpen((open) => !open)
  }

  const finishButton = blindReviewMode ? null : (
    <PracticeSessionFinishMenu
      finishing={finishing}
      submitLabel="Submit Drill"
      buttonClassName={useActiveDrillLayout ? ACTIVE_DRILL_FINISH_BUTTON_CLASS : undefined}
      iconTrigger={useActiveDrillLayout}
      variant={sessionVariant}
      officialInterface={officialInterface}
      onOfficialInterfaceChange={setOfficialInterface}
      onSubmitSection={requestSubmitDrill}
      onExit={leaveDrillSession}
    />
  )

  const blindReviewHeader = useBlindReviewLayout ? (
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
      notesOpen={resultsReviewMode ? reviewSidePanel === "notes" : notesOpen}
      notesEnabled={resultsReviewMode || answerViewTab === "blind_review"}
      onToggleNotes={handleToggleNotes}
      onExitSection={resultsReviewMode ? leaveDrillSession : requestSubmitDrill}
      exiting={finishing}
      showSectionSelect={false}
      exitButtonLabel="Finish Drill"
      exitingLabel="Finishing…"
      chrome={resultsReviewMode ? "review" : "blind-review"}
      sidePanel={resultsReviewMode ? reviewSidePanel : null}
      onSidePanelChange={resultsReviewMode ? setReviewSidePanel : undefined}
      findQuery={resultsReviewMode ? findQuery : undefined}
      onFindQueryChange={resultsReviewMode ? setFindQuery : undefined}
      questionProgressLabel={resultsReviewMode ? `${safeIndex} of ${questions.length}` : null}
    />
  ) : null

  const sessionInnerContent = (
    <>
      <div
        className={
          useBlindReviewLayout
            ? resultsReviewMode
              ? REVIEW_BODY_CLASS
              : BLIND_REVIEW_BODY_CLASS
            : "practice-session-body flex min-h-0 flex-1 flex-col overflow-hidden"
        }
        data-color-scheme={highlights.accessibilitySettings.colorScheme}
        style={useBlindReviewLayout ? undefined : highlights.contentStyle}
      >
        {showNotesPanel && useBlindReviewLayout ? (
          <div className={resultsReviewMode ? REVIEW_SIDE_PANEL_LAYOUT_CLASS : BLIND_REVIEW_NOTES_LAYOUT_CLASS}>
            <div className={resultsReviewMode ? "contents" : BLIND_REVIEW_NOTES_STACK_CLASS}>
              <div
                ref={passagePaneRef}
                className={resultsReviewMode ? REVIEW_PASSAGE_PANEL_CLASS : BLIND_REVIEW_NOTES_PASSAGE_PANEL_CLASS}
              >
                {resultsReviewMode ? <ReviewPassageCardHeader /> : null}
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
                  className={cn(
                    BLIND_REVIEW_PASSAGE_TEXT_CLASS,
                    resultsReviewMode && "text-base leading-[1.5] tracking-[0.32px] text-[#36394a]",
                  )}
                />
              </div>
              <div
                ref={questionPaneRef}
                className={resultsReviewMode ? REVIEW_QUESTION_PANEL_CLASS : BLIND_REVIEW_NOTES_QUESTION_PANEL_CLASS}
              >
                <PracticeDrillQuestionPanel
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
                  onSelect={(index) => void handleSelectChoice(index)}
                  onResetResponse={() => void handleResetResponse()}
                  flagged={current ? questionFlags.isFlagged(current.id) : false}
                  onToggleFlag={() => current && questionFlags.toggleFlag(current.id)}
                  flagsDisabled={sessionCompleted || blindReviewMode}
                  variant={sessionVariant}
                  blindReviewChrome={blindReviewMode}
                  answerView={answerViewTab}
                  onAnswerViewChange={handleAnswerViewChange}
                  recommendedForBr={recommendedForBr}
                  choicesDisabled={blindReviewMode && !editingBlindReviewAnswers}
                  reviewChrome={resultsReviewMode}
                  actualOutcome={actualOutcome}
                  blindReviewOutcome={blindReviewOutcome}
                  showCorrectAnswer={showCorrectAnswer}
                  onShowCorrectAnswerChange={setShowCorrectAnswer}
                  blindReviewTabEnabled={false}
                />
              </div>
            </div>
            <PracticeSessionNotesPanel
              open
              variant="blind-review"
              chrome={resultsReviewMode ? "review" : "blind-review"}
              storageKey={notesStorageKey}
              questionTag={questionRefLabel}
              activeQuestionId={current?.id ?? null}
              onClose={() => {
                if (resultsReviewMode) setReviewSidePanel(null)
                else setNotesOpen(false)
              }}
            />
          </div>
        ) : showReviewContentPanel && useBlindReviewLayout ? (
          <div className={REVIEW_SIDE_PANEL_LAYOUT_CLASS}>
            <div className="contents">
              <div ref={passagePaneRef} className={REVIEW_PASSAGE_PANEL_CLASS}>
                <ReviewPassageCardHeader />
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
                  className={cn(BLIND_REVIEW_PASSAGE_TEXT_CLASS, "text-base leading-[1.5] tracking-[0.32px] text-[#36394a]")}
                />
              </div>
              <div ref={questionPaneRef} className={REVIEW_QUESTION_PANEL_CLASS}>
                <PracticeDrillQuestionPanel
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
                  onSelect={(index) => void handleSelectChoice(index)}
                  onResetResponse={() => void handleResetResponse()}
                  flagged={current ? questionFlags.isFlagged(current.id) : false}
                  onToggleFlag={() => current && questionFlags.toggleFlag(current.id)}
                  flagsDisabled
                  variant={sessionVariant}
                  blindReviewChrome={useBlindReviewLayout}
                  answerView={answerViewTab}
                  onAnswerViewChange={handleAnswerViewChange}
                  recommendedForBr={recommendedForBr}
                  choicesDisabled
                  reviewChrome
                  actualOutcome={actualOutcome}
                  blindReviewOutcome={blindReviewOutcome}
                  showCorrectAnswer={showCorrectAnswer}
                  onShowCorrectAnswerChange={setShowCorrectAnswer}
                  blindReviewTabEnabled={false}
                />
              </div>
            </div>
            <PracticeSessionReviewSidePanel
              mode={reviewSidePanel === "insights" ? "insights" : "explanation"}
              questionId={current?.id ?? null}
              onClose={() => setReviewSidePanel(null)}
            />
          </div>
        ) : (
          <div
            ref={sessionBodyRef}
            className={cn(
              "grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-hidden",
                useBlindReviewLayout
                  ? BLIND_REVIEW_BODY_GRID_CLASS
                  : officialChrome
                    ? cn(OFFICIAL_BODY_GRID_CLASS, passageOnlyView && "lg:grid-cols-1 lg:pr-0")
                  : useActiveDrillLayout
                  ? ACTIVE_DRILL_BODY_GRID_CLASS
                  : "lg:grid-cols-2 lg:divide-x divide-[#dfe1e7]",
            )}
          >
            <div
              className={cn(
                "practice-session-pane min-h-0",
                officialChrome && lineFocus && "practice-session-pane--line-focus",
                useBlindReviewLayout
                  ? BLIND_REVIEW_PASSAGE_PANEL_CLASS
                  : officialChrome
                    ? OFFICIAL_PASSAGE_PANE_CLASS
                  : useActiveDrillLayout
                    ? ACTIVE_DRILL_PASSAGE_PANE_CLASS
                    : "border-[#dfe1e7] border-b p-5 lg:border-b-0",
              )}
            >
              {resultsReviewMode ? <ReviewPassageCardHeader /> : null}
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
                className={
                  useBlindReviewLayout
                    ? BLIND_REVIEW_PASSAGE_TEXT_CLASS
                    : officialChrome
                      ? OFFICIAL_PASSAGE_TEXT_CLASS
                    : useActiveDrillLayout
                      ? ACTIVE_DRILL_PASSAGE_TEXT_CLASS
                      : undefined
                }
              />
            </div>
            <div
              className={cn(
                "practice-session-pane min-h-0",
                officialChrome && passageOnlyView && "hidden",
                useBlindReviewLayout
                  ? BLIND_REVIEW_QUESTION_PANEL_CLASS
                  : officialChrome
                    ? OFFICIAL_QUESTION_PANE_CLASS
                  : useActiveDrillLayout
                    ? ACTIVE_DRILL_QUESTION_PANE_CLASS
                    : "gap-4 border-[#dfe1e7] p-5",
              )}
            >
              <PracticeDrillQuestionPanel
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
                onSelect={(index) => void handleSelectChoice(index)}
                onResetResponse={() => void handleResetResponse()}
                flagged={current ? questionFlags.isFlagged(current.id) : false}
                onToggleFlag={() => current && questionFlags.toggleFlag(current.id)}
                flagsDisabled={sessionCompleted || blindReviewMode}
                onOpenReview={useActiveDrillLayout ? () => setReviewPanelOpen((open) => !open) : undefined}
                reviewActive={reviewPanelOpen}
                onOpenAccessibility={useActiveDrillLayout ? accessibilityPanel.openPanel : undefined}
                variant={sessionVariant}
                toolMode={highlights.toolMode}
                onHighlighter={() => highlights.selectColor("yellow")}
                onEraser={highlights.selectEraser}
                lineFocusActive={lineFocus}
                onLineFocus={() => setLineFocus((value) => !value)}
                onFullscreen={toggleExamFullscreen}
                fullView={isFullscreen}
                blindReviewChrome={blindReviewMode}
                answerView={answerViewTab}
                onAnswerViewChange={handleAnswerViewChange}
                recommendedForBr={recommendedForBr}
                choicesDisabled={blindReviewMode && !editingBlindReviewAnswers}
                reviewChrome={resultsReviewMode}
                actualOutcome={actualOutcome}
                blindReviewOutcome={blindReviewOutcome}
                showCorrectAnswer={showCorrectAnswer}
                onShowCorrectAnswerChange={setShowCorrectAnswer}
                blindReviewTabEnabled={false}
              />
            </div>
          </div>
        )}
      </div>

      <footer
        className={cn(
          "practice-session-footer relative z-10",
          useBlindReviewLayout
            ? BLIND_REVIEW_FOOTER_CLASS
            : officialChrome
              ? OFFICIAL_FOOTER_CLASS
            : useActiveDrillLayout
              ? ACTIVE_DRILL_FOOTER_CLASS
              : "flex shrink-0 items-center justify-between gap-3 border-t border-[#dfe1e7] bg-background px-6 py-3 md:gap-4 md:px-6",
        )}
      >
        {useActiveDrillLayout ? (
          <PracticeSessionActiveDrillFooterNav
            questions={questions}
            safeIndex={safeIndex}
            answersByQuestion={answersByQuestion}
            isFlagged={questionFlags.isFlagged}
            variant={sessionVariant}
            showPassageBreaks={sectionType === "RC"}
            onSelectQuestion={setQIndex}
            onPrev={() => setQIndex((i) => Math.max(1, i - 1))}
            onNext={() => setQIndex((i) => Math.min(questions.length, i + 1))}
          />
        ) : useBlindReviewLayout ? (
          <div className={resultsReviewMode ? REVIEW_FOOTER_ROW_CLASS : BLIND_REVIEW_FOOTER_ROW_CLASS}>
            <PracticeSessionQuestionNavStrip
              questions={questions}
              safeIndex={safeIndex}
              answersByQuestion={answersByQuestion}
              isFlagged={questionFlags.isFlagged}
              recommendedForBr={(questionId) =>
                isQuestionRecommendedForBlindReview(actualAnswersByQuestion[questionId])
              }
              outcomeForQuestion={reviewNavOutcome}
              variant={sessionVariant}
              showPassageBreaks={sectionType === "RC"}
              onSelectQuestion={setQIndex}
              className={resultsReviewMode ? REVIEW_FOOTER_NAV_CLASS : BLIND_REVIEW_FOOTER_NAV_CLASS}
            />
            <div className={resultsReviewMode ? REVIEW_NAV_ARROW_GROUP_CLASS : BLIND_REVIEW_NAV_ARROW_GROUP_CLASS}>
              <PracticeSessionNavArrowButton
                direction="prev"
                disabled={safeIndex <= 1}
                iconOnly
                figmaNarrowArrow
                className={resultsReviewMode ? REVIEW_NAV_ARROW_BUTTON_CLASS : BLIND_REVIEW_NAV_ARROW_BUTTON_CLASS}
                onClick={() => setQIndex((i) => Math.max(1, i - 1))}
              />
              <PracticeSessionNavArrowButton
                direction="next"
                disabled={safeIndex >= questions.length}
                iconOnly
                figmaNarrowArrow
                className={resultsReviewMode ? REVIEW_NAV_ARROW_BUTTON_CLASS : BLIND_REVIEW_NAV_ARROW_BUTTON_CLASS}
                onClick={() => setQIndex((i) => Math.min(questions.length, i + 1))}
              />
              {resultsReviewMode ? (
                <button
                  type="button"
                  className={REVIEW_EXIT_BUTTON_CLASS}
                  onClick={leaveDrillSession}
                  disabled={finishing}
                >
                  <span>Exit</span>
                  <X className="size-4" strokeWidth={2} aria-hidden />
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
        <PracticeSessionQuestionNavStrip
          questions={questions}
          safeIndex={safeIndex}
          answersByQuestion={answersByQuestion}
          isFlagged={questionFlags.isFlagged}
          variant={sessionVariant}
          showPassageBreaks={sectionType === "RC"}
          onSelectQuestion={setQIndex}
          className="practice-session-scroll-hidden flex min-h-0 min-w-0 flex-1 flex-nowrap items-stretch gap-1.5 overflow-x-auto overflow-y-hidden pb-0.5 pt-2.5 sm:gap-2"
        />
        <div className="flex shrink-0 items-center gap-2 self-center">
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-full border bg-background transition hover:bg-muted disabled:opacity-40"
                style={{ borderColor: "var(--greyscale-100)" }}
                disabled={safeIndex <= 1}
                aria-label="Previous question"
                onClick={() => setQIndex((i) => Math.max(1, i - 1))}
              >
                <ChevronLeft className="size-5 text-muted-foreground" strokeWidth={2} />
              </button>
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-full border bg-background transition hover:bg-muted disabled:opacity-40"
                style={{ borderColor: "var(--greyscale-100)" }}
                disabled={safeIndex >= questions.length}
                aria-label="Next question"
                onClick={() => setQIndex((i) => Math.min(questions.length, i + 1))}
              >
                <ChevronRight className="size-5 text-muted-foreground" strokeWidth={2} />
              </button>
        </div>
          </>
        )}
      </footer>
    </>
  )

  const sessionCardContent = (
    <>
      {!useBlindReviewLayout ? (
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
          timerLabel={timerLabel}
          timerDisplaySeconds={timerDisplaySeconds}
          timerPaused={paused}
          onTimerPauseRequest={pauseModal.requestPause}
          onResetTimer={useActiveDrillLayout ? undefined : resetElapsed}
          timerProgress={timerProgress}
          showTimer={showDrillSessionTimer({
            metadata: sessionMetadata,
            dashboardAdaptiveEntry,
          })}
          questionProgressLabel={
            useActiveDrillLayout && questions.length > 0
              ? `${safeIndex} of ${questions.length}`
              : null
          }
          questionNumber={useActiveDrillLayout ? safeIndex : undefined}
          questionCount={useActiveDrillLayout ? questions.length : undefined}
          finishButton={finishButton}
          onClose={leaveDrillSession}
          passageOnlyView={passageOnlyView}
          onPassageOnlyViewChange={setPassageOnlyView}
        />
      ) : null}
      {sessionInnerContent}
      <PracticeSessionHighlightPopover
        menu={highlights.selectionMenu}
        onApplyColor={highlights.applySelectionColor}
        onRemove={highlights.removeSelectionHighlight}
        onToggleExpanded={highlights.toggleSelectionExpanded}
        onDismiss={highlights.dismissSelectionMenu}
        isAnchorConnected={highlights.isSelectionMenuAnchorConnected}
      />
    </>
  )

  return (
    <StudentMain
      layout="immersive"
      className={cn(
        "flex min-h-0 max-w-none flex-1 flex-col overflow-hidden",
        useBlindReviewLayout
          ? resultsReviewMode
            ? "h-full bg-white"
            : "h-full bg-[#f5f9ff]"
          : !useActiveDrillLayout && "px-0 py-4 md:py-5",
        !useActiveDrillLayout && !blindReviewMode && "bg-[var(--primary-900,#041A44)]",
      )}
    >
      {useBlindReviewLayout ? (
        <div className={resultsReviewMode ? REVIEW_SHELL_CLASS : BLIND_REVIEW_SHELL_CLASS}>
          {error ? (
            <p className="absolute left-4 right-4 top-0 z-20 text-sm text-red-600 md:left-6 md:right-6" role="alert">
              {error}
            </p>
          ) : null}
          {blindReviewHeader}
          <div
            className={resultsReviewMode ? REVIEW_CARD_CLASS : BLIND_REVIEW_CARD_CLASS}
            style={resultsReviewMode ? undefined : { maxWidth: showNotesPanel ? 1440 : 1280 }}
          >
            {sessionInnerContent}
          </div>
        </div>
      ) : useActiveDrillLayout ? (
        <PracticeSessionImmersiveFrame>
          {error ? (
            <p className="mb-3 shrink-0 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <div
            className={cn(
              officialChrome
                ? OFFICIAL_CARD_CLASS
                : "practice-session-card practice-session-card--active-drill relative flex h-auto max-h-full min-h-0 w-full flex-col overflow-hidden rounded-none border border-[#dfe1e7] bg-white shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]",
            )}
          >
            {sessionCardContent}
            <PracticeSessionReviewPanel
              open={reviewPanelOpen}
              variant={sessionVariant}
              questions={questions}
              currentIndex={safeIndex}
              answersByQuestion={answersByQuestion}
              isFlagged={questionFlags.isFlagged}
              onSelectQuestion={setQIndex}
              onClose={() => setReviewPanelOpen(false)}
              onFinish={officialChrome ? requestSubmitDrill : undefined}
              showPassageBreaks={sectionType === "RC"}
            />
            <PracticeSessionAccessibilityPanel
              open={accessibilityPanel.open}
              settings={highlights.accessibilitySettings}
              timerDisplaySeconds={timerDisplaySeconds}
              onClose={accessibilityPanel.closePanel}
              onCancel={accessibilityPanel.cancelPanel}
              onPreview={accessibilityPanel.previewSettings}
              onSave={accessibilityPanel.saveSettings}
            />
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

      <PracticeSessionPauseModal
        open={pauseModal.open}
        title="Section"
        message="Your section is paused"
        onResume={pauseModal.resume}
        onSaveAndExit={() => {
          pauseModal.close()
          leaveDrillSession()
        }}
      />

      <PracticeSubmitSectionModal
        open={submitModalOpen}
        title={reviewAfterComplete ? "Finish Drill" : "Submit Drill"}
        confirmLabel={reviewAfterComplete ? "Finish Drill" : "Submit Drill"}
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
            ? "You've completed the Smart Drill"
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
