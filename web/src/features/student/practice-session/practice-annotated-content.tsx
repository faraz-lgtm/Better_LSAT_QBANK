import { useMemo, useRef, type ElementType, type HTMLAttributes, type MouseEvent } from "react"

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
  toolMode?: PracticeToolMode
  onMouseUp: (regionKey: RegionKey, container: HTMLElement | null, event?: MouseEvent) => void
  onClickCapture?: (regionKey: RegionKey, container: HTMLElement | null, event: MouseEvent) => void
}

function PracticeAnnotatedContent({
  regionKey,
  html,
  findQuery,
  as,
  scrollAnchor,
  toolMode,
  onMouseUp,
  onClickCapture,
  className,
  ...rest
}: PracticeAnnotatedContentProps) {
  const ref = useRef<HTMLElement>(null)
  const normalizedHtml = useMemo(() => normalizePracticeSessionHtml(html), [html])

  return (
    <FindableHtmlContent
      ref={ref}
      as={as}
      html={normalizedHtml}
      findQuery={findQuery}
      scrollAnchor={scrollAnchor}
      className={cn(
        "practice-session-content",
        toolMode && toolMode !== "none" && "select-text cursor-text",
        className,
      )}
      onMouseUp={(e) => onMouseUp(regionKey, ref.current, e)}
      onClickCapture={
        toolMode === "eraser" && onClickCapture
          ? (e) => onClickCapture(regionKey, ref.current, e)
          : undefined
      }
      {...rest}
    />
  )
}

export { PracticeAnnotatedContent }
