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

const DEFAULT_RECAP_BG = "#0d47a1"
const RECAP_GRADIENT = "linear-gradient(90deg, var(--primary) 0%, #419df8 100%)"

function isRecapDefaultColor(raw: string): boolean {
  const normalized = raw.trim().toLowerCase()
  return normalized === DEFAULT_RECAP_BG || normalized === "var(--primary)"
}

function isDarkHexColor(raw: string): boolean {
  if (!isSafeHexColor(raw)) return false
  const hex = raw.trim().slice(1)
  const full = hex.length === 3 ? hex.split("").map((c) => `${c}${c}`).join("") : hex
  const r = Number.parseInt(full.slice(0, 2), 16)
  const g = Number.parseInt(full.slice(2, 4), 16)
  const b = Number.parseInt(full.slice(4, 6), 16)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance < 160
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
          : DEFAULT_RECAP_BG
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
    return (
      <div className={cn("lesson-html-content", className)}>
        <div className={cn(LSAT_HTML_CONTENT_CLASS, "lesson-html-body")} dangerouslySetInnerHTML={{ __html: safe }} />
      </div>
    )
  }

  return (
    <div className={cn("lesson-html-content flex w-full min-w-0 flex-col gap-12", className)}>
      {blocks.map((block, i) => {
        if (block.kind === "html") {
          return (
            <div
              key={i}
              className={cn(LSAT_HTML_CONTENT_CLASS, "lesson-html-body")}
              dangerouslySetInnerHTML={{ __html: block.html }}
            />
          )
        }
        const isCallout = block.variant === "heading"
        if (isCallout) {
          return (
            <aside
              key={i}
              className="lesson-callout flex w-full min-w-0 flex-col gap-2.5 border-l-4 border-solid border-[var(--primary)] pl-[26px]"
            >
              {block.label ? (
                <p className="m-0 text-xs font-bold leading-[1.5] tracking-[0.24px] text-[var(--primary)]">{block.label}</p>
              ) : null}
              {block.innerHtml.trim() ? (
                <div
                  className={cn(LSAT_HTML_CONTENT_CLASS, "lesson-callout-body")}
                  dangerouslySetInnerHTML={{ __html: block.innerHtml }}
                />
              ) : (
                <div className="min-h-[24px]" />
              )}
            </aside>
          )
        }
        return (
          <section
            key={i}
            className="lesson-section-empty flex w-full min-w-0 flex-col gap-2 overflow-clip rounded-[20px] border-0"
            style={isRecapDefaultColor(block.backgroundColor) ? { background: RECAP_GRADIENT } : { backgroundColor: block.backgroundColor }}
          >
            {block.label ? (
              <p className={`m-0 text-xs font-bold uppercase leading-[1.5] tracking-[0.24px] ${isDarkHexColor(block.backgroundColor) ? "text-white" : "text-[var(--primary)]"}`}>
                {block.label}
              </p>
            ) : null}
            {block.innerHtml.trim() ? (
              <div
                className={cn(LSAT_HTML_CONTENT_CLASS, "lesson-section-body", isDarkHexColor(block.backgroundColor) && "lesson-section-body--inverse")}
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
