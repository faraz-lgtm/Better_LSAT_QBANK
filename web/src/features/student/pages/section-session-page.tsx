import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import { LrDrillOptionRow } from "@/features/student/drills/lr-drill-option-row"
import { cn } from "@/lib/utils"
import type { DrillQuestion } from "@/features/student/drills/drill-types"
import {
  blindReviewSectionSessionPath,
  firstBlindReviewSectionSessionId,
  prepTestResultsPath,
  skipBlindReviewBestEffort,
} from "@/features/student/blind-review/blind-review-navigation"
import type { BlindReviewDetailSection } from "@/features/student/blind-review/blind-review-types"
import type { BlindReviewSectionOption } from "@/features/student/practice-session/practice-blind-review-section-select"
import type { SectionSessionResponse } from "@/features/student/sections/section-types"
import {
  isRetakePrepTestAttempt,
  isPrepTestSectionIntroActive,
  prepTestHeaderLabel,
  prepTestHubHref,
  PREPTEST_LIST_HREF,
} from "@/features/student/preptests/preptest-hub-navigation"
import {
  ACTIVE_DRILL_FINISH_BUTTON_CLASS,
  ACTIVE_DRILL_FOOTER_CLASS,
  ACTIVE_DRILL_FOOTER_ROW_CLASS,
  ACTIVE_DRILL_OPTIONS_LIST_CLASS,
  SESSION_FINISH_BUTTON_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import { PracticeAnnotatedContent } from "@/features/student/practice-session/practice-annotated-content"
import { PracticeQuestionStem } from "@/features/student/practice-session/practice-question-stem"
import {
  PracticeBlindReviewAnswerToggle,
  type BlindReviewAnswerView,
} from "@/features/student/practice-session/practice-blind-review-answer-toggle"
import { PracticeBlindReviewSessionHeader } from "@/features/student/practice-session/practice-blind-review-session-header"
import { PracticeBlindReviewQuestionPanel } from "@/features/student/practice-session/practice-blind-review-question-panel"
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
} from "@/features/student/practice-session/practice-session-blind-review-styles"
import { PracticeSectionIntroHeader } from "@/features/student/practice-session/practice-section-intro-header"
import { PracticePrepTestSectionIntroPanel } from "@/features/student/practice-session/practice-preptest-section-intro-panel"
import { PracticePrepTestSectionIntroFrame } from "@/features/student/practice-session/practice-preptest-section-intro-frame"
import { PracticeSessionHeader } from "@/features/student/practice-session/practice-session-header"
import { PracticeSessionNotesPanel } from "@/features/student/practice-session/practice-session-notes-panel"
import {
  canChangePracticeAnswer,
  type PracticeSessionVariant,
  type PracticeToolMode,
} from "@/features/student/practice-session/practice-session-types"
import { usePracticeHighlights } from "@/features/student/practice-session/use-practice-highlights"
import { PracticeCompleteModal } from "@/features/student/practice-session/practice-complete-modal"
import { PracticeSessionImmersiveFrame } from "@/features/student/practice-session/practice-session-immersive-frame"
import {
  ACTIVE_DRILL_NAV_ARROW_GROUP_CLASS,
  PracticeSessionNavArrowButton,
} from "@/features/student/practice-session/practice-session-nav-arrow-button"
import { PracticeSessionFinishMenu } from "@/features/student/practice-session/practice-session-finish-menu"
import { PracticeSessionQuestionNavButton } from "@/features/student/practice-session/practice-session-question-nav-button"
import { PracticeSubmitSectionModal } from "@/features/student/practice-session/practice-submit-section-modal"
import {
  buildPrepTestSectionTimeUpSummary,
  PracticePrepTestSectionTimeUpModal,
  type PracticePrepTestSectionTimeUpStep,
} from "@/features/student/practice-session/practice-preptest-section-time-up-modal"
import { parseFlaggedQuestionIds } from "@/features/student/practice-session/practice-question-flags"
import { usePracticeQuestionFlags } from "@/features/student/practice-session/use-practice-question-flags"
import { usePracticeQuestionSeen } from "@/features/student/practice-session/use-practice-question-seen"
import {
  computeElapsedTimerProgress,
  computeRemainingTimerProgress,
  isSectionCountdownTiming,
  isUnlimitedPracticeTiming,
  resolveTimerBudgetSeconds,
  usePracticeSessionTimer,
} from "@/features/student/practice-session/use-practice-session-timer"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { createPracticeApi } from "@/lib/api/practice"
import {
  resolvePrepTestBreakAfterSectionId,
  writeStoredSectionBreak,
} from "@/features/student/preptests/preptest-section-break"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const SECTION_TIMER_SECONDS = 35 * 60

function countSectionIncorrect(
  questions: DrillQuestion[],
  answersByQuestion: Record<string, { selectedAnswer: string; isCorrect: boolean }>,
): number {
  return questions.reduce((count, question) => {
    const answer = answersByQuestion[question.id]
    if (!answer || !answer.isCorrect) return count + 1
    return count
  }, 0)
}

function storePrepTestSectionScorePrediction(sessionId: string, score: number): void {
  sessionStorage.setItem(`preptest-section-prediction-${sessionId}`, String(score))
}

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

function splitBlindReviewAnswersFromActual(
  latestAnswers: Record<string, QuestionAnswerState>,
  actualAnswers: Record<string, QuestionAnswerState>,
): Record<string, QuestionAnswerState> {
  const blindReviewAnswers: Record<string, QuestionAnswerState> = {}
  for (const [questionId, answer] of Object.entries(latestAnswers)) {
    const actual = actualAnswers[questionId]
    if (actual && actual.selectedAnswer === answer.selectedAnswer) continue
    blindReviewAnswers[questionId] = answer
  }
  return blindReviewAnswers
}

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
  blindReviewChrome?: boolean
  answerView?: BlindReviewAnswerView
  onAnswerViewChange?: (view: BlindReviewAnswerView) => void
  recommendedForBr?: boolean
  variant?: PracticeSessionVariant
}

