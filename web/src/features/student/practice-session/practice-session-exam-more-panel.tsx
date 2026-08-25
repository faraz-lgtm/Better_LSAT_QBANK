import { createPortal } from "react-dom"

import {
  EXAM_MORE_PANEL_ACTION_CLASS,
  EXAM_MORE_PANEL_ACTION_ICON_WRAP_CLASS,
  EXAM_MORE_PANEL_CLASS,
  EXAM_MORE_PANEL_CLOSE_BUTTON_CLASS,
  EXAM_MORE_PANEL_CLOSE_ROW_CLASS,
  EXAM_MORE_PANEL_DIVIDER_CLASS,
  EXAM_MORE_PANEL_DIVIDER_WRAP_CLASS,
  EXAM_MORE_PANEL_OVERLAY_CLASS,
  EXAM_MORE_PANEL_TOGGLE_LABEL_CLASS,
  EXAM_MORE_PANEL_TOGGLE_ROW_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"

const EXAM_FINISH_FIGMA = "/figma/exam-finish"

type PracticeSessionExamMorePanelProps = {
  disabled?: boolean
  finishing?: boolean
  exitOnly?: boolean
  onClose: () => void
  onSubmit: () => void
  onSaveAndExit: () => void
  onExitWithoutSaving: () => void
}

function ExamMoreIcon({ src, size }: { src: string; size: number }) {
  return (
    <span className="relative flex shrink-0 items-center justify-center overflow-hidden" style={{ width: size, height: size }}>
      <img src={src} alt="" width={size} height={size} className="size-full max-w-none" draggable={false} />
    </span>
  )
}

function ExamMoreToggle({ labelledBy, disabled = false }: { labelledBy: string; disabled?: boolean }) {
  return (
    <span
      className="relative inline-flex h-6 w-11 shrink-0 overflow-hidden rounded-full"
      role="switch"
      aria-checked="false"
      aria-labelledby={labelledBy}
      aria-disabled={disabled || undefined}
    >
      <img
        src={`${EXAM_FINISH_FIGMA}/toggle-off.svg`}
        alt=""
        width={44}
        height={24}
        className="size-full max-w-none"
        draggable={false}
      />
    </span>
  )
}

function PracticeSessionExamMorePanel({
  disabled = false,
  finishing = false,
  exitOnly = false,
  onClose,
  onSubmit,
  onSaveAndExit,
  onExitWithoutSaving,
}: PracticeSessionExamMorePanelProps) {
  const actionsDisabled = disabled || finishing

  return createPortal(
    <>
      <div className={EXAM_MORE_PANEL_OVERLAY_CLASS} role="presentation" onClick={onClose} />
      <div
        className={EXAM_MORE_PANEL_CLASS}
        role="dialog"
        aria-modal="true"
        aria-label="More options"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={EXAM_MORE_PANEL_CLOSE_ROW_CLASS}>
          <button type="button" className={EXAM_MORE_PANEL_CLOSE_BUTTON_CLASS} aria-label="Close" onClick={onClose}>
            <ExamMoreIcon src={`${EXAM_FINISH_FIGMA}/close.svg`} size={24} />
          </button>
        </div>

        {exitOnly ? null : (
          <button
            type="button"
            className={EXAM_MORE_PANEL_ACTION_CLASS}
            disabled={actionsDisabled}
            onClick={() => {
              onClose()
              onSubmit()
            }}
          >
            <span className={EXAM_MORE_PANEL_ACTION_ICON_WRAP_CLASS}>
              <ExamMoreIcon src={`${EXAM_FINISH_FIGMA}/sent-fast.svg`} size={20} />
            </span>
            Submit
          </button>
        )}

        <button
          type="button"
          className={EXAM_MORE_PANEL_ACTION_CLASS}
          disabled={actionsDisabled}
          onClick={() => {
            onClose()
            onSaveAndExit()
          }}
        >
          <span className={EXAM_MORE_PANEL_ACTION_ICON_WRAP_CLASS}>
            <ExamMoreIcon src={`${EXAM_FINISH_FIGMA}/login-01.svg`} size={20} />
          </span>
          Save and exit
        </button>

        <button
          type="button"
          className={EXAM_MORE_PANEL_ACTION_CLASS}
          disabled={actionsDisabled}
          onClick={() => {
            onClose()
            onExitWithoutSaving()
          }}
        >
          <span className={EXAM_MORE_PANEL_ACTION_ICON_WRAP_CLASS}>
            <ExamMoreIcon src={`${EXAM_FINISH_FIGMA}/block.svg`} size={20} />
          </span>
          Exit without saving
        </button>

        <div className={EXAM_MORE_PANEL_DIVIDER_WRAP_CLASS}>
          <div className={EXAM_MORE_PANEL_DIVIDER_CLASS} />
        </div>

        <div className={EXAM_MORE_PANEL_TOGGLE_ROW_CLASS}>
          <span id="exam-more-dark-mode" className={EXAM_MORE_PANEL_TOGGLE_LABEL_CLASS}>
            Dark mode
          </span>
          <ExamMoreToggle labelledBy="exam-more-dark-mode" />
        </div>

        <div className={EXAM_MORE_PANEL_TOGGLE_ROW_CLASS}>
          <span id="exam-more-official-interface" className={EXAM_MORE_PANEL_TOGGLE_LABEL_CLASS}>
            Official Interface
          </span>
          <ExamMoreToggle labelledBy="exam-more-official-interface" disabled />
        </div>
      </div>
    </>,
    document.body,
  )
}

export { PracticeSessionExamMorePanel }
