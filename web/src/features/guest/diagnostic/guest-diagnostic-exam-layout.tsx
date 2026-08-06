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
import { PracticeDrillQuestionPanel, regionKey } from "@/features/student/practice-session/practice-drill-question-panel"
import { PracticeSessionAccessibilityPanel } from "@/features/student/practice-session/practice-session-accessibility-panel"
import { PracticeSessionFinishMenu } from "@/features/student/practice-session/practice-session-finish-menu"
import { PracticeSessionHeader } from "@/features/student/practice-session/practice-session-header"
import { PracticeSessionPauseModal } from "@/features/student/practice-session/practice-session-pause-modal"
import { PracticeSessionReviewPanel } from "@/features/student/practice-session/practice-session-review-panel"
import { usePracticeSessionAccessibilityPanel } from "@/features/student/practice-session/use-practice-session-accessibility-panel"
import { usePracticeHighlights } from "@/features/student/practice-session/use-practice-highlights"
import { toggleFlaggedId } from "@/features/student/practice-session/practice-question-flags"
import { usePracticeSessionPauseModal } from "@/features/student/practice-session/use-practice-session-pause-modal"
import {
  computeRemainingTimerProgress,
  usePracticeSessionTimer,
} from "@/features/student/practice-session/use-practice-session-timer"
import { cn } from "@/lib/utils"

type GuestDiagnosticExamLayoutProps = {
  config: GuestDiagnosticTestConfig
  interactive?: boolean
  className?: string
  onSubmitted?: (answersByQuestion: Record<string, GuestDiagnosticAnswerState>) => void
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

function clearPersistedAnswers(intentId: string): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(`${GUEST_DIAGNOSTIC_ANSWERS_STORAGE_PREFIX}${intentId}`)
}

