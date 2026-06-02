import { useRef, type ElementType, type HTMLAttributes, type MouseEvent } from "react"

import type { PracticeToolMode, RegionKey } from "@/features/student/practice-session/practice-session-types"
import { FindableHtmlContent } from "@/lib/html/findable-html-content"
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

  return (
    <FindableHtmlContent
      ref={ref}
      as={as}
      html={html}
      findQuery={findQuery}
      scrollAnchor={scrollAnchor}
      className={cn("practice-session-content", className)}
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
