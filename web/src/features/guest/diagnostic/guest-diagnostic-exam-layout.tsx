import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import { createGuestDiagnosticPreviewQuestions } from "@/features/guest/diagnostic/guest-diagnostic-exam-mock-data"
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
import { PracticeSessionActiveDrillFooterNav } from "@/features/student/practice-session/practice-session-active-drill-footer-nav"
import { PracticeAnnotatedContent } from "@/features/student/practice-session/practice-annotated-content"
import { PracticeSessionHighlightPopover } from "@/features/student/practice-session/practice-session-highlight-popover"
import { PracticeDrillQuestionPanel, regionKey } from "@/features/student/practice-session/practice-drill-question-panel"
import { PracticeSessionAccessibilityPanel } from "@/features/student/practice-session/practice-session-accessibility-panel"
import { PracticeSessionFinishMenu } from "@/features/student/practice-session/practice-session-finish-menu"
import { PracticeSessionHeader } from "@/features/student/practice-session/practice-session-header"
import { PracticeSessionPauseModal } from "@/features/student/practice-session/practice-session-pause-modal"
import { resolvePracticeSessionQuestionNavOutcome } from "@/features/student/practice-session/practice-session-question-nav-outcome"
import { PracticeSessionReviewPanel } from "@/features/student/practice-session/practice-session-review-panel"
import { usePracticeSessionAccessibilityPanel } from "@/features/student/practice-session/use-practice-session-accessibility-panel"
import { usePracticeHighlights } from "@/features/student/practice-session/use-practice-highlights"
import { toggleFlaggedId } from "@/features/student/practice-session/practice-question-flags"
import { usePracticeSessionPauseModal } from "@/features/student/practice-session/use-practice-session-pause-modal"
import {
  computeRemainingTimerProgress,
  usePracticeSessionTimer,
} from "@/features/student/practice-session/use-practice-session-timer"
import { getMiniDiagnosticExplanationHtml } from "@/features/guest/diagnostic/mini-diagnostic-content"
import {
  canShowDiagnosticExplanation,
  freeDiagnosticExplanationLimit,
} from "@/features/guest/diagnostic/diagnostic-explanation-access"
import { GuestUpgradeCta } from "@/features/guest/diagnostic/guest-upgrade-cta"
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
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [revealedByQuestion, setRevealedByQuestion] = useState<Record<string, boolean>>({})
  const [answersByQuestion, setAnswersByQuestion] = useState<Record<string, GuestDiagnosticAnswerState>>(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) return initialAnswers
    if (isPostResultsMode) return {}
    return readPersistedAnswers(config.intentId)
  })

  const questions = useMemo(
    () => createGuestDiagnosticPreviewQuestions(config.questionCount),
    [config.questionCount],
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
    current && explanationUnlocked ? getMiniDiagnosticExplanationHtml(current.id) : null
  const freeExplanationLimit = freeDiagnosticExplanationLimit(config.intentId)

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

  const headerTitle = "LSAT Praxis Assessment"

  const finishButton = isPostResultsMode ? (
    <PracticeSessionFinishMenu
      iconTrigger
      submitLabel="Back to Results"
      buttonClassName={ACTIVE_DRILL_FINISH_BUTTON_CLASS}
      onSubmitSection={() => (onExitReview ? onExitReview() : navigate(-1))}
      onExit={() => (onExitReview ? onExitReview() : navigate(-1))}
    />
  ) : (
    <PracticeSessionFinishMenu
      disabled={!interactive}
      iconTrigger
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
      // Keep answers available for Review / Tester after submit.
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

  return (
    <div
      className={cn(
        "practice-session-card practice-session-card--active-drill relative flex h-full max-h-full min-h-0 w-full flex-col overflow-hidden rounded-none border border-[#dfe1e7] bg-white shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]",
        !canNavigate && "pointer-events-none select-none",
        className,
      )}
    >
      <PracticeSessionHeader
        variant="active-drill"
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
        showTimer={!isPostResultsMode}
        questionProgressLabel={`${safeIndex} of ${questions.length}`}
        questionNumber={safeIndex}
        questionCount={questions.length}
        finishButton={finishButton}
        onClose={isPostResultsMode ? (onExitReview ?? (() => navigate(-1))) : handleSaveAndExit}
      />

      <div
        className="practice-session-body flex min-h-0 flex-1 flex-col overflow-hidden"
        style={highlights.contentStyle}
      >
        <div
          ref={sessionBodyRef}
          className={cn("grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-hidden", ACTIVE_DRILL_BODY_GRID_CLASS)}
        >
          <div
            ref={passagePaneRef}
            className={cn("practice-session-pane min-h-0 overflow-y-auto", ACTIVE_DRILL_PASSAGE_PANE_CLASS)}
          >
            <PracticeAnnotatedContent
              regionKey={passageKey}
              html={passageHtml}
              findQuery={findQuery}
              toolMode={highlights.toolMode}
              onMouseUp={canNavigate ? highlights.handleContentMouseUp : () => undefined}
              onClickCapture={canNavigate ? highlights.handleContentClick : () => undefined}
              className={ACTIVE_DRILL_PASSAGE_TEXT_CLASS}
            />
          </div>
          <div
            ref={questionPaneRef}
            className={cn(
              "practice-session-pane min-h-0 overflow-y-auto",
              questionRevealed && explanationHtml ? "practice-session-pane--scroll-visible" : null,
              ACTIVE_DRILL_QUESTION_PANE_CLASS,
            )}
          >
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
              variant="active-drill"
              choicesDisabled={!canSelectAnswers || questionRevealed}
            />
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
            {questionRevealed && isPostResultsMode && !explanationUnlocked ? (
              <div className="practice-session-inline-divider mt-6 border-t pt-6">
                <div className="practice-session-panel rounded-[16px] border p-5">
                  <p className="text-sm font-semibold">Explanation locked</p>
                  <p className="practice-session-panel-label mt-1 text-sm leading-relaxed">
                    Free students can review explanations for the first {freeExplanationLimit} questions
                    on this diagnostic. Upgrade to unlock every explanation.
                  </p>
                  <div className="mt-4">
                    <GuestUpgradeCta variant="banner" />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <footer className={cn("practice-session-footer relative z-10", ACTIVE_DRILL_FOOTER_CLASS)}>
        <PracticeSessionActiveDrillFooterNav
          questions={questions}
          safeIndex={safeIndex}
          answersByQuestion={answersByQuestion}
          isFlagged={isFlagged}
          variant="active-drill"
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
