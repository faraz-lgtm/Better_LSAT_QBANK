import {
  Circle,
  Eraser,
  Highlighter,
  Minus,
  MousePointer2,
  Pencil,
  Redo2,
  Square,
  Trash2,
  TrendingUp,
  Type,
  Undo2,
} from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { AnnotationTool } from "@/features/admin/lib/annotations/types"
import { cn } from "@/lib/utils"

const SWATCHES = ["#dc2626", "#2563eb", "#16a34a", "#ca8a04", "#9333ea", "#0f172a", "#eab308"]

const PEN_WIDTHS = [
  { label: "S", value: "1.5" },
  { label: "M", value: "2.5" },
  { label: "L", value: "4" },
]

const HIGHLIGHT_WIDTHS = [
  { label: "S", value: "8" },
  { label: "M", value: "16" },
  { label: "L", value: "24" },
]

const SHAPE_WIDTHS = [
  { label: "S", value: "1.5" },
  { label: "M", value: "2.5" },
  { label: "L", value: "4" },
]

const FONT_SIZES = ["14", "16", "18", "22", "28"].map((n) => ({ label: `${n}px`, value: n }))

type AnnotationToolbarProps = {
  tool: AnnotationTool
  color: string
  strokeWidth: number
  fontSize: number
  canUndo: boolean
  canRedo: boolean
  toolsHidden: boolean
  onToolsHiddenChange: (hidden: boolean) => void
  onTool: (t: AnnotationTool) => void
  onColor: (c: string) => void
  onStrokeWidth: (w: number) => void
  onFontSize: (n: number) => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  clearDisabled?: boolean
  selectedId?: string | null
  onDeleteSelected?: () => void
  className?: string
}

function ToolBtn({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean
  title: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      size="icon-xs"
      variant={active ? "default" : "outline"}
      className="shrink-0"
      title={title}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function AnnotationToolbar({
  tool,
  color,
  strokeWidth,
  fontSize,
  canUndo,
  canRedo,
  toolsHidden,
  onToolsHiddenChange,
  onTool,
  onColor,
  onStrokeWidth,
  onFontSize,
  onUndo,
  onRedo,
  onClear,
  clearDisabled,
  selectedId,
  onDeleteSelected,
  className,
}: AnnotationToolbarProps) {
  const widthOptions =
    tool === "highlighter" ? HIGHLIGHT_WIDTHS : tool === "pen" ? PEN_WIDTHS : SHAPE_WIDTHS
  const widthValue = String(
    widthOptions.reduce((prev, o) => {
      const v = Number(o.value)
      return Math.abs(v - strokeWidth) < Math.abs(prev - strokeWidth) ? v : prev
    }, Number(widthOptions[0]?.value ?? strokeWidth)),
  )

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <div className="flex items-center gap-1.5 border-r border-border pr-2">
        <span className="text-muted-foreground hidden text-xs whitespace-nowrap sm:inline">Hide bar</span>
        <Switch
          checked={toolsHidden}
          onChange={(e) => onToolsHiddenChange(e.target.checked)}
          aria-label="Hide annotation tools in header"
        />
      </div>

      {!toolsHidden ? (
        <>
          <div className="flex flex-wrap items-center gap-0.5">
            <ToolBtn active={tool === "select"} title="Select" onClick={() => onTool("select")}>
              <MousePointer2 className="size-3.5" />
            </ToolBtn>
            <ToolBtn active={tool === "pen"} title="Pen" onClick={() => onTool("pen")}>
              <Pencil className="size-3.5" />
            </ToolBtn>
            <ToolBtn active={tool === "highlighter"} title="Highlighter" onClick={() => onTool("highlighter")}>
              <Highlighter className="size-3.5" />
            </ToolBtn>
            <ToolBtn active={tool === "rect"} title="Rectangle" onClick={() => onTool("rect")}>
              <Square className="size-3.5" />
            </ToolBtn>
            <ToolBtn active={tool === "ellipse"} title="Ellipse" onClick={() => onTool("ellipse")}>
              <Circle className="size-3.5" />
            </ToolBtn>
            <ToolBtn active={tool === "line"} title="Line" onClick={() => onTool("line")}>
              <Minus className="size-3.5" />
            </ToolBtn>
            <ToolBtn active={tool === "arrow"} title="Arrow" onClick={() => onTool("arrow")}>
              <TrendingUp className="size-3.5" />
            </ToolBtn>
            <ToolBtn active={tool === "text"} title="Text" onClick={() => onTool("text")}>
              <Type className="size-3.5" />
            </ToolBtn>
          </div>

          <div className="flex items-center gap-0.5 border-l border-border pl-2">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                className={cn(
                  "size-6 shrink-0 rounded border-2 transition-transform hover:scale-105",
                  color.toLowerCase() === c.toLowerCase() ? "border-foreground ring-1 ring-ring" : "border-transparent",
                )}
                style={{ backgroundColor: c }}
                onClick={() => onColor(c)}
              />
            ))}
            <label className="ml-0.5 flex cursor-pointer items-center" title="Custom color">
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : "#000000"}
                className="h-6 w-7 cursor-pointer rounded border border-border bg-background p-0"
                onChange={(e) => onColor(e.target.value)}
              />
            </label>
          </div>

          <div className="flex items-center gap-1 border-l border-border pl-2">
            <span className="text-muted-foreground text-xs whitespace-nowrap">Width</span>
            <div className="w-16">
              <Select
                aria-label="Stroke width"
                className="h-8 py-0 pr-8 text-xs"
                value={widthValue}
                options={widthOptions}
                onChange={(e) => onStrokeWidth(Number(e.target.value))}
              />
            </div>
          </div>

          {tool === "text" ? (
            <div className="flex items-center gap-1 border-l border-border pl-2">
              <span className="text-muted-foreground text-xs whitespace-nowrap">Size</span>
              <div className="w-[4.5rem]">
                <Select
                  aria-label="Font size"
                  className="h-8 py-0 pr-8 text-xs"
                  value={String(fontSize)}
                  options={FONT_SIZES}
                  onChange={(e) => onFontSize(Number(e.target.value))}
                />
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-0.5 border-l border-border pl-2">
            <Button type="button" size="icon-xs" variant="outline" title="Undo" disabled={!canUndo} onClick={onUndo}>
              <Undo2 className="size-3.5" />
            </Button>
            <Button type="button" size="icon-xs" variant="outline" title="Redo" disabled={!canRedo} onClick={onRedo}>
              <Redo2 className="size-3.5" />
            </Button>
            <Button type="button" size="icon-xs" variant="outline" title="Clear all" disabled={clearDisabled} onClick={onClear}>
              <Eraser className="size-3.5" />
            </Button>
            {selectedId && onDeleteSelected ? (
              <Button
                type="button"
                size="icon-xs"
                variant="destructive"
                title="Delete selected"
                onClick={onDeleteSelected}
              >
                <Trash2 className="size-3.5" />
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  )
}

export { AnnotationToolbar, SWATCHES }
