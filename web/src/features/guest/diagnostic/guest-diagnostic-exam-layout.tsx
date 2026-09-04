import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { X } from "lucide-react"

import {
  buildGuestDiagnosticAnswerState,
} from "@/features/guest/diagnostic/guest-diagnostic-answer-state"
import type { GuestDiagnosticAnswerState } from "@/features/guest/diagnostic/guest-diagnostic-exam-utils"
import {
  choiceIndexFromAnswer,
  resolveGuestDiagnosticPassageHtml,
} from "@/features/guest/diagnostic/guest-diagnostic-exam-utils"
import { GuestDiagnosticSubmitModal } from "@/features/guest/diagnostic/guest-diagnostic-submit-modal"
import type { GuestDiagnosticTestConfig } from "@/features/guest/diagnostic/guest-diagnostic-test-config"
import {
  ACTIVE_DRILL_BODY_GRID_CLASS,
  ACTIVE_DRILL_FINISH_BUTTON_CLASS,
  ACTIVE_DRILL_FOOTER_CLASS,
  ACTIVE_DRILL_PASSAGE_PANE_CLASS,
  ACTIVE_DRILL_PASSAGE_TEXT_CLASS,
  ACTIVE_DRILL_QUESTION_PANE_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
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
import {
  PracticeBlindReviewSessionHeader,
  type PracticeReviewSidePanel,
} from "@/features/student/practice-session/practice-blind-review-session-header"
import type {
  BlindReviewAnswerOutcome,
  BlindReviewAnswerView,
} from "@/features/student/practice-session/practice-blind-review-answer-toggle"
import { PracticeDrillQuestionPanel, regionKey } from "@/features/student/practice-session/practice-drill-question-panel"
import { ResponseMaskingProvider } from "@/features/student/practice-session/use-response-masking"
import { PracticeSessionAccessibilityPanel } from "@/features/student/practice-session/practice-session-accessibility-panel"
import { PracticeSessionFinishMenu } from "@/features/student/practice-session/practice-session-finish-menu"
import { PracticeSessionHeader } from "@/features/student/practice-session/practice-session-header"
import { PracticeSessionNavArrowButton } from "@/features/student/practice-session/practice-session-nav-arrow-button"
import { PracticeSessionPauseModal } from "@/features/student/practice-session/practice-session-pause-modal"
import { PracticeSessionQuestionNavStrip } from "@/features/student/practice-session/practice-session-question-nav-strip"
import { resolvePracticeSessionQuestionNavOutcome } from "@/features/student/practice-session/practice-session-question-nav-outcome"
import { PracticeSessionReviewPanel } from "@/features/student/practice-session/practice-session-review-panel"
import { PracticeSessionReviewSidePanel } from "@/features/student/practice-session/practice-session-review-side-panel"
import {
  BLIND_REVIEW_PASSAGE_TEXT_CLASS,
  REVIEW_BODY_CLASS,
  REVIEW_BODY_GRID_FULL_CLASS,
  REVIEW_CARD_CLASS,
  REVIEW_EXIT_BUTTON_CLASS,
  REVIEW_FOOTER_CLASS,
  REVIEW_FOOTER_NAV_CLASS,
  REVIEW_FOOTER_ROW_CLASS,
  REVIEW_NAV_ARROW_BUTTON_CLASS,
  REVIEW_NAV_ARROW_GROUP_CLASS,
  REVIEW_PASSAGE_PANEL_CLASS,
  REVIEW_QUESTION_PANEL_CLASS,
  REVIEW_SHELL_CLASS,
  REVIEW_SIDE_PANEL_LAYOUT_FULL_CLASS,
} from "@/features/student/practice-session/practice-session-blind-review-styles"
import { difficultyLabelFromLevel } from "@/features/student/practice-session/practice-results-ui"
import type { DrillQuestion } from "@/features/student/drills/drill-types"
import type { ExplanationQuestionDetailView } from "@/features/student/explanation-detail/types"
import { resolveAnswerPopularityRows } from "@/features/student/explanation-detail/answer-popularity-rows"
import { usePracticeSessionAccessibilityPanel } from "@/features/student/practice-session/use-practice-session-accessibility-panel"
import { usePracticeHighlights } from "@/features/student/practice-session/use-practice-highlights"
import { isOfficialLayout, resolveExamSessionVariant } from "@/features/student/practice-session/practice-session-types"
import { useExamFullscreen, useOfficialInterfacePreference } from "@/features/student/practice-session/use-official-interface"
import { toggleFlaggedId } from "@/features/student/practice-session/practice-question-flags"
import { usePracticeSessionPauseModal } from "@/features/student/practice-session/use-practice-session-pause-modal"
import {
  computeRemainingTimerProgress,
  usePracticeSessionTimer,
} from "@/features/student/practice-session/use-practice-session-timer"
import {
  createDiagnosticQuestions,
  getDiagnosticExplanationHtml,
  getDiagnosticQuestionMeta,
} from "@/features/guest/diagnostic/mini-diagnostic-content"
import { canShowDiagnosticExplanation } from "@/features/guest/diagnostic/diagnostic-explanation-access"
import { HtmlContent } from "@/lib/html/html-content"
import { cn } from "@/lib/utils"

type GuestDiagnosticExamMode = "exam" | "review" | "tester"

type GuestDiagnosticExamLayoutProps = {
  config: GuestDiagnosticTestConfig
  interactive?: boolean
  className?: string
  /** exam = timed attempt; review = locked answers + explanations; tester = re-answer with reveal */
  mode?: GuestDiagnosticExamMode
  initialAnswers?: Record<string, GuestDiagnosticAnswerState>
  /** Premium unlocks all explanations on review/tester; free uses teaser limits. */
  hasActiveCore?: boolean
  onSubmitted?: (
    answersByQuestion: Record<string, GuestDiagnosticAnswerState>,
    timeSpentByQuestion: Record<string, number>,
  ) => void
  onExitReview?: () => void
}

const GUEST_DIAGNOSTIC_ANSWERS_STORAGE_PREFIX = "guestDiagnosticAnswers:"

function readPersistedAnswers(intentId: string): Record<string, GuestDiagnosticAnswerState> {
  if (typeof window === "undefined") return {}
  const raw = sessionStorage.getItem(`${GUEST_DIAGNOSTIC_ANSWERS_STORAGE_PREFIX}${intentId}`)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, GuestDiagnosticAnswerState>
  } catch {
    return {}
  }
}

