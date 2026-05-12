import {
  type Annotation,
  type AnnotationState,
  type AnnotationTool,
  MAX_ANNOTATION_HISTORY,
  DEFAULT_ANNOTATION_COLOR,
  DEFAULT_FONT_SIZE,
  DEFAULT_PEN_WIDTH,
} from "./types"

export type AnnotationAction =
  | { type: "ADD"; annotation: Annotation }
  | { type: "UPDATE"; id: string; patch: Partial<Annotation>; skipHistory?: boolean }
  | { type: "DELETE"; id: string }
  | { type: "SELECT"; id: string | null }
  | { type: "SET_TOOL"; tool: AnnotationTool }
  | { type: "SET_COLOR"; color: string }
  | { type: "SET_STROKE_WIDTH"; width: number }
  | { type: "SET_FONT_SIZE"; fontSize: number }
  | /** Begin a gesture (e.g. drag); subsequent UPDATE skipHistory undo as one step */
    { type: "PUSH_HISTORY_MARKER" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR" }

function cloneAnnotations(list: Annotation[]): Annotation[] {
  return structuredClone(list) as Annotation[]
}

function pushPast(state: AnnotationState): AnnotationState {
  const snapshot = cloneAnnotations(state.annotations)
  const past = [...state.past, snapshot]
  const trimmed =
    past.length > MAX_ANNOTATION_HISTORY ? past.slice(past.length - MAX_ANNOTATION_HISTORY) : past
  return { ...state, past: trimmed, future: [] }
}

function mergePatch(ann: Annotation, patch: Partial<Annotation>): Annotation {
  return { ...ann, ...patch } as Annotation
}

export function createInitialAnnotationState(
  overrides: Partial<
    Pick<AnnotationState, "tool" | "color" | "strokeWidth" | "fontSize">
  > = {},
): AnnotationState {
  return {
    annotations: [],
    past: [],
    future: [],
    selectedId: null,
    tool: overrides.tool ?? "pen",
    color: overrides.color ?? DEFAULT_ANNOTATION_COLOR,
    strokeWidth: overrides.strokeWidth ?? DEFAULT_PEN_WIDTH,
    fontSize: overrides.fontSize ?? DEFAULT_FONT_SIZE,
  }
}

export function annotationReducer(state: AnnotationState, action: AnnotationAction): AnnotationState {
  switch (action.type) {
    case "ADD": {
      const next = pushPast(state)
      return {
        ...next,
        annotations: [...next.annotations, action.annotation],
        selectedId: action.annotation.kind === "text" ? action.annotation.id : next.selectedId,
      }
    }
    case "UPDATE": {
      const idx = state.annotations.findIndex((a) => a.id === action.id)
      if (idx < 0) return state
      const current = state.annotations[idx]
      if (!current) return state
      const updated = mergePatch(current, action.patch)
      if (action.skipHistory) {
        const annotations = [...state.annotations]
        annotations[idx] = updated
        return { ...state, annotations }
      }
      const next = pushPast(state)
      const annotations = [...next.annotations]
      annotations[idx] = updated
      return { ...next, annotations }
    }
    case "DELETE": {
      const next = pushPast(state)
      const annotations = next.annotations.filter((a) => a.id !== action.id)
      const selectedId = next.selectedId === action.id ? null : next.selectedId
      return { ...next, annotations, selectedId }
    }
    case "SELECT":
      return { ...state, selectedId: action.id }
    case "SET_TOOL":
      return { ...state, tool: action.tool }
    case "SET_COLOR":
      return { ...state, color: action.color }
    case "SET_STROKE_WIDTH":
      return { ...state, strokeWidth: action.width }
    case "SET_FONT_SIZE":
      return { ...state, fontSize: action.fontSize }
    case "PUSH_HISTORY_MARKER":
      return pushPast(state)
    case "UNDO": {
      if (state.past.length === 0) return state
      const newPast = state.past.slice(0, -1)
      const previous = state.past[state.past.length - 1]
      if (!previous) return state
      const future = [cloneAnnotations(state.annotations), ...state.future]
      const selectedId =
        state.selectedId && previous.some((a) => a.id === state.selectedId) ? state.selectedId : null
      return {
        ...state,
        annotations: cloneAnnotations(previous),
        past: newPast,
        future,
        selectedId,
      }
    }
    case "REDO": {
      if (state.future.length === 0) return state
      const [nextPresent, ...restFuture] = state.future
      if (!nextPresent) return state
      const past = [...state.past, cloneAnnotations(state.annotations)]
      const trimmed =
        past.length > MAX_ANNOTATION_HISTORY ? past.slice(past.length - MAX_ANNOTATION_HISTORY) : past
      const selectedId =
        state.selectedId && nextPresent.some((a) => a.id === state.selectedId) ? state.selectedId : null
      return {
        ...state,
        annotations: cloneAnnotations(nextPresent),
        past: trimmed,
        future: restFuture,
        selectedId,
      }
    }
    case "CLEAR": {
      if (state.annotations.length === 0) return state
      const next = pushPast(state)
      return { ...next, annotations: [], selectedId: null }
    }
    default:
      return state
  }
}
