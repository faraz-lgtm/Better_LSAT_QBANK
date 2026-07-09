import { useMemo, useRef, useState, useCallback } from "react"

import { createGuestDiagnosticPreviewQuestions } from "@/features/guest/diagnostic/guest-diagnostic-exam-mock-data"
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
import { PracticeSessionReviewPanel } from "@/features/student/practice-session/practice-session-review-panel"
import { usePracticeSessionAccessibilityPanel } from "@/features/student/practice-session/use-practice-session-accessibility-panel"
import { usePracticeHighlights } from "@/features/student/practice-session/use-practice-highlights"
import { toggleFlaggedId } from "@/features/student/practice-session/practice-question-flags"
import { computeRemainingTimerProgress } from "@/features/student/practice-session/use-practice-session-timer"
import { cn } from "@/lib/utils"

type GuestDiagnosticExamLayoutProps = {
  config: GuestDiagnosticTestConfig
  interactive?: boolean
  className?: string
  onSubmitted?: () => void
}

/** Figma `19510:22557` — diagnostic start uses the same active-drill exam shell as practice sessions. */
function GuestDiagnosticExamLayout({
  config,
  interactive = false,
  className,
  onSubmitted,
}: GuestDiagnosticExamLayoutProps) {
  const sessionBodyRef = useRef<HTMLDivElement>(null)
  const [qIndex, setQIndex] = useState(1)
  const [findQuery, setFindQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(1)
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false)
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [answersByQuestion] = useState<Record<string, { selectedAnswer: string; isCorrect: boolean }>>({
    "guest-diagnostic-preview-q1": { selectedAnswer: "B", isCorrect: false },
  })

  const questions = useMemo(
    () => createGuestDiagnosticPreviewQuestions(config.questionCount),
    [config.questionCount],
  )
  const current = questions[qIndex - 1] ?? questions[0]
  const safeIndex = Math.min(Math.max(qIndex, 1), questions.length)
  const timerBudgetSeconds = config.timeMinutes * 60
  const timerDisplaySeconds = Math.max(timerBudgetSeconds - 1, 0)
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

  const passageKey = current ? regionKey(current.id, "passage") : ""
  const passageHtml = current?.stimulusText ?? ""

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
      onSubmitted?.()
    } finally {
      setSubmitting(false)
    }
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
        timerPaused={false}
        onTimerPauseRequest={() => undefined}
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
          <div className={cn("practice-session-pane min-h-0", ACTIVE_DRILL_PASSAGE_PANE_CLASS)}>
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
          <div className={cn("practice-session-pane min-h-0", ACTIVE_DRILL_QUESTION_PANE_CLASS)}>
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
              toolMode={highlights.toolMode}
              onContentMouseUp={interactive ? highlights.handleContentMouseUp : () => undefined}
              onContentClick={interactive ? highlights.handleContentClick : () => undefined}
              onSelect={interactive ? setSelectedIndex : () => undefined}
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