function persistAnswers(intentId: string, answers: Record<string, GuestDiagnosticAnswerState>): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(`${GUEST_DIAGNOSTIC_ANSWERS_STORAGE_PREFIX}${intentId}`, JSON.stringify(answers))
}

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

function answerOutcome(answer: GuestDiagnosticAnswerState | undefined): BlindReviewAnswerOutcome {
  if (!answer) return "unanswered"
  return answer.isCorrect ? "correct" : "incorrect"
}

function difficultyTone(level: number): "green" | "teal" | "red" {
  if (level >= 4) return "red"
  if (level >= 3) return "teal"
  return "green"
}

function buildDiagnosticAnalyticsSeed(
  question: DrillQuestion,
  meta: { difficulty: number; questionType: string } | null,
  selectedAnswer: string | null | undefined,
): ExplanationQuestionDetailView["analytics"] {
  const diffLevel = meta?.difficulty ?? 3
  const label = difficultyLabelFromLevel(diffLevel)
  const correctChoiceId = question.correctChoiceId ?? ""
  const answerPopularity = resolveAnswerPopularityRows([], question.choices, correctChoiceId)
  const letter = selectedAnswer?.trim().toUpperCase().slice(0, 1) ?? ""
  const questionLabel = label === "Hardest" ? "Hard" : label

  return {
    questionDifficulty: {
      filled: diffLevel,
      max: 5,
      label: questionLabel,
      caption: "Question difficulty based on diagnostic design.",
      tone: difficultyTone(diffLevel),
    },
    // Diagnostic is LR-only — no multi-question passage difficulty.
    scoreBand: {
      headline: "—",
      range: "—",
      caption: "Score of students with a 50% chance of getting this right",
    },
    answerPopularity,
    answerPopularityTotal: 0,
    userSelectedLetter: /^[A-E]$/.test(letter) ? letter : null,
    questionStemTags: meta?.questionType ? [meta.questionType] : [],
    passageTags: [],
    history: [],
  }
}

