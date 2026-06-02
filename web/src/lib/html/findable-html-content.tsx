import { forwardRef, useEffect, useMemo, useImperativeHandle, useRef, type ElementType, type HTMLAttributes } from "react"

import { highlightFindInHtml } from "@/lib/html/highlight-find-in-html"
import { LSAT_HTML_CONTENT_CLASS } from "@/lib/html/html-content"
import { sanitizeHtml } from "@/lib/html/sanitize-html"
import { cn } from "@/lib/utils"

type FindableHtmlContentProps = Omit<HTMLAttributes<HTMLElement>, "children" | "dangerouslySetInnerHTML"> & {
  html: unknown
  findQuery?: string
  as?: ElementType
  scrollAnchor?: boolean
}

const FindableHtmlContent = forwardRef<HTMLElement, FindableHtmlContentProps>(function FindableHtmlContent(
  { html, findQuery = "", as: Tag = "div", className, scrollAnchor, ...rest },
  forwardedRef,
) {
  const innerRef = useRef<HTMLElement>(null)
  useImperativeHandle(forwardedRef, () => innerRef.current as HTMLElement)

  const safe = sanitizeHtml(html)
  const rendered = useMemo(() => highlightFindInHtml(safe, findQuery), [safe, findQuery])

  useEffect(() => {
    if (!scrollAnchor || !findQuery.trim() || !innerRef.current) return
    const mark = innerRef.current.querySelector("mark.practice-find-mark")
    mark?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, [scrollAnchor, findQuery, rendered])

  if (!rendered) return null

  return (
    <Tag
      ref={innerRef}
      className={cn(LSAT_HTML_CONTENT_CLASS, className)}
      dangerouslySetInnerHTML={{ __html: rendered }}
      {...rest}
    />
  )
})

export { FindableHtmlContent }
