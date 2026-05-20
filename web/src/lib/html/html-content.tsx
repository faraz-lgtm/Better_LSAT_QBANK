import type { ElementType, HTMLAttributes } from "react"

import { cn } from "@/lib/utils"
import { sanitizeHtml } from "@/lib/html/sanitize-html"

export const LSAT_HTML_CONTENT_CLASS = "lsat-html-content"

type HtmlContentProps = Omit<HTMLAttributes<HTMLElement>, "children" | "dangerouslySetInnerHTML"> & {
  html: unknown
  as?: ElementType
}

function HtmlContent({ html, as: Tag = "div", className, ...rest }: HtmlContentProps) {
  const safe = sanitizeHtml(html)
  if (!safe) return null

  return (
    <Tag
      className={cn(LSAT_HTML_CONTENT_CLASS, className)}
      dangerouslySetInnerHTML={{ __html: safe }}
      {...rest}
    />
  )
}

export { HtmlContent }
