import { useCallback, useMemo, useReducer } from "react"

import {
  annotationReducer,
  createInitialAnnotationState,
  type AnnotationAction,
} from "@/features/admin/lib/annotations/annotation-state"
import type { Annotation, AnnotationState } from "@/features/admin/lib/annotations/types"

export function useAnnotationState(
  initial?: Partial<Pick<AnnotationState, "tool" | "color" | "strokeWidth" | "fontSize">>,
) {
  const [state, dispatch] = useReducer(
    annotationReducer,
    initial ?? {},
    (init: Partial<Pick<AnnotationState, "tool" | "color" | "strokeWidth" | "fontSize">>) =>
      createInitialAnnotationState(init),
  )

  const actions = useMemo(
    () => ({
      add: (annotation: Annotation) => dispatch({ type: "ADD", annotation }),
      update: (id: string, patch: Partial<Annotation>, skipHistory?: boolean) =>
        dispatch({ type: "UPDATE", id, patch, skipHistory }),
      delete: (id: string) => dispatch({ type: "DELETE", id }),
      select: (id: string | null) => dispatch({ type: "SELECT", id }),
      setTool: (tool: AnnotationState["tool"]) => dispatch({ type: "SET_TOOL", tool }),
      setColor: (color: string) => dispatch({ type: "SET_COLOR", color }),
      setStrokeWidth: (width: number) => dispatch({ type: "SET_STROKE_WIDTH", width }),
      setFontSize: (fontSize: number) => dispatch({ type: "SET_FONT_SIZE", fontSize }),
      undo: () => dispatch({ type: "UNDO" }),
      redo: () => dispatch({ type: "REDO" }),
      clear: () => dispatch({ type: "CLEAR" }),
      pushHistoryMarker: () => dispatch({ type: "PUSH_HISTORY_MARKER" }),
    }),
    [],
  )

  const canUndo = state.past.length > 0
  const canRedo = state.future.length > 0

  const dispatchRaw = useCallback((a: AnnotationAction) => dispatch(a), [])

  return { state, ...actions, canUndo, canRedo, dispatch: dispatchRaw }
}
