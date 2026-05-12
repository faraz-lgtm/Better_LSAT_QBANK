import { useEffect, useRef } from "react"

import { AnnotationTextFormatBar } from "@/features/admin/components/annotation-text-format-bar"
import { sanitizeAnnotationTextHtml } from "@/features/admin/lib/annotations/sanitize-text-html"
import type { TextAnnotation } from "@/features/admin/lib/annotations/types"
import { cn } from "@/lib/utils"

type AnnotationTextBoxProps = {
  ann: TextAnnotation
  selected: boolean
  editing: boolean
  onCommit: (id: string, html: string) => void
  onCancel: (id: string) => void
  onSelect: (id: string) => void
  /** When tool is Select, start moving this annotation (document-level drag). */
  onBeginSelectDrag?: (e: React.PointerEvent, id: string) => void
}

function AnnotationTextBox({
  ann,
  selected,
  editing,
  onCommit,
  onCancel,
  onSelect,
  onBeginSelectDrag,
}: AnnotationTextBoxProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editing || !editorRef.current) return
    const el = editorRef.current
    el.innerHTML = ann.html || ""
    requestAnimationFrame(() => {
      el.focus()
      const range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    })
  }, [editing, ann.id, ann.html])

  function commitFromEditor() {
    const el = editorRef.current
    if (!el) return
    const raw = el.innerHTML.trim() === "" || el.innerHTML === "<br>" ? "" : el.innerHTML
    onCommit(ann.id, sanitizeAnnotationTextHtml(raw))
  }

  const displayHtml = sanitizeAnnotationTextHtml(ann.html)

  return (
    <div
      className={cn(
        "absolute min-w-[120px] max-w-[min(90vw,28rem)] rounded border bg-background/95 p-1 shadow-sm",
        selected ? "border-primary ring-2 ring-primary/30" : "border-border",
        editing ? "z-[40]" : "z-[30]",
      )}
      style={{
        left: ann.position.x,
        top: ann.position.y,
        width: ann.width,
        fontSize: ann.fontSize,
        color: ann.color,
      }}
      onPointerDown={(e) => {
        if (editing) return
        onSelect(ann.id)
        onBeginSelectDrag?.(e, ann.id)
      }}
    >
      {editing ? (
        <div className="relative pt-1">
          <AnnotationTextFormatBar
            editorRef={editorRef}
            className="absolute -top-10 left-0 z-10 flex w-full justify-center"
          />
          <div
            ref={editorRef}
            data-annotation-text-editor
            role="textbox"
            tabIndex={0}
            aria-multiline="true"
            contentEditable
            suppressContentEditableWarning
            className="min-h-[1.5em] cursor-text font-serif leading-snug outline-none"
            style={{ fontSize: ann.fontSize, color: ann.color }}
            onBlur={() => {
              commitFromEditor()
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault()
                const el = editorRef.current
                if (el) el.innerHTML = ann.html || ""
                onCancel(ann.id)
              }
            }}
          />
        </div>
      ) : (
        <div
          className="cursor-pointer font-serif leading-snug select-none"
          style={{ fontSize: ann.fontSize, color: ann.color }}
          dangerouslySetInnerHTML={{
            __html: displayHtml || '<span class="text-muted-foreground"> </span>',
          }}
        />
      )}
    </div>
  )
}

export { AnnotationTextBox }
