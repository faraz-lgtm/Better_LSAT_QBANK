import type { ElementType, HTMLAttributes } from "react"

import { cn } from "@/lib/utils"
import { sanitizeHtml, sanitizeLessonHtml } from "@/lib/html/sanitize-html"

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

type LessonBlock =
  | { kind: "section"; label: string; innerHtml: string; variant: "heading" | "empty"; backgroundColor: string }
  | { kind: "html"; html: string }

function isSafeHexColor(raw: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw.trim())
}

function serializeChild(node: ChildNode): string {
  if (node.nodeType === Node.ELEMENT_NODE) return (node as Element).outerHTML
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ""
  return ""
}

function parseLessonBlocks(html: string): LessonBlock[] {
  const trimmed = html.trim()
  if (!trimmed) return []
  if (typeof DOMParser === "undefined") return [{ kind: "html", html: trimmed }]

  const doc = new DOMParser().parseFromString(`<div id="lesson-html-root">${trimmed}</div>`, "text/html")
  const root = doc.getElementById("lesson-html-root")
  if (!root) return [{ kind: "html", html: trimmed }]

  const blocks: LessonBlock[] = []
  let htmlBuf = ""

  const flushHtml = () => {
    const next = htmlBuf.trim()
    if (next) blocks.push({ kind: "html", html: next })
    htmlBuf = ""
  }

  for (const node of Array.from(root.childNodes)) {
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : null
    if (el?.tagName.toLowerCase() === "section" && el.hasAttribute("data-lesson-section")) {
      flushHtml()
      const fromData = el.getAttribute("data-bg") ?? ""
      const fromStyle = (el as HTMLElement).style?.backgroundColor ?? ""
      const backgroundColor = isSafeHexColor(fromData)
        ? fromData.trim()
        : isSafeHexColor(fromStyle)
          ? fromStyle.trim()
          : "#ffffff"
      blocks.push({
        kind: "section",
        label: (el.getAttribute("data-label") ?? "").trim(),
        innerHtml: el.innerHTML,
        variant: el.getAttribute("data-variant") === "empty" ? "empty" : "heading",
        backgroundColor,
      })
      continue
    }
    htmlBuf += serializeChild(node)
  }
  flushHtml()
  return blocks
}

function LessonHtmlContent({ html, className }: { html: unknown; className?: string }) {
  const safe = sanitizeLessonHtml(html)
  if (!safe) return null

  const blocks = parseLessonBlocks(safe)
  if (!blocks.some((block) => block.kind === "section")) {
    return <div className={cn(LSAT_HTML_CONTENT_CLASS, className)} dangerouslySetInnerHTML={{ __html: safe }} />
  }

  let sectionIndex = 0

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {blocks.map((block, i) => {
        if (block.kind === "html") {
          return (
            <div
              key={i}
              className={cn(LSAT_HTML_CONTENT_CLASS, className)}
              dangerouslySetInnerHTML={{ __html: block.html }}
            />
          )
        }
        const isHeading = block.variant === "heading"
        if (isHeading) sectionIndex += 1
        return (
          <section
            key={i}
            className={`flex w-full min-w-0 flex-col overflow-clip rounded-[18px] border border-[#dfe1e7] ${isHeading ? "gap-4 p-6" : "lesson-section-empty gap-0"}`}
            style={{ backgroundColor: block.backgroundColor }}
          >
            {isHeading ? (
              <div className="flex items-center gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-[#edf3ff] bg-[#f3f7ff] text-center text-xs font-bold leading-[1.3] text-[#0d47a1]">
                  {sectionIndex}
                </div>
                {block.label ? (
                  <p className="m-0 text-xs font-bold uppercase leading-[1.5] tracking-[0.24px] text-[#0d47a1]">
                    {block.label}
                  </p>
                ) : null}
              </div>
            ) : null}
            {block.innerHtml.trim() ? (
              <div
                className={cn(LSAT_HTML_CONTENT_CLASS, "lesson-section-body")}
                dangerouslySetInnerHTML={{ __html: block.innerHtml }}
              />
            ) : (
              <div className="min-h-[48px]" />
            )}
          </section>
        )
      })}
    </div>
  )
}

export { HtmlContent, LessonHtmlContent }
