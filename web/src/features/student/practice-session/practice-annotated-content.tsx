import { useMemo, type ElementType, type HTMLAttributes, type MouseEvent } from "react"

import type { PracticeToolMode, RegionKey } from "@/features/student/practice-session/practice-session-types"
import { FindableHtmlContent } from "@/lib/html/findable-html-content"
import { normalizePracticeSessionHtml } from "@/lib/html/normalize-practice-session-html"
import { cn } from "@/lib/utils"

type PracticeAnnotatedContentProps = Omit<
  HTMLAttributes<HTMLElement>,
  "children" | "dangerouslySetInnerHTML" | "onMouseUp" | "onClickCapture"
> & {
  regionKey: RegionKey
  html: string
  findQuery?: string
  as?: ElementType
  scrollAnchor?: boolean
  /** When set (and not "none"), enables passage annotation gestures on this node. */
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
  const annotate = toolMode !== "none" && onMouseUp != null

  return (
    <FindableHtmlContent
      as={as}
      html={normalizedHtml}
      findQuery={findQuery}
      scrollAnchor={scrollAnchor}
      className={cn("practice-session-content", annotate && "select-text cursor-text", className)}
      onMouseUp={annotate ? (e) => onMouseUp(regionKey, e.currentTarget as HTMLElement, e) : undefined}
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
