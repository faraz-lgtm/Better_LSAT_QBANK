import { useMemo, useRef, type ElementType, type HTMLAttributes, type MouseEvent } from "react"

import type { PracticeToolMode, RegionKey } from "@/features/student/practice-session/practice-session-types"
import { FindableHtmlContent } from "@/lib/html/findable-html-content"
import { normalizePracticeSessionHtml } from "@/lib/html/normalize-practice-session-html"
import { cn } from "@/lib/utils"

type PracticeAnnotatedContentProps = Omit<
  HTMLAttributes<HTMLElement>,
  "children" | "dangerouslySetInnerHTML" | "onMouseUp" | "onClickCapture" | "onTouchEnd"
> & {
  regionKey: RegionKey
  html: string
  findQuery?: string
  as?: ElementType
  scrollAnchor?: boolean
  /** When set with onMouseUp, enables passage annotation gestures on this node. */
  toolMode?: PracticeToolMode
  onMouseUp?: (regionKey: RegionKey, container: HTMLElement | null, event?: MouseEvent) => void
  onClickCapture?: (regionKey: RegionKey, container: HTMLElement | null, event: MouseEvent) => void
}

function PracticeAnnotatedContent({
  regionKey,
  html,
  findQuery,
  as,
  scrollAnchor,
  toolMode = "none",
  onMouseUp,
  onClickCapture,
  className,
  ...rest
}: PracticeAnnotatedContentProps) {
  const normalizedHtml = useMemo(() => normalizePracticeSessionHtml(html), [html])
  const annotate = onMouseUp != null
  /** Skip the synthetic mouseup that follows touchend so we don't open the menu twice. */
  const skipNextMouseUpRef = useRef(false)

  return (
    <FindableHtmlContent
      as={as}
      html={normalizedHtml}
      findQuery={findQuery}
      scrollAnchor={scrollAnchor}
      className={cn("practice-session-content", annotate && "select-text cursor-text", className)}
      onMouseUp={
        annotate
          ? (e) => {
              if (skipNextMouseUpRef.current) {
                skipNextMouseUpRef.current = false
                return
              }
              onMouseUp(regionKey, e.currentTarget as HTMLElement, e)
            }
          : undefined
      }
      onTouchEnd={
        annotate
          ? (e) => {
              const container = e.currentTarget as HTMLElement
              // Let the browser finish updating the selection after a long-press drag.
              window.setTimeout(() => {
                const selection = window.getSelection()
                if (!selection || selection.isCollapsed || selection.rangeCount === 0) return
                skipNextMouseUpRef.current = true
                onMouseUp(regionKey, container)
              }, 0)
            }
          : undefined
      }
      onClickCapture={
        annotate && toolMode === "eraser" && onClickCapture
          ? (e) => onClickCapture(regionKey, e.currentTarget as HTMLElement, e)
          : undefined
      }
      {...rest}
    />
  )
}

export { PracticeAnnotatedContent }