/** Figma `19510:22557` — diagnostic start uses the same active-drill exam shell as practice sessions. */
function GuestDiagnosticExamLayout({
  config,
  interactive = false,
  className,
  onSubmitted,
}: GuestDiagnosticExamLayoutProps) {
  const navigate = useNavigate()
  const sessionBodyRef = useRef<HTMLDivElement>(null)
  const passagePaneRef = useRef<HTMLDivElement>(null)
  const questionPaneRef = useRef<HTMLDivElement>(null)
  const timerInitializedRef = useRef(false)

  const [qIndex, setQIndex] = useState(1)
  const [findQuery, setFindQuery] = useState("")
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false)
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [answersByQuestion, setAnswersByQuestion] = useState<Record<string, GuestDiagnosticAnswerState>>(() =>
    readPersistedAnswers(config.intentId),
  )

  const questions = useMemo(
    () => createGuestDiagnosticPreviewQuestions(config.questionCount),
    [config.questionCount],
  )
  const current = questions[qIndex - 1] ?? questions[0]
  const safeIndex = Math.min(Math.max(qIndex, 1), questions.length)
  const timerBudgetSeconds = config.timeMinutes * 60

  const { countdown, paused, pauseTimer, resumeTimer, setInitialCountdown } = usePracticeSessionTimer({
    enabled: interactive,
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

  const passageKey = current ? regionKey(current.id, "passage") : ""
  const passageBody = current?.stimulusText ?? ""
  const passageHtml = resolveGuestDiagnosticPassageHtml(highlights.getRegionHtml, passageKey, passageBody)

  useEffect(() => {
    if (!interactive || timerInitializedRef.current) return
    setInitialCountdown(timerBudgetSeconds)
    timerInitializedRef.current = true
  }, [interactive, setInitialCountdown, timerBudgetSeconds])

  useEffect(() => {
    persistAnswers(config.intentId, answersByQuestion)
  }, [answersByQuestion, config.intentId])

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
      if (!current || !interactive) return
      const choice = current.choices[index]
      if (!choice) return
      const nextAnswer = buildGuestDiagnosticAnswerState(current, choice.id)
      setAnswersByQuestion((prev) => ({ ...prev, [current.id]: nextAnswer }))
    },
    [current, interactive],
  )

  const finishButton = (
    <PracticeSessionFinishMenu
      disabled={!interactive}
      iconTrigger
      submitLabel="Submit Test"
      buttonClassName={ACTIVE_DRILL_FINISH_BUTTON_CLASS}
      onSubmitSection={() => setSubmitModalOpen(true)}
      onExit={() => undefined}
    />
  )

  async function handleConfirmSubmit() {
    setSubmitting(true)
    try {
      setSubmitModalOpen(false)
      clearPersistedAnswers(config.intentId)
      onSubmitted?.(answersByQuestion)
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
        "practice-session-card practice-session-card--active-drill relative flex h-auto max-h-full min-h-0 w-full flex-col overflow-hidden rounded-none border border-[#dfe1e7] bg-white shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]",
        !interactive && "pointer-events-none select-none",
        className,
      )}
    >
      <PracticeSessionHeader
        variant="active-drill"
        title="LSAT Praxis Assessment"
        findQuery={findQuery}
        onFindQueryChange={interactive ? setFindQuery : () => undefined}
        activeColor={highlights.activeColor}
        toolMode={highlights.toolMode}
        fontScale={highlights.fontScale}
        lineSpacing={highlights.lineSpacing}
        boldEnabled={highlights.boldEnabled}
        italicEnabled={highlights.italicEnabled}
        onSelectColor={interactive ? highlights.selectColor : () => undefined}
        onEraser={interactive ? highlights.selectEraser : () => undefined}
        onUnderline={interactive ? highlights.selectUnderline : () => undefined}
        onFontSize={interactive ? highlights.cycleFontSize : () => undefined}
        onLineSpacing={interactive ? highlights.cycleLineSpacing : () => undefined}
        onToggleBold={interactive ? highlights.toggleBold : () => undefined}
        onToggleItalic={interactive ? highlights.toggleItalic : () => undefined}
        timerLabel="Time Left"
        timerDisplaySeconds={timerDisplaySeconds}
        timerPaused={paused}
        onTimerPauseRequest={interactive ? pauseModal.requestPause : () => undefined}
        timerProgress={timerProgress}
        questionProgressLabel={`${safeIndex} of ${questions.length}`}
        finishButton={finishButton}
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
              onMouseUp={interactive ? highlights.handleContentMouseUp : () => undefined}
              onClickCapture={interactive ? highlights.handleContentClick : () => undefined}
              className={ACTIVE_DRILL_PASSAGE_TEXT_CLASS}
            />
          </div>
          <div
            ref={questionPaneRef}
            className={cn("practice-session-pane min-h-0 overflow-y-auto", ACTIVE_DRILL_QUESTION_PANE_CLASS)}
          >
            <PracticeDrillQuestionPanel
              key={current.id}
              question={current}
              questionNumber={safeIndex}
              findQuery={findQuery}
              selectedIndex={selectedIndex}
              revealed={false}
              isCorrect={null}
              submitting={false}
              allowReselect
              getRegionHtml={highlights.getRegionHtml}
              onSelect={interactive ? handleSelectChoice : () => undefined}
              flagged={isFlagged(current.id)}
              onToggleFlag={() => toggleFlag(current.id)}
              flagsDisabled={!interactive}
              onOpenReview={interactive ? () => setReviewPanelOpen(true) : undefined}
              onOpenAccessibility={interactive ? accessibilityPanel.openPanel : undefined}
              variant="active-drill"
              choicesDisabled={!interactive}
            />
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
          onSelectQuestion={interactive ? setQIndex : () => undefined}
          onPrev={interactive ? () => setQIndex((index) => Math.max(1, index - 1)) : () => undefined}
          onNext={interactive ? () => setQIndex((index) => Math.min(questions.length, index + 1)) : () => undefined}
          onSubmit={interactive ? () => setSubmitModalOpen(true) : undefined}
          submitLabel="Submit Test"
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
      <PracticeSessionPauseModal
        open={pauseModal.open}
        title="Diagnostic"
        message="Your diagnostic is paused"
        onResume={pauseModal.resume}
        onSaveAndExit={handleSaveAndExit}
      />
      <GuestDiagnosticSubmitModal
        open={submitModalOpen}
        submitting={submitting}
        onCancel={() => setSubmitModalOpen(false)}
        onConfirm={() => void handleConfirmSubmit()}
      />
    </div>
  )
}

export { GuestDiagnosticExamLayout }
