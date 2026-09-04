import { createPortal } from "react-dom"
import type { ReactNode } from "react"

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
import { useTheme } from "@/features/theme/theme-provider"

const EXAM_FINISH_FIGMA = "/figma/exam-finish"

type PracticeSessionExamMorePanelProps = {
  disabled?: boolean
  finishing?: boolean
  exitOnly?: boolean
  officialInterface?: boolean
  onOfficialInterfaceChange?: (next: boolean) => void
  /** Figma `20596:145393` — section dropdown above exit actions */
  sectionSelect?: ReactNode
  /** Defaults to "BetterLSAT Interface"; Blind Review Figma uses "Official Interface" */
  interfaceToggleLabel?: string
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

function ExamMoreToggle({
  labelledBy,
  checked = false,
  disabled = false,
  onCheckedChange,
}: {
  labelledBy: string
  checked?: boolean
  disabled?: boolean
  onCheckedChange?: (next: boolean) => void
}) {
  const interactive = Boolean(onCheckedChange) && !disabled
  return (
    <button
      type="button"
      className="relative inline-flex h-6 w-11 shrink-0 overflow-hidden rounded-full disabled:cursor-default"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      disabled={!interactive}
      onClick={() => onCheckedChange?.(!checked)}
    >
      <img
        src={`${EXAM_FINISH_FIGMA}/${checked ? "toggle-on" : "toggle-off"}.svg`}
        alt=""
        width={44}
        height={24}
        className="size-full max-w-none"
        draggable={false}
      />
    </button>
  )
}

function PracticeSessionExamMorePanel({
  disabled = false,
  finishing = false,
  exitOnly = false,
  officialInterface = true,
  onOfficialInterfaceChange,
  sectionSelect = null,
  interfaceToggleLabel = "BetterLSAT Interface",
  onClose,
  onSubmit,
  onSaveAndExit,
  onExitWithoutSaving,
}: PracticeSessionExamMorePanelProps) {
  const { isDark, setTheme } = useTheme()
  const actionsDisabled = disabled || finishing
  const officialToggleSemantics = interfaceToggleLabel === "Official Interface"

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

        {sectionSelect ? <div className="mb-1 w-full shrink-0">{sectionSelect}</div> : null}

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
          <ExamMoreToggle
            labelledBy="exam-more-dark-mode"
            checked={isDark}
            onCheckedChange={(next) => setTheme(next ? "dark" : "light")}
          />
        </div>

        <div className={EXAM_MORE_PANEL_TOGGLE_ROW_CLASS}>
          <span id="exam-more-betterlsat-interface" className={EXAM_MORE_PANEL_TOGGLE_LABEL_CLASS}>
            {interfaceToggleLabel}
          </span>
          <ExamMoreToggle
            labelledBy="exam-more-betterlsat-interface"
            checked={officialToggleSemantics ? officialInterface : !officialInterface}
            onCheckedChange={(next) => {
              if (officialToggleSemantics) onOfficialInterfaceChange?.(next)
              else onOfficialInterfaceChange?.(!next)
            }}
          />
        </div>
      </div>
    </>,
    document.body,
  )
}

export { PracticeSessionExamMorePanel }