/** Figma header `20268:105580` / footer `20268:107659` — LSAT default exam chrome (fixed header + footer; content swaps). */
function GuestDiagnosticExamLayout({
  config,
  interactive = false,
  className,
  mode = "exam",
  initialAnswers,
  hasActiveCore = false,
  onSubmitted,
  onExitReview,
}: GuestDiagnosticExamLayoutProps) {
  const navigate = useNavigate()
  const sessionBodyRef = useRef<HTMLDivElement>(null)
  const passagePaneRef = useRef<HTMLDivElement>(null)
  const questionPaneRef = useRef<HTMLDivElement>(null)
  const timerInitializedRef = useRef(false)
  const questionStartedAtRef = useRef<number>(Date.now())
  const timeSpentByQuestionRef = useRef<Record<string, number>>({})
  const lastQuestionIdRef = useRef<string | null>(null)

  const isReviewMode = mode === "review"
  const isTesterMode = mode === "tester"
  const isPostResultsMode = isReviewMode || isTesterMode
  const canNavigate = interactive || isPostResultsMode
  const canSelectAnswers = (interactive && mode === "exam") || isTesterMode

  const [qIndex, setQIndex] = useState(1)
  const [findQuery, setFindQuery] = useState("")
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false)
  const [passageOnlyView, setPassageOnlyView] = useState(false)
  const [lineFocus, setLineFocus] = useState(false)
  const { officialInterface, setOfficialInterface } = useOfficialInterfacePreference()
  const { isFullscreen, toggleExamFullscreen } = useExamFullscreen()
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [revealedByQuestion, setRevealedByQuestion] = useState<Record<string, boolean>>({})
  const [answerViewTab, setAnswerViewTab] = useState<BlindReviewAnswerView>("clean")
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false)
  const [reviewSidePanel, setReviewSidePanel] = useState<PracticeReviewSidePanel>(null)
  const [answersByQuestion, setAnswersByQuestion] = useState<Record<string, GuestDiagnosticAnswerState>>(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) return initialAnswers
    if (isPostResultsMode) return {}
    return readPersistedAnswers(config.intentId)
  })

  const scoredAnswersByQuestion = useMemo(
    () => (initialAnswers && Object.keys(initialAnswers).length > 0 ? initialAnswers : answersByQuestion),
    [initialAnswers, answersByQuestion],
  )

  const questions = useMemo(
    () => createDiagnosticQuestions(config.intentId),
    [config.intentId],
  )
  const current = questions[qIndex - 1] ?? questions[0]
  const safeIndex = Math.min(Math.max(qIndex, 1), questions.length)
  const timerBudgetSeconds = config.timeMinutes * 60

  const { countdown, paused, pauseTimer, resumeTimer, setInitialCountdown } = usePracticeSessionTimer({
    enabled: interactive && mode === "exam",
  })
  const pauseModal = usePracticeSessionPauseModal(pauseTimer, resumeTimer)
  const timerDisplaySeconds = countdown ?? timerBudgetSeconds
  const timerProgress = computeRemainingTimerProgress(timerDisplaySeconds, timerBudgetSeconds)

  const highlights = usePracticeHighlights()
  const accessibilityPanel = usePracticeSessionAccessibilityPanel(
    highlights.accessibilitySettings,
    highlights.applyAccessibilitySettings,
  )

  const [flaggedIds, setFlaggedIds] = useState<string[]>([])
  const flaggedSet = useMemo(() => new Set(flaggedIds), [flaggedIds])
  const isFlagged = useCallback((questionId: string) => flaggedSet.has(questionId), [flaggedSet])
  const toggleFlag = useCallback((questionId: string) => {
    setFlaggedIds((prev) => toggleFlaggedId(prev, questionId))
  }, [])

  const currentAnswer = current ? answersByQuestion[current.id] : undefined
  const scoredAnswer = current ? scoredAnswersByQuestion[current.id] : undefined
  const selectedIndex =
    current && currentAnswer ? choiceIndexFromAnswer(current.choices, currentAnswer.selectedAnswer) : null
  const questionRevealed =
    isReviewMode || (isTesterMode && Boolean(current && revealedByQuestion[current.id]))
  const explanationUnlocked = canShowDiagnosticExplanation({
    intentId: config.intentId,
    questionNumber: safeIndex,
    hasActiveCore,
  })
  const explanationHtml =
    current && explanationUnlocked
      ? getDiagnosticExplanationHtml(current.id, config.intentId)
      : null
  const questionMeta = current ? getDiagnosticQuestionMeta(current.id, config.intentId) : null
  const actualOutcome = answerOutcome(isReviewMode ? scoredAnswer : currentAnswer)
  const showInsightsPanel = isPostResultsMode && reviewSidePanel === "insights"
  const analyticsSeed = useMemo(() => {
    if (!current) return null
    return buildDiagnosticAnalyticsSeed(
      current,
      questionMeta,
      (isReviewMode ? scoredAnswer : currentAnswer)?.selectedAnswer,
    )
  }, [current, questionMeta, isReviewMode, scoredAnswer, currentAnswer])

  const passageKey = current ? regionKey(current.id, "passage") : ""
  const passageBody = current?.stimulusText ?? ""
  const passageHtml = resolveGuestDiagnosticPassageHtml(highlights.getRegionHtml, passageKey, passageBody)

  const accrueTimeForQuestion = useCallback((questionId: string | null) => {
    if (!questionId || mode !== "exam") return
    const elapsedSec = Math.max(0, (Date.now() - questionStartedAtRef.current) / 1000)
    timeSpentByQuestionRef.current[questionId] =
      (timeSpentByQuestionRef.current[questionId] ?? 0) + elapsedSec
    questionStartedAtRef.current = Date.now()
  }, [mode])

  useEffect(() => {
    if (!interactive || mode !== "exam" || timerInitializedRef.current) return
    setInitialCountdown(timerBudgetSeconds)
    timerInitializedRef.current = true
  }, [interactive, mode, setInitialCountdown, timerBudgetSeconds])

  useEffect(() => {
    if (isPostResultsMode) return
    persistAnswers(config.intentId, answersByQuestion)
  }, [answersByQuestion, config.intentId, isPostResultsMode])

  useEffect(() => {
    const nextId = current?.id ?? null
    if (lastQuestionIdRef.current && lastQuestionIdRef.current !== nextId) {
      accrueTimeForQuestion(lastQuestionIdRef.current)
    }
    lastQuestionIdRef.current = nextId
    questionStartedAtRef.current = Date.now()
  }, [accrueTimeForQuestion, current?.id])

  useEffect(() => {
    passagePaneRef.current?.scrollTo({ top: 0 })
    questionPaneRef.current?.scrollTo({ top: 0 })
  }, [safeIndex, current?.id])

  useEffect(() => {
    if (!findQuery.trim()) return
    const pane = passagePaneRef.current ?? questionPaneRef.current
    if (!pane) return
    const mark = pane.querySelector("mark.practice-find-mark")
    mark?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, [findQuery, safeIndex, current?.id])

  const handleSelectChoice = useCallback(
    (index: number) => {
      if (!current || !canSelectAnswers) return
      const choice = current.choices[index]
      if (!choice) return
      if (isTesterMode && revealedByQuestion[current.id]) return
      const nextAnswer = buildGuestDiagnosticAnswerState(current, choice.id)
      setAnswersByQuestion((prev) => ({ ...prev, [current.id]: nextAnswer }))
      if (isTesterMode) {
        setRevealedByQuestion((prev) => ({ ...prev, [current.id]: true }))
        setAnswerViewTab("actual")
      }
    },
    [canSelectAnswers, current, isTesterMode, revealedByQuestion],
  )

  const handleResetResponse = useCallback(() => {
    if (!current || !canSelectAnswers) return
    if (isTesterMode && revealedByQuestion[current.id]) return
    setAnswersByQuestion((prev) => {
      const next = { ...prev }
      delete next[current.id]
      return next
    })
  }, [canSelectAnswers, current, isTesterMode, revealedByQuestion])

  function handleExitReview() {
    if (onExitReview) onExitReview()
    else navigate(-1)
  }

  const headerTitle = "LSAT Praxis Assessment"
  const sessionVariant = resolveExamSessionVariant({
    blindReview: false,
    officialInterface,
  })
  const officialChrome = isOfficialLayout(sessionVariant)

  const finishButton = isPostResultsMode ? (
    <PracticeSessionFinishMenu
      iconTrigger
      variant={sessionVariant}
      officialInterface={officialInterface}
      onOfficialInterfaceChange={setOfficialInterface}
      submitLabel="Back to Results"
      buttonClassName={ACTIVE_DRILL_FINISH_BUTTON_CLASS}
      onSubmitSection={handleExitReview}
      onExit={handleExitReview}
    />
  ) : (
    <PracticeSessionFinishMenu
      disabled={!interactive}
      iconTrigger
      variant={sessionVariant}
      officialInterface={officialInterface}
      onOfficialInterfaceChange={setOfficialInterface}
      submitLabel="Submit Test"
      buttonClassName={ACTIVE_DRILL_FINISH_BUTTON_CLASS}
      onSubmitSection={() => setSubmitModalOpen(true)}
      onExit={handleSaveAndExit}
    />
  )

  async function handleConfirmSubmit() {
    setSubmitting(true)
    try {
      setSubmitModalOpen(false)
      accrueTimeForQuestion(current?.id ?? null)
      const timeSpent = Object.fromEntries(
        Object.entries(timeSpentByQuestionRef.current).map(([id, seconds]) => [id, Math.round(seconds)]),
      )
      persistAnswers(config.intentId, answersByQuestion)
      onSubmitted?.(answersByQuestion, timeSpent)
    } finally {
      setSubmitting(false)
    }
  }

  function handleSaveAndExit() {
    pauseModal.close()
    navigate("/intent", { replace: true })
  }

  const questionPanel = (
    <ResponseMaskingProvider>
    <PracticeDrillQuestionPanel
      key={current.id}
      question={current}
      questionNumber={safeIndex}
      findQuery={findQuery}
      selectedIndex={selectedIndex}
      revealed={questionRevealed}
      isCorrect={questionRevealed ? (currentAnswer?.isCorrect ?? null) : null}
      submitting={false}
      allowReselect={canSelectAnswers && !questionRevealed}
      getRegionHtml={highlights.getRegionHtml}
      onSelect={canSelectAnswers ? handleSelectChoice : () => undefined}
      onResetResponse={canSelectAnswers ? handleResetResponse : undefined}
      flagged={isFlagged(current.id)}
      onToggleFlag={() => toggleFlag(current.id)}
      flagsDisabled={!canNavigate}
      onOpenReview={canNavigate ? () => setReviewPanelOpen(true) : undefined}
      onOpenAccessibility={canNavigate ? accessibilityPanel.openPanel : undefined}
      variant={isPostResultsMode ? "blind-review" : "active-drill"}
      blindReviewChrome={isPostResultsMode}
      answerView={answerViewTab}
      onAnswerViewChange={setAnswerViewTab}
      choicesDisabled={!canSelectAnswers || questionRevealed}
      reviewChrome={isPostResultsMode}
      actualOutcome={actualOutcome}
      blindReviewOutcome={null}
      showCorrectAnswer={showCorrectAnswer}
      onShowCorrectAnswerChange={setShowCorrectAnswer}
      blindReviewTabEnabled={false}
      seedStemExplanationHtml={explanationUnlocked ? explanationHtml : null}
      seedQuestionTypeLabel={explanationUnlocked ? (questionMeta?.questionType ?? null) : null}
      explanationsEnabled={explanationUnlocked}
    />
    </ResponseMaskingProvider>
  )

  if (isPostResultsMode) {
    return (
      <div
        className={cn(
          REVIEW_SHELL_CLASS,
          !canNavigate && "pointer-events-none select-none",
          className,
        )}
      >
        <PracticeBlindReviewSessionHeader
          prepTestLabel={headerTitle}
          sectionOptions={[]}
          activeSectionSessionId={null}
          onSelectSection={() => {}}
          questionRef={`Q${safeIndex}`}
          actualScoreLabel="Actual"
          notesOpen={false}
          notesEnabled={false}
          onToggleNotes={() => undefined}
          onExitSection={handleExitReview}
          showSectionSelect={false}
          exitButtonLabel="Back to Results"
          chrome="review"
          reviewSideActions={["insights"]}
          sidePanel={reviewSidePanel}
          onSidePanelChange={setReviewSidePanel}
          findQuery={findQuery}
          onFindQueryChange={canNavigate ? setFindQuery : () => undefined}
          questionProgressLabel={`${safeIndex} of ${questions.length}`}
        />

        <div className={REVIEW_CARD_CLASS}>
          <div className={REVIEW_BODY_CLASS} style={highlights.contentStyle}>
            {showInsightsPanel ? (
              <div className={REVIEW_SIDE_PANEL_LAYOUT_FULL_CLASS}>
                <div className="contents">
                  <div ref={passagePaneRef} className={cn(REVIEW_PASSAGE_PANEL_CLASS, "overflow-y-auto")}>
                    <ReviewPassageCardHeader />
                    <PracticeAnnotatedContent
                      regionKey={passageKey}
                      html={passageHtml}
                      findQuery={findQuery}
                      toolMode={highlights.toolMode}
                      onMouseUp={canNavigate ? highlights.handleContentMouseUp : () => undefined}
                      onClickCapture={canNavigate ? highlights.handleContentClick : () => undefined}
                      className={cn(
                        BLIND_REVIEW_PASSAGE_TEXT_CLASS,
                        "text-base leading-[1.5] tracking-[0.32px] text-[#36394a]",
                      )}
                    />
                  </div>
                  <div ref={questionPaneRef} className={cn(REVIEW_QUESTION_PANEL_CLASS, "overflow-y-auto")}>
                    {questionPanel}
                  </div>
                </div>
                <PracticeSessionReviewSidePanel
                  mode="insights"
                  questionId={current?.id ?? null}
                  analyticsSeed={analyticsSeed}
                  onClose={() => setReviewSidePanel(null)}
                />
              </div>
            ) : (
              <div
                ref={sessionBodyRef}
                className={cn("min-h-0 overflow-hidden", REVIEW_BODY_GRID_FULL_CLASS)}
              >
                <div ref={passagePaneRef} className={cn(REVIEW_PASSAGE_PANEL_CLASS, "overflow-y-auto")}>
                  <ReviewPassageCardHeader />
                  <PracticeAnnotatedContent
                    regionKey={passageKey}
                    html={passageHtml}
                    findQuery={findQuery}
                    toolMode={highlights.toolMode}
                    onMouseUp={canNavigate ? highlights.handleContentMouseUp : () => undefined}
                    onClickCapture={canNavigate ? highlights.handleContentClick : () => undefined}
                    className={cn(
                      BLIND_REVIEW_PASSAGE_TEXT_CLASS,
                      "text-base leading-[1.5] tracking-[0.32px] text-[#36394a]",
                    )}
                  />
                </div>
                <div ref={questionPaneRef} className={cn(REVIEW_QUESTION_PANEL_CLASS, "overflow-y-auto")}>
                  {questionPanel}
                </div>
              </div>
            )}
          </div>

          <footer className={cn("practice-session-footer relative z-10", REVIEW_FOOTER_CLASS)}>
            <div className={REVIEW_FOOTER_ROW_CLASS}>
              <PracticeSessionQuestionNavStrip
                questions={questions}
                safeIndex={safeIndex}
                answersByQuestion={answersByQuestion}
                isFlagged={isFlagged}
                variant="blind-review"
                showPassageBreaks={false}
                outcomeForQuestion={(questionId) => {
                  if (isTesterMode && !revealedByQuestion[questionId]) return "unanswered"
                  return resolvePracticeSessionQuestionNavOutcome(
                    isReviewMode ? scoredAnswersByQuestion[questionId] : answersByQuestion[questionId],
                  )
                }}
                onSelectQuestion={canNavigate ? setQIndex : () => undefined}
                className={REVIEW_FOOTER_NAV_CLASS}
              />
              <div className={REVIEW_NAV_ARROW_GROUP_CLASS}>
                <PracticeSessionNavArrowButton
                  direction="prev"
                  disabled={!canNavigate || safeIndex <= 1}
                  iconOnly
                  figmaNarrowArrow
                  className={REVIEW_NAV_ARROW_BUTTON_CLASS}
                  onClick={() => setQIndex((index) => Math.max(1, index - 1))}
                />
                <PracticeSessionNavArrowButton
                  direction="next"
                  disabled={!canNavigate || safeIndex >= questions.length}
                  iconOnly
                  figmaNarrowArrow
                  className={REVIEW_NAV_ARROW_BUTTON_CLASS}
                  onClick={() => setQIndex((index) => Math.min(questions.length, index + 1))}
                />
                <button type="button" className={REVIEW_EXIT_BUTTON_CLASS} onClick={handleExitReview}>
                  <span>Exit</span>
                  <X className="size-4" strokeWidth={2} aria-hidden />
                </button>
              </div>
            </div>
          </footer>
        </div>

        <PracticeSessionReviewPanel
          open={reviewPanelOpen}
          questions={questions}
          currentIndex={safeIndex}
          answersByQuestion={answersByQuestion}
          isFlagged={isFlagged}
          onSelectQuestion={setQIndex}
          onClose={() => setReviewPanelOpen(false)}
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
    )
  }

  return (
    <div
      className={cn(
        officialChrome
          ? OFFICIAL_CARD_CLASS
          : "practice-session-card practice-session-card--active-drill relative flex h-full max-h-full min-h-0 w-full flex-col overflow-hidden rounded-none border border-[#dfe1e7] bg-white shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]",
        !canNavigate && "pointer-events-none select-none",
        className,
      )}
    >
      <PracticeSessionHeader
        variant={sessionVariant}
        title={headerTitle}
        findQuery={findQuery}
        onFindQueryChange={canNavigate ? setFindQuery : () => undefined}
        activeColor={highlights.activeColor}
        toolMode={highlights.toolMode}
        fontScale={highlights.fontScale}
        lineSpacing={highlights.lineSpacing}
        boldEnabled={highlights.boldEnabled}
        italicEnabled={highlights.italicEnabled}
        onSelectColor={canNavigate ? highlights.selectColor : () => undefined}
        onEraser={canNavigate ? highlights.selectEraser : () => undefined}
        onUnderline={canNavigate ? highlights.selectUnderline : () => undefined}
        onFontSize={canNavigate ? highlights.cycleFontSize : () => undefined}
        onLineSpacing={canNavigate ? highlights.cycleLineSpacing : () => undefined}
        onToggleBold={canNavigate ? highlights.toggleBold : () => undefined}
        onToggleItalic={canNavigate ? highlights.toggleItalic : () => undefined}
        timerLabel="Time Left"
        timerDisplaySeconds={timerDisplaySeconds}
        timerPaused={paused}
        onTimerPauseRequest={interactive && mode === "exam" ? pauseModal.requestPause : () => undefined}
        timerProgress={timerProgress}
        showTimer
        questionProgressLabel={`${safeIndex} of ${questions.length}`}
        questionNumber={safeIndex}
        questionCount={questions.length}
        finishButton={finishButton}
        onClose={isPostResultsMode ? (onExitReview ?? (() => navigate(-1))) : handleSaveAndExit}
        passageOnlyView={passageOnlyView}
        onPassageOnlyViewChange={setPassageOnlyView}
      />

      <div
        className="practice-session-body flex min-h-0 flex-1 flex-col overflow-hidden"
        data-color-scheme={highlights.accessibilitySettings.colorScheme}
        style={highlights.contentStyle}
      >
        <div
          ref={sessionBodyRef}
          className={cn(
            "grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-hidden",
            officialChrome
              ? cn(OFFICIAL_BODY_GRID_CLASS, passageOnlyView && "lg:grid-cols-1 lg:pr-0")
              : ACTIVE_DRILL_BODY_GRID_CLASS,
          )}
        >
          <div
            ref={passagePaneRef}
            className={cn(
              "practice-session-pane min-h-0 overflow-y-auto",
              officialChrome && lineFocus && "practice-session-pane--line-focus",
              officialChrome ? OFFICIAL_PASSAGE_PANE_CLASS : ACTIVE_DRILL_PASSAGE_PANE_CLASS,
            )}
          >
            <PracticeAnnotatedContent
              regionKey={passageKey}
              html={passageHtml}
              findQuery={findQuery}
              toolMode={highlights.toolMode}
              onMouseUp={canNavigate ? highlights.handleContentMouseUp : () => undefined}
              onClickCapture={canNavigate ? highlights.handleContentClick : () => undefined}
              className={officialChrome ? OFFICIAL_PASSAGE_TEXT_CLASS : ACTIVE_DRILL_PASSAGE_TEXT_CLASS}
            />
          </div>
          <div
            ref={questionPaneRef}
            className={cn(
              "practice-session-pane min-h-0 overflow-y-auto",
              officialChrome && passageOnlyView && "hidden",
              questionRevealed && explanationHtml ? "practice-session-pane--scroll-visible" : null,
              officialChrome ? OFFICIAL_QUESTION_PANE_CLASS : ACTIVE_DRILL_QUESTION_PANE_CLASS,
            )}
          >
            <ResponseMaskingProvider>
            <PracticeDrillQuestionPanel
              key={current.id}
              question={current}
              questionNumber={safeIndex}
              findQuery={findQuery}
              selectedIndex={selectedIndex}
              revealed={questionRevealed}
              isCorrect={questionRevealed ? (currentAnswer?.isCorrect ?? null) : null}
              submitting={false}
              allowReselect={canSelectAnswers && !questionRevealed}
              getRegionHtml={highlights.getRegionHtml}
              onSelect={canSelectAnswers ? handleSelectChoice : () => undefined}
              onResetResponse={canSelectAnswers ? handleResetResponse : undefined}
              flagged={isFlagged(current.id)}
              onToggleFlag={() => toggleFlag(current.id)}
              flagsDisabled={!canNavigate}
              onOpenReview={canNavigate ? () => setReviewPanelOpen((open) => !open) : undefined}
              reviewActive={reviewPanelOpen}
              onOpenAccessibility={canNavigate ? accessibilityPanel.openPanel : undefined}
              variant={sessionVariant}
              toolMode={highlights.toolMode}
              onEraser={highlights.selectEraser}
              lineFocusActive={lineFocus}
              onLineFocus={() => setLineFocus((value) => !value)}
              onFullscreen={toggleExamFullscreen}
              fullView={isFullscreen}
              choicesDisabled={!canSelectAnswers || questionRevealed}
            />
            </ResponseMaskingProvider>
            {questionRevealed && explanationUnlocked && explanationHtml ? (
              <div className="practice-session-explanation practice-session-inline-divider mt-6 border-t pt-6 pb-6">
                <p className="practice-session-panel-label mb-3 text-xs font-semibold uppercase tracking-[0.04em]">
                  Explanation
                </p>
                <div className="practice-session-panel rounded-[16px] border p-5">
                  <HtmlContent
                    html={explanationHtml}
                    className="explanation-detail-body max-w-none text-[1.05rem] leading-[1.55]"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <footer className={cn("practice-session-footer relative z-10", officialChrome ? OFFICIAL_FOOTER_CLASS : ACTIVE_DRILL_FOOTER_CLASS)}>
        <PracticeSessionActiveDrillFooterNav
          questions={questions}
          safeIndex={safeIndex}
          answersByQuestion={answersByQuestion}
          isFlagged={isFlagged}
          variant={sessionVariant}
          outcomeForQuestion={
            isPostResultsMode
              ? (questionId) => {
                  // Review: show scored outcomes for every question.
                  // Tester: only after the answer is revealed; otherwise unanswered.
                  if (isTesterMode && !revealedByQuestion[questionId]) return "unanswered"
                  return resolvePracticeSessionQuestionNavOutcome(answersByQuestion[questionId])
                }
              : undefined
          }
          onSelectQuestion={canNavigate ? setQIndex : () => undefined}
          onPrev={canNavigate ? () => setQIndex((index) => Math.max(1, index - 1)) : () => undefined}
          onNext={
            canNavigate ? () => setQIndex((index) => Math.min(questions.length, index + 1)) : () => undefined
          }
        />
      </footer>

      <PracticeSessionReviewPanel
        open={reviewPanelOpen}
        variant={sessionVariant}
        questions={questions}
        currentIndex={safeIndex}
        answersByQuestion={answersByQuestion}
        isFlagged={isFlagged}
        onSelectQuestion={setQIndex}
        onClose={() => setReviewPanelOpen(false)}
        onFinish={officialChrome ? () => setSubmitModalOpen(true) : undefined}
        showPassageBreaks
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
      <PracticeSessionHighlightPopover
        menu={highlights.selectionMenu}
        onApplyColor={highlights.applySelectionColor}
        onRemove={highlights.removeSelectionHighlight}
        onToggleExpanded={highlights.toggleSelectionExpanded}
        onDismiss={highlights.dismissSelectionMenu}
        isAnchorConnected={highlights.isSelectionMenuAnchorConnected}
      />
      <PracticeSessionPauseModal
        open={pauseModal.open}
        title="Diagnostic"
        message="Your diagnostic is paused"
        onResume={pauseModal.resume}
        onSaveAndExit={handleSaveAndExit}
      />
      {mode === "exam" ? (
        <GuestDiagnosticSubmitModal
          open={submitModalOpen}
          submitting={submitting}
          onCancel={() => setSubmitModalOpen(false)}
          onConfirm={() => void handleConfirmSubmit()}
        />
      ) : null}
    </div>
  )
}

export { GuestDiagnosticExamLayout }
export type { GuestDiagnosticExamMode }
