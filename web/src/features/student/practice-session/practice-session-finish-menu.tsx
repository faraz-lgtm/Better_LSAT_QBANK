import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"

const MENU_MIN_WIDTH = 220

type PracticeSessionFinishMenuProps = {
  disabled?: boolean
  finishing?: boolean
  /** Section intro screen only needs Exit (saved progress). */
  exitOnly?: boolean
  finishLabel?: string
  submitLabel?: string
  buttonClassName?: string
  onSubmitSection: () => void
  onExit: () => void
}

function PracticeSessionFinishMenu({
  disabled = false,
  finishing = false,
  exitOnly = false,
  finishLabel,
  submitLabel = "Submit Section",
  buttonClassName,
  onSubmitSection,
  onExit,
}: PracticeSessionFinishMenuProps) {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(
    null,
  )
  const containerRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLUListElement | null>(null)

  useLayoutEffect(() => {
    if (!open || !containerRef.current) {
      setMenuPosition(null)
      return
    }

    function updatePosition() {
      const trigger = containerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const width = Math.max(MENU_MIN_WIDTH, rect.width)
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.right - width,
        width,
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

  const menu =
    open && menuPosition
      ? createPortal(
          <ul
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              zIndex: 60,
            }}
            className="overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white p-1 shadow-[0px_24px_24px_rgba(13,13,18,0.12)]"
          >
            {exitOnly ? null : (
              <li role="presentation">
                <button
                  type="button"
                  role="menuitem"
                  className="flex h-10 w-full items-center rounded-xl px-3 text-sm font-medium tracking-[0.02em] text-[#062357] transition-colors hover:bg-[#f6f8fa]"
                  onClick={() => {
                    setOpen(false)
                    onSubmitSection()
                  }}
                >
                  {submitLabel}
                </button>
              </li>
            )}
            <li role="presentation">
              <button
                type="button"
                role="menuitem"
                className="flex h-10 w-full items-center rounded-xl px-3 text-sm font-medium tracking-[0.02em] text-[#062357] transition-colors hover:bg-[#f6f8fa]"
                onClick={() => {
                  setOpen(false)
                  onExit()
                }}
              >
                Exit (Saved Progress)
              </button>
            </li>
          </ul>,
          document.body,
        )
      : null

  return (
    <div ref={containerRef} className="relative shrink-0">
      <Button
        type="button"
        disabled={disabled || finishing}
        variant="outline"
        size="default"
        className={buttonClassName ?? "h-[52px] gap-1 px-4"}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {finishing ? "Finishing…" : (finishLabel ?? "Finish")}
        <ChevronDown className="size-5 opacity-90" strokeWidth={2} aria-hidden />
      </Button>
      {menu}
    </div>
  )
}

export { PracticeSessionFinishMenu }