function SectionQuestionPanel({
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
  blindReviewChrome = false,
  answerView = "blind_review",
  onAnswerViewChange,
  recommendedForBr = false,
  variant = "default",
}: QuestionPanelProps) {
  const [hiddenChoices, setHiddenChoices] = useState<Record<number, boolean>>({})
  const stemKey = regionKey(question.id, "stem")
  const stemHtml = getRegionHtml(stemKey, question.stemText ?? "")
  const isBlindReviewLayout = blindReviewChrome && variant === "blind-review"

  if (isBlindReviewLayout) {
    return (
      <PracticeBlindReviewQuestionPanel
        question={question}
        questionNumber={questionNumber}
        findQuery={findQuery}
        selectedIndex={selectedIndex}
        revealed={revealed}
        isCorrect={isCorrect}
        submitting={submitting}
        allowReselect={allowReselect}
        getRegionHtml={getRegionHtml}
        toolMode={toolMode}
        onContentMouseUp={onContentMouseUp}
        onContentClick={onContentClick}
        onSelect={onSelect}
        answerView={answerView}
        onAnswerViewChange={onAnswerViewChange}
        recommendedForBr={recommendedForBr}
      />
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
      <div className={variant === "active-drill" ? ACTIVE_DRILL_OPTIONS_LIST_CLASS : "flex flex-col gap-2"}>
        {question.choices.map((choice, index) => (
          <LrDrillOptionRow
            key={choice.id}
            index={index}
            html={getRegionHtml(regionKey(question.id, `choice-${choice.id}`), choice.text)}
            findQuery={findQuery}
            regionKey={regionKey(question.id, `choice-${choice.id}`)}
            selected={selectedIndex === index}
            hidden={Boolean(hiddenChoices[index])}
            disabled={submitting}
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

function SectionSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const isRetakeAttempt = isRetakePrepTestAttempt(searchParams)
  const blindReviewMode = searchParams.get("blindReview") === "1"
  const sectionIntroActive = isPrepTestSectionIntroActive(searchParams, blindReviewMode)
  const blindReviewPrepTestId = searchParams.get("prepTestId")
  const navigate = useNavigate()
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])
  const sessionBodyRef = useRef<HTMLDivElement>(null)
  const passagePaneRef = useRef<HTMLDivElement>(null)
  const questionPaneRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sectionSession, setSectionSession] = useState<SectionSessionResponse | null>(null)
  const [qIndex, setQIndex] = useState(1)
  const [findQuery, setFindQuery] = useState("")
  const [answersByQuestion, setAnswersByQuestion] = useState<
    Record<string, { selectedAnswer: string; isCorrect: boolean }>
  >({})
  const [submitting, setSubmitting] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [startingBlindReview, setStartingBlindReview] = useState(false)
  const [completeModal, setCompleteModal] = useState<{
    rawScore: number
    questionCount: number
    scaledScore?: number | null
    prepTestLabel: string
    prepTestSessionId?: string
    afterSectionId?: string | null
    flow: "preptest" | "preptest-section" | "standalone"
  } | null>(null)
  const [scoreHidden, setScoreHidden] = useState(true)
  const [postCompleteBlindReview, setPostCompleteBlindReview] = useState(false)
  const [answerViewTab, setAnswerViewTab] = useState<BlindReviewAnswerView>("blind_review")
  const [notesOpen, setNotesOpen] = useState(false)
  const [timeUpFlow, setTimeUpFlow] = useState<{
    step: PracticePrepTestSectionTimeUpStep
    predictedScore: number | null
  } | null>(null)
  const timeUpTriggeredRef = useRef(false)

  const submitModalTitle = postCompleteBlindReview
    ? "Finish Blind Review"
    : blindReviewMode
      ? "Exit Section"
      : "Submit Section"
  const submitModalConfirmLabel = postCompleteBlindReview
    ? "View Results"
    : blindReviewMode
      ? "Exit Section"
      : "Submit Section"

  const [actualAnswersByQuestion, setActualAnswersByQuestion] = useState<Record<string, QuestionAnswerState>>({})
  const [blindReviewSections, setBlindReviewSections] = useState<BlindReviewDetailSection[]>([])

  const sectionPostBrActiveKey = sessionId ? `section-post-br-active-${sessionId}` : null
  const sectionPostBrActualKey = sessionId ? `section-post-br-actual-${sessionId}` : null
  const sectionPostBrAnswersKey = sessionId ? `section-post-br-answers-${sessionId}` : null

  function clearPostCompleteBlindReviewStorage() {
    if (sectionPostBrActiveKey) sessionStorage.removeItem(sectionPostBrActiveKey)
    if (sectionPostBrActualKey) sessionStorage.removeItem(sectionPostBrActualKey)
    if (sectionPostBrAnswersKey) sessionStorage.removeItem(sectionPostBrAnswersKey)
  }

  function startPostCompleteBlindReview() {
    if (!sessionId) return
    const actual = { ...answersByQuestion }
    setActualAnswersByQuestion(actual)
    if (sectionPostBrActualKey) {
      sessionStorage.setItem(sectionPostBrActualKey, JSON.stringify(actual))
    }
    if (sectionPostBrActiveKey) {
      sessionStorage.setItem(sectionPostBrActiveKey, "1")
    }
    if (sectionPostBrAnswersKey) {
      sessionStorage.removeItem(sectionPostBrAnswersKey)
    }
    setAnswersByQuestion({})
    setAnswerViewTab("blind_review")
    setCompleteModal(null)
    setPostCompleteBlindReview(true)
    setScoreHidden(true)
    setQIndex(1)
    setError(null)
  }

  async function viewSectionResults() {
    if (!sessionId) return

    if (postCompleteBlindReview) {
      setFinishing(true)
      setError(null)
      try {
        const answers = Object.entries(answersByQuestion).map(([questionId, answer]) => ({
          questionId,
          selectedAnswer: answer.selectedAnswer,
        }))
        if (answers.length > 0) {
          await practiceApi.completeSectionBlindReview({ sessionId, answers })
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save blind review")
        setFinishing(false)
        return
      } finally {
        setFinishing(false)
      }
    }

    clearPostCompleteBlindReviewStorage()
    setPostCompleteBlindReview(false)
    setCompleteModal(null)
    navigate(`/app/practice/results/${encodeURIComponent(sessionId)}`, { replace: true })
  }

  function leaveSectionComplete() {
    clearPostCompleteBlindReviewStorage()
    setPostCompleteBlindReview(false)
    setCompleteModal(null)
    navigate("/app/practice/sections", { replace: true })
  }

  const { elapsed, countdown, paused, togglePause, resetElapsed, setInitialCountdown } = usePracticeSessionTimer({
    enabled: !blindReviewMode && !sectionIntroActive,
  })
  const highlights = usePracticeHighlights()

  const load = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    try {
      const data = await practiceApi.getSectionSession(sessionId)
      setSectionSession(data)
      if (searchParams.get("blindReview") !== "1") {
        setInitialCountdown(
          isSectionCountdownTiming(data.metadata.timing) ? SECTION_TIMER_SECONDS : null,
        )
      } else {
        setInitialCountdown(null)
      }
      const map: Record<string, QuestionAnswerState> = {}
      for (const a of data.answers) {
        map[a.questionId] = { selectedAnswer: a.selectedAnswer, isCorrect: a.isCorrect }
      }
      if (searchParams.get("blindReview") === "1" && sessionId) {
        const storageKey = `br-actual-${sessionId}`
        const stored = sessionStorage.getItem(storageKey)
        let actualMap: Record<string, QuestionAnswerState>
        if (stored) {
          try {
            actualMap = JSON.parse(stored) as Record<string, QuestionAnswerState>
          } catch {
            actualMap = map
            sessionStorage.setItem(storageKey, JSON.stringify(map))
          }
        } else {
          actualMap = map
          sessionStorage.setItem(storageKey, JSON.stringify(map))
        }
        setActualAnswersByQuestion(actualMap)
        setAnswersByQuestion(splitBlindReviewAnswersFromActual(map, actualMap))
        setQIndex(1)
      } else {
        const postBrActive =
          Boolean(data.session.completed_at) &&
          sectionPostBrActiveKey != null &&
          sessionStorage.getItem(sectionPostBrActiveKey) === "1"

        if (postBrActive) {
          const actualRaw = sectionPostBrActualKey ? sessionStorage.getItem(sectionPostBrActualKey) : null
          const actualAnswers = actualRaw ? (JSON.parse(actualRaw) as typeof map) : map
          setActualAnswersByQuestion(actualAnswers)
          const brRaw = sectionPostBrAnswersKey ? sessionStorage.getItem(sectionPostBrAnswersKey) : null
          const blindReviewAnswers = brRaw ? (JSON.parse(brRaw) as typeof map) : {}
          setAnswersByQuestion(blindReviewAnswers)
          setPostCompleteBlindReview(true)
          setAnswerViewTab("blind_review")
          const firstBlindUnanswered = data.questions.findIndex((q) => !blindReviewAnswers[q.id])
          setQIndex(firstBlindUnanswered >= 0 ? firstBlindUnanswered + 1 : 1)
        } else {
          setAnswersByQuestion(map)
          setActualAnswersByQuestion(map)
          setPostCompleteBlindReview(false)
          const firstUnanswered = data.questions.findIndex((q) => !map[q.id])
          setQIndex(firstUnanswered >= 0 ? firstUnanswered + 1 : 1)
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load section")
    } finally {
      setLoading(false)
    }
  }, [practiceApi, sessionId, setInitialCountdown, searchParams, sectionPostBrActiveKey, sectionPostBrActualKey, sectionPostBrAnswersKey])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const prepTestIdForSections =
      blindReviewPrepTestId ?? (postCompleteBlindReview ? searchParams.get("prepTestId") : null)
    if (!(blindReviewMode || postCompleteBlindReview) || !prepTestIdForSections) {
      setBlindReviewSections([])
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const detail = await practiceApi.getBlindReviewDetail(prepTestIdForSections)
        if (!cancelled) {
          setBlindReviewSections(
            detail.sections.filter((s) => s.practiceable && s.sectionSessionId),
          )
        }
      } catch {
        if (!cancelled) setBlindReviewSections([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [blindReviewMode, postCompleteBlindReview, blindReviewPrepTestId, searchParams, practiceApi])

  const prepTestFlowId = searchParams.get("prepTestId")

  function handleGoToSectionQuestions() {
    const params = new URLSearchParams(searchParams)
    params.set("started", "1")
    navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: true })
  }

  const questions = sectionSession?.questions ?? []
  const metadata = sectionSession?.metadata
  const timedSection = !blindReviewMode && isSectionCountdownTiming(metadata?.timing)
  const showAnswersMode = metadata?.showAnswers ?? "end"
  const sectionType = metadata?.sectionType ?? "LR"
  const questionIds = useMemo(() => questions.map((q) => q.id), [questions])
  const initialFlaggedIds = useMemo(
    () =>
      sectionSession?.metadata?.flaggedQuestionIds ??
      parseFlaggedQuestionIds(sectionSession?.session.metadata),
    [sectionSession?.metadata?.flaggedQuestionIds, sectionSession?.session.metadata],
  )
  const initialSeenIds = useMemo(
    () => sectionSession?.metadata?.seenQuestionIds ?? [],
    [sectionSession?.metadata?.seenQuestionIds],
  )
  const sessionCompleted = Boolean(sectionSession?.session.completed_at)

  useEffect(() => {
    if (
      timeUpTriggeredRef.current ||
      !prepTestFlowId ||
      !timedSection ||
      countdown !== 0 ||
      sessionCompleted ||
      blindReviewMode ||
      sectionIntroActive ||
      loading
    ) {
      return
    }
    timeUpTriggeredRef.current = true
    setTimeUpFlow({ step: "predict", predictedScore: null })
  }, [
    blindReviewMode,
    countdown,
    loading,
    prepTestFlowId,
    sectionIntroActive,
    sessionCompleted,
    timedSection,
  ])

  const sectionTimeUpSummary = useMemo(
    () =>
      buildPrepTestSectionTimeUpSummary({
        incorrectCount: countSectionIncorrect(questions, answersByQuestion),
      }),
    [answersByQuestion, questions],
  )

  const questionFlags = usePracticeQuestionFlags({
    sessionId: sessionId ?? "",
    questionIds,
    initialFlaggedIds,
    practiceApi,
    enabled: Boolean(sessionId) && !sessionCompleted && !blindReviewMode,
  })

  const safeIndex = Math.min(Math.max(qIndex, 1), Math.max(questions.length, 1))
  const current = questions[safeIndex - 1]

  usePracticeQuestionSeen({
    sessionId: sessionId ?? "",
    questionIds,
    initialSeenIds,
    activeQuestionId: current?.id ?? null,
    practiceApi,
    enabled: Boolean(sessionId) && !sessionCompleted && !blindReviewMode,
  })

  const displayAnswer = current
    ? blindReviewMode && answerViewTab === "actual"
      ? actualAnswersByQuestion[current.id]
      : answersByQuestion[current.id]
    : undefined
  const currentAnswer = displayAnswer
  const selectedIndex =
    current && currentAnswer
      ? choiceIndexFromAnswer(current.choices, currentAnswer.selectedAnswer)
      : null
  const revealed = blindReviewMode
    ? false
    : showAnswersMode === "each"
      ? Boolean(currentAnswer)
      : false
  const recommendedForBr = Boolean(
    current &&
      (!actualAnswersByQuestion[current.id] || actualAnswersByQuestion[current.id]?.isCorrect === false),
  )
  const editingBlindReviewAnswers =
    postCompleteBlindReview || !blindReviewMode || answerViewTab === "blind_review"

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
    if (blindReviewMode && !editingBlindReviewAnswers) return
    if (postCompleteBlindReview) {
      const choice = current.choices[index]
      if (!choice || selectedIndex === index) return
      const optimistic = { selectedAnswer: choice.id, isCorrect: false }
      setAnswersByQuestion((prev) => {
        const next = { ...prev, [current.id]: optimistic }
        if (sectionPostBrAnswersKey) {
          sessionStorage.setItem(sectionPostBrAnswersKey, JSON.stringify(next))
        }
        return next
      })
      return
    }
    if (!canChangePracticeAnswer(showAnswersMode, Boolean(currentAnswer), { blindReview: blindReviewMode })) {
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
        blindReview: blindReviewMode || undefined,
      })
      setAnswersByQuestion((prev) => ({
        ...prev,
        [current.id]: { selectedAnswer: event.selected_answer, isCorrect: event.is_correct },
      }))
      if (!blindReviewMode && showAnswersMode === "each") {
        window.setTimeout(() => {
          setQIndex((i) => Math.min(questions.length, i + 1))
        }, 600)
      }
    } catch (e) {
      if (!blindReviewMode) {
        setAnswersByQuestion((prev) => {
          const next = { ...prev }
          delete next[current.id]
          return next
        })
      }
      setError(e instanceof Error ? e.message : "Failed to submit answer")
    } finally {
      setSubmitting(false)
    }
  }

  function blindReviewSectionLabel(section: BlindReviewDetailSection): string {
    if (section.sectionNumber != null) return `Section ${section.sectionNumber}`
    if (section.title) return section.title
    return section.sectionType
  }

  const blindReviewSectionOptions = useMemo<BlindReviewSectionOption[]>(() => {
    const fromDetail = blindReviewSections
      .filter((s): s is BlindReviewDetailSection & { sectionSessionId: string } =>
        Boolean(s.sectionSessionId),
      )
      .map((section) => ({
        sectionSessionId: section.sectionSessionId,
        label: blindReviewSectionLabel(section),
        sectionNumber: section.sectionNumber,
      }))
    if (fromDetail.length > 0) return fromDetail
    if (!sessionId || !sectionSession) return []
    const sectionNumber = sectionSession.section.sectionNumber
    return [
      {
        sectionSessionId: sessionId,
        label: sectionNumber != null ? `Section ${sectionNumber}` : "Section",
        sectionNumber,
      },
    ]
  }, [blindReviewSections, sessionId, sectionSession])

  function navigateToBlindReviewSection(targetSessionId: string) {
    const prepTestId = blindReviewPrepTestId ?? prepTestFlowId
    if (!prepTestId || targetSessionId === sessionId) return
    if (blindReviewMode) {
      const q = new URLSearchParams({ blindReview: "1", prepTestId })
      navigate(`/app/practice/sections/session/${encodeURIComponent(targetSessionId)}?${q.toString()}`, {
        replace: true,
      })
      return
    }
    if (postCompleteBlindReview) {
      navigate(
        `/app/practice/sections/session/${encodeURIComponent(targetSessionId)}?${new URLSearchParams({ prepTestId }).toString()}`,
        { replace: true },
      )
    }
  }

  function resolveBlindReviewPrepTestId(): string | null {
    return (
      blindReviewPrepTestId ??
      prepTestFlowId ??
      sectionSession?.section.prepTestId ??
      null
    )
  }

  function blindReviewExitPath(): string {
    const prepTestId = resolveBlindReviewPrepTestId()
    if (prepTestId) {
      return `/app/practice/blind-review/${encodeURIComponent(prepTestId)}`
    }
    return "/app/practice/blind-review"
  }

  const unansweredCount = useMemo(
    () => questions.filter((q) => !answersByQuestion[q.id]).length,
    [questions, answersByQuestion],
  )

  const submitSectionMessage = useMemo(() => {
    if (postCompleteBlindReview) {
      if (unansweredCount > 0) {
        const noun = unansweredCount === 1 ? "question" : "questions"
        return `Finish blind review and view your results? You have ${unansweredCount} unanswered ${noun} in blind review.`
      }
      return "Finish blind review and view your results?"
    }
    if (blindReviewMode) {
      if (unansweredCount > 0) {
        const noun = unansweredCount === 1 ? "question" : "questions"
        return `Submit this section and return to blind review? You have ${unansweredCount} unanswered ${noun} in your blind review answers.`
      }
      return "Submit this section and return to blind review?"
    }
    if (unansweredCount > 0) {
      const noun = unansweredCount === 1 ? "question" : "questions"
      return `Are you sure you want to submit this section? You have ${unansweredCount} unanswered ${noun}.`
    }
    if (timedSection && countdown != null && countdown > 0) {
      return "Are you sure you want to submit this section? You still have time left on the timer."
    }
    return "Are you sure you want to submit this section?"
  }, [postCompleteBlindReview, blindReviewMode, unansweredCount, timedSection, countdown])

  function handleExitSession() {
    if (prepTestFlowId) {
      navigate(prepTestHubHref(prepTestFlowId, { retake: isRetakeAttempt }), { replace: true })
      return
    }
    navigate("/app/practice/sections", { replace: true })
  }

  async function handleConfirmSubmitSection(options?: { showWellDoneAfterTimeUp?: boolean }) {
    if (!sessionId) return
    if (postCompleteBlindReview) {
      setSubmitModalOpen(false)
      await viewSectionResults()
      return
    }
    if (blindReviewMode) {
      setSubmitModalOpen(false)
      navigate(blindReviewExitPath(), { replace: true })
      return
    }
    setFinishing(true)
    setError(null)
    try {
      const completed = await practiceApi.completeSession(sessionId)
      setSectionSession((prev) => (prev ? { ...prev, session: completed } : prev))
      setSubmitModalOpen(false)

      if (prepTestFlowId) {
        const detail = await practiceApi.getPrepTestDetail(prepTestFlowId)
        if (detail.allPracticeableSectionsComplete) {
          const ptCompleted = await practiceApi.completePrepTest(prepTestFlowId)
          const questionCount = detail.prepTest.questionCount > 0 ? detail.prepTest.questionCount : 1
          setCompleteModal({
            rawScore: ptCompleted.raw_score ?? 0,
            questionCount,
            scaledScore: ptCompleted.scaled_score,
            prepTestLabel: detail.prepTest.label,
            prepTestSessionId: ptCompleted.id,
            flow: "preptest",
          })
          setScoreHidden(true)
          return
        }
        const afterSectionId = resolvePrepTestBreakAfterSectionId(
          detail,
          sectionSession?.session.section_id,
          sectionSession?.section.id,
        )
        if (options?.showWellDoneAfterTimeUp) {
          if (afterSectionId) {
            writeStoredSectionBreak(prepTestFlowId, afterSectionId)
          }
          const questionCount = questions.length > 0 ? questions.length : 1
          const sectionLabel =
            sectionSession?.sessionLabel ??
            sectionSession?.metadata?.sectionTitle ??
            "the section"
          setCompleteModal({
            rawScore: completed.raw_score ?? 0,
            questionCount,
            prepTestLabel: sectionLabel,
            afterSectionId: afterSectionId ?? null,
            flow: "preptest-section",
          })
          setScoreHidden(true)
          return
        }
        if (afterSectionId) {
          writeStoredSectionBreak(prepTestFlowId, afterSectionId)
        }
        navigate(prepTestHubHref(prepTestFlowId, { retake: isRetakeAttempt }), {
          replace: true,
          state: afterSectionId ? { sectionJustCompleted: afterSectionId } : undefined,
        })
        return
      }

      const questionCount = questions.length > 0 ? questions.length : 1
      const sectionLabel =
        sectionSession?.sessionLabel ??
        sectionSession?.metadata?.sectionTitle ??
        "the section"
      setCompleteModal({
        rawScore: completed.raw_score ?? 0,
        questionCount,
        prepTestLabel: sectionLabel,
        flow: "standalone",
      })
      setScoreHidden(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete section")
    } finally {
      setFinishing(false)
    }
  }

  function handleTimeUpPredictedScoreChange(score: number | null) {
    setTimeUpFlow((prev) => (prev ? { ...prev, predictedScore: score } : null))
  }

  function handleTimeUpSkip() {
    setTimeUpFlow((prev) => (prev ? { ...prev, step: "done" } : null))
  }

  async function handleTimeUpContinue() {
    if (!sessionId) return
    if (timeUpFlow?.predictedScore != null) {
      storePrepTestSectionScorePrediction(sessionId, timeUpFlow.predictedScore)
    }
    setTimeUpFlow(null)
    await handleConfirmSubmitSection({ showWellDoneAfterTimeUp: true })
  }

  function continuePrepTestSectionComplete() {
    const afterSectionId = completeModal?.afterSectionId
    const testId = prepTestFlowId
    setCompleteModal(null)
    if (!testId) return
    navigate(prepTestHubHref(testId, { retake: isRetakeAttempt }), {
      replace: true,
      state: afterSectionId ? { sectionJustCompleted: afterSectionId } : undefined,
    })
  }

  function leavePrepTestComplete() {
    navigate(PREPTEST_LIST_HREF, { replace: true })
  }

  function effectivePrepTestId(): string | null {
    return prepTestFlowId
  }

  async function enterPrepTestBlindReview() {
    const testId = effectivePrepTestId()
    if (!testId || startingBlindReview) return
    setStartingBlindReview(true)
    setError(null)
    try {
      await practiceApi.startBlindReview(testId)
      const detail = await practiceApi.getBlindReviewDetail(testId)
      const firstSessionId = firstBlindReviewSectionSessionId(detail)
      if (!firstSessionId) {
        throw new Error("No sections available for blind review")
      }
      setCompleteModal(null)
      const targetPath = blindReviewSectionSessionPath(testId, firstSessionId)
      if (sessionId && firstSessionId === sessionId) {
        navigate(`/app/practice/blind-review/${encodeURIComponent(testId)}`, { replace: true })
        return
      }
      navigate(targetPath, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start blind review")
    } finally {
      setStartingBlindReview(false)
    }
  }

  async function viewPrepTestResults() {
    const testId = effectivePrepTestId()
    const resultsSessionId = completeModal?.prepTestSessionId
    if (!testId || !resultsSessionId) return
    await skipBlindReviewBestEffort(practiceApi, testId)
    setCompleteModal(null)
    navigate(prepTestResultsPath(resultsSessionId), { replace: true })
  }

  if (!sessionId) {
    return (
      <StudentMain layout="immersive">
        <p className="text-sm text-red-600">Missing section session.</p>
        <Link to="/app/practice/sections" className="mt-2 text-sm font-semibold text-[#0d47a1] hover:underline">
          Back to sections
        </Link>
      </StudentMain>
    )
  }

  if (loading) {
    const showImmersiveLoader = Boolean(searchParams.get("prepTestId")) && searchParams.get("blindReview") !== "1"
    return (
      <StudentMain layout="immersive" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {showImmersiveLoader ? (
          <PracticeSessionImmersiveFrame>
            <StudentPageLoader centered className="min-h-full flex-1" label="Loading section…" />
          </PracticeSessionImmersiveFrame>
        ) : (
          <StudentPageLoader centered label="Loading section…" />
        )}
      </StudentMain>
    )
  }

  if (error && !sectionSession) {
    return (
      <StudentMain layout="immersive">
        <p className="text-sm text-red-600">{error}</p>
        <Link to="/app/practice/sections" className="mt-2 text-sm font-semibold text-[#0d47a1] hover:underline">
          Back to sections
        </Link>
      </StudentMain>
    )
  }

  if (sectionIntroActive && sectionSession && questions.length > 0) {
    const introHeaderLabel = prepTestHeaderLabel(
      sectionSession.section.moduleId ?? null,
      sectionSession.section.prepTestTitle ?? null,
    )
    const introTimerBudgetSeconds = resolveTimerBudgetSeconds({
      timing: metadata?.timing,
      questionCount: questions.length,
      sectionTimerSeconds: timedSection ? SECTION_TIMER_SECONDS : undefined,
    })
    const introTimerLabel = timedSection ? "Time Left:" : "Elapsed"
    const introTimerDisplaySeconds = timedSection ? introTimerBudgetSeconds : elapsed
    const introTimerProgress = timedSection ? 1 : computeElapsedTimerProgress(elapsed, introTimerBudgetSeconds)
    const introCloseButton = (
      <button
        type="button"
        className="inline-flex size-[52px] shrink-0 items-center justify-center rounded-[16px] border border-[#dfe1e7] bg-[#f6f8fa] text-[#666d80] transition-colors hover:bg-[#eceff3] hover:text-[#062357]"
        aria-label="Close section introduction"
        onClick={handleExitSession}
      >
        <X className="size-5" strokeWidth={2} aria-hidden />
      </button>
    )

    return (
      <StudentMain
        layout="immersive"
        className="flex min-h-0 max-w-none flex-1 flex-col overflow-hidden bg-[color-mix(in_srgb,var(--color-student-accent)_6%,var(--greyscale-25))] px-0 py-4 md:py-5"
      >
        <div
          className="fixed inset-0 z-[100] flex min-h-0 items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-[3px] md:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="PrepTest section introduction"
        >
          <PracticePrepTestSectionIntroFrame
            header={
              <PracticeSectionIntroHeader
                title={introHeaderLabel}
                fontScale={highlights.fontScale}
                toolMode={highlights.toolMode}
                onFontSize={highlights.cycleFontSize}
                onLineSpacing={highlights.cycleLineSpacing}
                onUnderline={highlights.selectUnderline}
                timerLabel={introTimerLabel}
                timerDisplaySeconds={introTimerDisplaySeconds}
                timerProgress={introTimerProgress}
                closeButton={introCloseButton}
              />
            }
          >
            <PracticePrepTestSectionIntroPanel
              sectionNumber={sectionSession.section.sectionNumber ?? null}
              sectionType={sectionType}
              questionCount={questions.length}
              timeMinutes={
                isUnlimitedPracticeTiming(metadata?.timing)
                  ? null
                  : (sectionSession.section.timeMinutes ?? 35)
              }
              onGoToQuestions={handleGoToSectionQuestions}
            />
          </PracticePrepTestSectionIntroFrame>
        </div>

      </StudentMain>
    )
  }

  if (!current || questions.length === 0) {
    return (
      <StudentMain layout="immersive">
        <p className="text-sm text-muted-foreground">This section has no questions.</p>
        <Link to="/app/practice/sections" className="mt-2 text-sm font-semibold text-[#0d47a1] hover:underline">
          Back to sections
        </Link>
      </StudentMain>
    )
  }

  const headerLabel =
    sectionSession?.sessionLabel ||
    [metadata?.prepTestTitle, metadata?.sectionTitle].filter(Boolean).join(" — ") ||
    (sectionType === "LR" ? "LR Section" : "RC Section")

  const timerBudgetSeconds = resolveTimerBudgetSeconds({
    timing: metadata?.timing,
    questionCount: questions.length,
    sectionTimerSeconds: timedSection ? SECTION_TIMER_SECONDS : undefined,
  })
  const timerLabel = timedSection && countdown != null ? "Remaining" : "Elapsed"
  const timerDisplaySeconds =
    timedSection && countdown != null ? countdown : elapsed
  const timerProgress =
    timedSection && countdown != null
      ? computeRemainingTimerProgress(countdown, timerBudgetSeconds)
      : computeElapsedTimerProgress(elapsed, timerBudgetSeconds)
  const allowReselect =
    (postCompleteBlindReview || editingBlindReviewAnswers) &&
    canChangePracticeAnswer(showAnswersMode, Boolean(currentAnswer), {
      blindReview: blindReviewMode || postCompleteBlindReview,
    })

  const useBlindReviewLayout = blindReviewMode || postCompleteBlindReview
  const useActiveDrillLayout = !useBlindReviewLayout
  const sessionVariant: PracticeSessionVariant = useBlindReviewLayout
    ? "blind-review"
    : useActiveDrillLayout
      ? "active-drill"
      : "default"
  const prepTestLabel = prepTestHeaderLabel(
    sectionSession?.section.moduleId ?? null,
    metadata?.prepTestTitle ?? sectionSession?.section.prepTestTitle ?? null,
  )
  const sessionHeaderTitle = prepTestLabel !== "PrepTest" ? prepTestLabel : headerLabel

  function handleBlindReviewExit() {
    if (blindReviewMode) {
      navigate(blindReviewExitPath(), { replace: true })
      return
    }
    if (postCompleteBlindReview) {
      setSubmitModalOpen(true)
    }
  }

  const finishButton = useBlindReviewLayout ? null : (
    <PracticeSessionFinishMenu
      disabled={sessionCompleted && !postCompleteBlindReview}
      finishing={finishing}
      submitLabel={postCompleteBlindReview ? "Finish Blind Review" : undefined}
      buttonClassName={
        useActiveDrillLayout ? ACTIVE_DRILL_FINISH_BUTTON_CLASS : SESSION_FINISH_BUTTON_CLASS
      }
      onSubmitSection={() => setSubmitModalOpen(true)}
      onExit={handleExitSession}
    />
  )

  const questionRefLabel = (() => {
    const ptNum =
      sectionSession?.section.moduleId?.replace(/^LSAC/i, "") ??
      sectionSession?.section.prepTestId ??
      "—"
    const secNum = sectionSession?.section.sectionNumber ?? 1
    return `PT${ptNum}.S${secNum}.Q${safeIndex}`
  })()
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

  const blindReviewHeader = useBlindReviewLayout ? (
    <PracticeBlindReviewSessionHeader
      prepTestLabel={prepTestLabel}
      sectionOptions={blindReviewSectionOptions}
      activeSectionSessionId={sessionId ?? null}
      onSelectSection={navigateToBlindReviewSection}
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
      onExitSection={handleBlindReviewExit}
      exiting={finishing}
      showSectionSelect={blindReviewMode && blindReviewSectionOptions.length > 1}
      exitButtonLabel={postCompleteBlindReview ? "Finish Section" : "Exit Section"}
      exitingLabel={postCompleteBlindReview ? "Finishing…" : "Exiting…"}
    />
  ) : null

  const sessionInnerContent = (
    <>
      <div
        className={cn(
          useBlindReviewLayout
            ? BLIND_REVIEW_BODY_CLASS
            : "practice-session-body flex min-h-0 flex-1 flex-col overflow-hidden",
          timeUpFlow != null && "practice-session-body--scroll-locked",
        )}
      >
        {showNotesPanel && useBlindReviewLayout ? (
          <div className={BLIND_REVIEW_NOTES_LAYOUT_CLASS}>
            <div className={BLIND_REVIEW_NOTES_STACK_CLASS}>
              <div ref={passagePaneRef} className={BLIND_REVIEW_NOTES_PASSAGE_PANEL_CLASS}>
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
                  className={BLIND_REVIEW_PASSAGE_TEXT_CLASS}
                />
              </div>
              <div ref={questionPaneRef} className={BLIND_REVIEW_NOTES_QUESTION_PANEL_CLASS}>
                <SectionQuestionPanel
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
                  blindReviewChrome={useBlindReviewLayout}
                  answerView={answerViewTab}
                  onAnswerViewChange={handleAnswerViewChange}
                  recommendedForBr={recommendedForBr}
                  variant={sessionVariant}
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
              cn(
                useBlindReviewLayout
                  ? BLIND_REVIEW_BODY_GRID_CLASS
                  : useActiveDrillLayout
                    ? "px-[23px] pt-[23px] lg:grid-cols-[524px_minmax(0,680px)] lg:gap-7"
                    : "lg:grid-cols-2 lg:divide-x divide-[#dfe1e7]",
              ),
            )}
            style={highlights.contentStyle}
          >
            <div
              ref={passagePaneRef}
              className={cn(
                "practice-session-pane min-h-0",
                useBlindReviewLayout
                  ? BLIND_REVIEW_PASSAGE_PANEL_CLASS
                  : useActiveDrillLayout
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
                className={
                  useBlindReviewLayout
                    ? BLIND_REVIEW_PASSAGE_TEXT_CLASS
                    : useActiveDrillLayout
                      ? "text-lg leading-[1.5] text-[#0d0d12]"
                      : undefined
                }
              />
            </div>
            <div
              ref={questionPaneRef}
              className={cn(
                "practice-session-pane min-h-0",
                useBlindReviewLayout
                  ? BLIND_REVIEW_QUESTION_PANEL_CLASS
                  : useActiveDrillLayout
                    ? "rounded-2xl bg-white"
                    : "gap-4 border-[#dfe1e7] p-5",
              )}
            >
              <SectionQuestionPanel
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
                blindReviewChrome={useBlindReviewLayout}
                answerView={answerViewTab}
                onAnswerViewChange={handleAnswerViewChange}
                recommendedForBr={recommendedForBr}
                variant={sessionVariant}
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
            : useActiveDrillLayout
              ? ACTIVE_DRILL_FOOTER_CLASS
              : "flex shrink-0 items-center justify-between gap-3 border-t border-[#dfe1e7] bg-background px-6 py-3 md:gap-4 md:px-6",
        )}
      >
        {useActiveDrillLayout ? (
          <div className={ACTIVE_DRILL_FOOTER_ROW_CLASS}>
            <div className="practice-session-question-nav-grid min-h-[48px] min-w-0 flex-1">
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
            <div className={ACTIVE_DRILL_NAV_ARROW_GROUP_CLASS}>
              <PracticeSessionNavArrowButton
                direction="prev"
                disabled={safeIndex <= 1}
                onClick={() => setQIndex((i) => Math.max(1, i - 1))}
              />
              <PracticeSessionNavArrowButton
                direction="next"
                disabled={safeIndex >= questions.length}
                onClick={() => setQIndex((i) => Math.min(questions.length, i + 1))}
              />
            </div>
          </div>
        ) : useBlindReviewLayout ? (
          <div className={BLIND_REVIEW_FOOTER_ROW_CLASS}>
            <div className={BLIND_REVIEW_FOOTER_NAV_CLASS}>
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
            <div className={BLIND_REVIEW_NAV_ARROW_GROUP_CLASS}>
              <PracticeSessionNavArrowButton
                direction="prev"
                disabled={safeIndex <= 1}
                className={BLIND_REVIEW_NAV_ARROW_BUTTON_CLASS}
                onClick={() => setQIndex((i) => Math.max(1, i - 1))}
              />
              <PracticeSessionNavArrowButton
                direction="next"
                disabled={safeIndex >= questions.length}
                className={BLIND_REVIEW_NAV_ARROW_BUTTON_CLASS}
                onClick={() => setQIndex((i) => Math.min(questions.length, i + 1))}
              />
            </div>
          </div>
        ) : (
          <>
        <div className="practice-session-scroll-hidden flex min-h-0 min-w-0 flex-1 flex-nowrap items-stretch gap-1.5 overflow-x-auto overflow-y-hidden pb-0.5 pt-2.5 sm:gap-2">
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
          title={sessionHeaderTitle}
          titleClassName={useActiveDrillLayout ? "!text-[20px]" : undefined}
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
          onToggleTimerPause={togglePause}
          onResetTimer={
            useActiveDrillLayout || prepTestFlowId || blindReviewMode || timedSection
              ? undefined
              : resetElapsed
          }
          timerProgress={timerProgress}
          timerDisplayClassName={timedSection && countdown === 0 ? "text-[#df1c41]" : undefined}
          showTimer
          finishButton={finishButton}
        />
      ) : null}
      {sessionInnerContent}
    </>
  )

  return (
    <StudentMain
      layout="immersive"
      className={cn(
        "flex min-h-0 max-w-none flex-1 flex-col overflow-hidden",
        useBlindReviewLayout
          ? "h-full bg-[#f5f9ff]"
          : !useActiveDrillLayout &&
              "bg-[color-mix(in_srgb,var(--color-student-accent)_6%,var(--greyscale-25))] px-0 py-4 md:py-5",
      )}
    >
      {useBlindReviewLayout ? (
        <div className={BLIND_REVIEW_SHELL_CLASS}>
          {error ? (
            <p className="absolute left-4 right-4 top-0 z-20 text-sm text-red-600 md:left-6 md:right-6" role="alert">
              {error}
            </p>
          ) : null}
          {blindReviewHeader}
          <div
            className={BLIND_REVIEW_CARD_CLASS}
            style={{ maxWidth: showNotesPanel ? 1440 : 1280 }}
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
              "practice-session-card practice-session-card--active-drill flex h-full min-h-0 w-full flex-col rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]",
              timeUpFlow != null && "overflow-hidden",
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
          <div className="practice-session-card flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border border-[#dfe1e7] bg-background shadow-[0px_1px_1.5px_rgba(13,13,18,0.05)]">
            {sessionCardContent}
          </div>
        </div>
      )}

      <PracticeSubmitSectionModal
        open={submitModalOpen}
        title={submitModalTitle}
        confirmLabel={submitModalConfirmLabel}
        message={submitSectionMessage}
        submitting={finishing}
        onCancel={() => setSubmitModalOpen(false)}
        onConfirm={() => void handleConfirmSubmitSection()}
      />

      <PracticePrepTestSectionTimeUpModal
        open={timeUpFlow != null}
        step={timeUpFlow?.step ?? "predict"}
        summary={sectionTimeUpSummary}
        predictedScore={timeUpFlow?.predictedScore ?? null}
        continuing={finishing}
        onPredictedScoreChange={handleTimeUpPredictedScoreChange}
        onSkip={handleTimeUpSkip}
        onContinue={() => void handleTimeUpContinue()}
      />

      <PracticeCompleteModal
        open={completeModal != null}
        titleId={
          completeModal?.flow === "standalone" || completeModal?.flow === "preptest-section"
            ? "section-complete-title"
            : "preptest-complete-title"
        }
        subtitle={
          completeModal?.flow === "standalone" || completeModal?.flow === "preptest-section"
            ? "You've completed the section"
            : `You've completed ${completeModal?.prepTestLabel ?? "the PrepTest"}`
        }
        rawScore={completeModal?.rawScore ?? 0}
        questionCount={completeModal?.questionCount ?? 1}
        scaledScore={completeModal?.scaledScore}
        scoreHidden={scoreHidden}
        onToggleScoreHidden={() => setScoreHidden((h) => !h)}
        showBlindReview
        onBlindReview={() => {
          if (completeModal?.flow === "standalone" || completeModal?.flow === "preptest-section") {
            startPostCompleteBlindReview()
            return
          }
          void enterPrepTestBlindReview()
        }}
        onSkipDetails={() => {
          if (completeModal?.flow === "standalone" || completeModal?.flow === "preptest-section") {
            void viewSectionResults()
            return
          }
          void viewPrepTestResults()
        }}
        doneLabel={
          completeModal?.flow === "preptest-section"
            ? "Return to PrepTest"
            : completeModal?.flow === "standalone"
              ? "Done"
              : "Done with PrepTest"
        }
        onDone={
          completeModal?.flow === "preptest-section"
            ? continuePrepTestSectionComplete
            : completeModal?.flow === "standalone"
              ? leaveSectionComplete
              : leavePrepTestComplete
        }
      />
    </StudentMain>
  )
}

export { SectionSessionPage }
