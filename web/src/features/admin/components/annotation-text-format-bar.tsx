import { Bold, Italic, Underline } from "lucide-react"
import type { RefObject } from "react"

import { Button } from "@/components/ui/button"

type AnnotationTextFormatBarProps = {
  editorRef: RefObject<HTMLElement | null>
  className?: string
}

/** Keeps selection inside `contenteditable` when clicking toolbar (mousedown preventDefault). */
function AnnotationTextFormatBar({ editorRef, className }: AnnotationTextFormatBarProps) {
  function run(cmd: string) {
    const el = editorRef.current
    if (!el) return
    el.focus()
    document.execCommand(cmd, false)
  }

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className={className}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="flex items-center gap-0.5 rounded-md border border-border bg-popover px-0.5 py-0.5 shadow-md">
        <Button type="button" variant="ghost" size="icon-xs" title="Bold" onClick={() => run("bold")}>
          <Bold className="size-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon-xs" title="Italic" onClick={() => run("italic")}>
          <Italic className="size-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon-xs" title="Underline" onClick={() => run("underline")}>
          <Underline className="size-3.5" />
        </Button>
        <label className="ml-0.5 flex cursor-pointer items-center px-0.5" title="Selection color">
          <input
            type="color"
            className="h-6 w-6 cursor-pointer rounded border border-border bg-transparent p-0"
            defaultValue="#000000"
            onChange={(ev) => {
              document.execCommand("styleWithCSS", false, "true")
              document.execCommand("foreColor", false, ev.target.value)
            }}
          />
        </label>
      </div>
    </div>
  )
}

export { AnnotationTextFormatBar }
