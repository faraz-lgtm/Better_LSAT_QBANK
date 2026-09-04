import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import {
  ACTIVE_DRILL_HEADER_MORE_BUTTON_CLASS,
  FINISH_MENU_ACTION_ITEM_CLASS,
  FINISH_MENU_ACTION_ITEM_ICON_CLASS,
  FINISH_MENU_ACTIONS_PANEL_CLASS,
  FINISH_MENU_OPEN_PANEL_CLASS,
  FINISH_MENU_OPEN_TRIGGER_CLASS,
  FINISH_MENU_PANEL_WIDTH_PX,
  FINISH_MENU_WIDTH_PX,
  SESSION_FINISH_BUTTON_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import { PracticeSessionExamMorePanel } from "@/features/student/practice-session/practice-session-exam-more-panel"
import { OFFICIAL_HEADER_MORE_BUTTON_CLASS } from "@/features/student/practice-session/practice-session-official-styles"
import { isOfficialLayout, type PracticeSessionVariant } from "@/features/student/practice-session/practice-session-types"
import { ExamHeaderMoreIcon } from "@/features/student/practice-session/practice-session-header-icons"
import {
  FinishMenuSaveExitIcon,
  FinishMenuSubmitIcon,
} from "@/features/student/practice-session/practice-session-finish-menu-icons"
import { cn } from "@/lib/utils"

/** Above section-intro overlay (`z-[100]`) and practice modals. */
const MENU_Z_INDEX = 110

type PracticeSessionFinishMenuProps = {
  disabled?: boolean
  finishing?: boolean
  /** When true, only shows Save & Exit — no submit action. */
  exitOnly?: boolean
  finishLabel?: string
  submitLabel?: string
  exitLabel?: string
  buttonClassName?: string
  /** Icon-only more menu trigger for exam header */
  iconTrigger?: boolean
  onSubmitSection: () => void
  onExit: () => void
  /** Exam more panel — defaults to `onExit` when omitted. */
  onExitWithoutSaving?: () => void
  variant?: PracticeSessionVariant
  officialInterface?: boolean
  onOfficialInterfaceChange?: (next: boolean) => void
  /** Passed through to exam more panel (Blind Review Figma). */
  morePanelSectionSelect?: ReactNode
  morePanelInterfaceLabel?: string
}

function PracticeSessionFinishMenu({
  disabled = false,
  finishing = false,
  exitOnly = false,
  finishLabel,
  submitLabel = "Submit Section",
  exitLabel = "Save & Exit",
  buttonClassName,
  iconTrigger = false,
  onSubmitSection,
  onExit,
  onExitWithoutSaving,
  variant = "default",
  officialInterface = true,
  onOfficialInterfaceChange,
  morePanelSectionSelect = null,
  morePanelInterfaceLabel,
}: PracticeSessionFinishMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const discardExit = onExitWithoutSaving ?? onExit

  const closedTriggerClassName = buttonClassName ?? SESSION_FINISH_BUTTON_CLASS
  const label = finishing ? "Finishing…" : (finishLabel ?? "Finish")

  useLayoutEffect(() => {
    if (!open) return
    const className = iconTrigger ? "practice-exam-more-open" : "practice-finish-menu-open"
    document.documentElement.classList.add(className)
    return () => {
      document.documentElement.classList.remove(className)
    }
  }, [open, iconTrigger])

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (iconTrigger) return
      if (!(event.target instanceof Node)) return
      if (containerRef.current?.contains(event.target)) return
      if (menuRef.current?.contains(event.target)) return
      setOpen(false)
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open, iconTrigger])

  const triggerContent = (isOpen: boolean) => (
    <>
      <span className="shrink-0 whitespace-nowrap">{label}</span>
      {isOpen ? (
        <ChevronUp className="ml-auto size-5 shrink-0 text-[var(--greyscale-400)]" strokeWidth={2} aria-hidden />
      ) : (
        <ChevronDown className="ml-auto size-5 shrink-0 text-[var(--greyscale-400)]" strokeWidth={2} aria-hidden />
      )}
    </>
  )

  if (iconTrigger) {
    const officialChrome = isOfficialLayout(variant)
    return (
      <div
        ref={containerRef}
        className={officialChrome ? "relative size-7 shrink-0" : "relative h-[52px] w-[54px] shrink-0"}
      >
        <button
          type="button"
          disabled={disabled || finishing}
          className={officialChrome ? OFFICIAL_HEADER_MORE_BUTTON_CLASS : ACTIVE_DRILL_HEADER_MORE_BUTTON_CLASS}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="More options"
          onClick={() => setOpen((value) => !value)}
        >
          <ExamHeaderMoreIcon />
        </button>
        {open ? (
          <PracticeSessionExamMorePanel
            disabled={disabled}
            finishing={finishing}
            exitOnly={exitOnly}
            officialInterface={officialInterface}
            onOfficialInterfaceChange={onOfficialInterfaceChange}
            sectionSelect={morePanelSectionSelect}
            interfaceToggleLabel={morePanelInterfaceLabel}
            onClose={() => setOpen(false)}
            onSubmit={onSubmitSection}
            onSaveAndExit={onExit}
            onExitWithoutSaving={discardExit}
          />
        ) : null}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative h-[52px] shrink-0"
      style={{ width: FINISH_MENU_WIDTH_PX }}
    >
      {!open ? (
        <button
          type="button"
          disabled={disabled || finishing}
          className={cn("inline-flex w-full items-center justify-between gap-2", closedTriggerClassName)}
          aria-haspopup="menu"
          aria-expanded={false}
          onClick={() => setOpen(true)}
        >
          {triggerContent(false)}
        </button>
      ) : (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Finish options"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: FINISH_MENU_PANEL_WIDTH_PX,
            zIndex: MENU_Z_INDEX,
          }}
          className={FINISH_MENU_OPEN_PANEL_CLASS}
        >
          <button
            type="button"
            disabled={disabled || finishing}
            className={FINISH_MENU_OPEN_TRIGGER_CLASS}
            aria-haspopup="menu"
            aria-expanded
            onClick={() => setOpen(false)}
          >
            {triggerContent(true)}
          </button>
          <div className={FINISH_MENU_ACTIONS_PANEL_CLASS}>
            {exitOnly ? null : (
              <button
                type="button"
                role="menuitem"
                className={FINISH_MENU_ACTION_ITEM_CLASS}
                onClick={() => {
                  setOpen(false)
                  onSubmitSection()
                }}
              >
                <FinishMenuSubmitIcon className={FINISH_MENU_ACTION_ITEM_ICON_CLASS} />
                <span>{submitLabel}</span>
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              className={FINISH_MENU_ACTION_ITEM_CLASS}
              onClick={() => {
                setOpen(false)
                onExit()
              }}
            >
              <FinishMenuSaveExitIcon className={FINISH_MENU_ACTION_ITEM_ICON_CLASS} />
              <span>{exitLabel}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export { PracticeSessionFinishMenu }
