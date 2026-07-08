import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react"

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
}: PracticeSessionFinishMenuProps) {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const closedTriggerClassName = buttonClassName ?? SESSION_FINISH_BUTTON_CLASS
  const label = finishing ? "Finishing…" : (finishLabel ?? "Finish")

  useEffect(() => {
    if (!open || !containerRef.current) {
      setMenuPosition(null)
      return
    }

    function updatePosition() {
      const trigger = containerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      setMenuPosition({
        top: rect.top,
        left: rect.right - FINISH_MENU_PANEL_WIDTH_PX,
      })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
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
  }, [open])

  const triggerContent = (isOpen: boolean) => (
    <>
      <span className="shrink-0 whitespace-nowrap">{label}</span>
      {isOpen ? (
        <ChevronUp className="ml-auto size-5 shrink-0 text-[#818898]" strokeWidth={2} aria-hidden />
      ) : (
        <ChevronDown className="ml-auto size-5 shrink-0 text-[#818898]" strokeWidth={2} aria-hidden />
      )}
    </>
  )

  const openMenu =
    open && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Finish options"
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
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
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <div
        ref={containerRef}
        className={cn("relative shrink-0", iconTrigger ? "h-[52px] w-[52px]" : "h-[52px]")}
        style={iconTrigger ? undefined : { width: FINISH_MENU_WIDTH_PX }}
      >
        {!open ? (
          <button
            type="button"
            disabled={disabled || finishing}
            className={cn(
              iconTrigger
                ? ACTIVE_DRILL_HEADER_MORE_BUTTON_CLASS
                : cn("inline-flex w-full items-center justify-between gap-2", closedTriggerClassName),
            )}
            aria-haspopup="menu"
            aria-expanded={false}
            aria-label={iconTrigger ? "More options" : undefined}
            onClick={() => setOpen(true)}
          >
            {iconTrigger ? (
              <MoreHorizontal className="size-5" strokeWidth={2} aria-hidden />
            ) : (
              triggerContent(false)
            )}
          </button>
        ) : (
          <div className={iconTrigger ? "size-[52px]" : "h-[52px]"} style={iconTrigger ? undefined : { width: FINISH_MENU_WIDTH_PX }} aria-hidden />
        )}
      </div>
      {openMenu}
    </>
  )
}

export { PracticeSessionFinishMenu }
