export type AnnotationTool =
  | "select"
  | "pen"
  | "highlighter"
  | "rect"
  | "ellipse"
  | "line"
  | "arrow"
  | "text"

export interface PenAnnotation {
  kind: "pen" | "highlight"
  id: string
  color: string
  width: number
  points: Array<{ x: number; y: number }>
}

export interface ShapeAnnotation {
  kind: "rect" | "ellipse" | "line" | "arrow"
  id: string
  color: string
  width: number
  start: { x: number; y: number }
  end: { x: number; y: number }
}

export interface TextAnnotation {
  kind: "text"
  id: string
  position: { x: number; y: number }
  width: number
  fontSize: number
  color: string
  html: string
}

export type Annotation = PenAnnotation | ShapeAnnotation | TextAnnotation

export type AnnotationState = {
  annotations: Annotation[]
  past: Annotation[][]
  future: Annotation[][]
  selectedId: string | null
  tool: AnnotationTool
  color: string
  strokeWidth: number
  fontSize: number
}

export const DEFAULT_ANNOTATION_COLOR = "#dc2626"
export const DEFAULT_PEN_WIDTH = 2.5
export const DEFAULT_HIGHLIGHTER_WIDTH = 16
export const DEFAULT_FONT_SIZE = 16
export const MAX_ANNOTATION_HISTORY = 50
