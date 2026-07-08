import { ZOOM_SCALE_STEPS } from "@/features/student/practice-session/practice-session-accessibility"

function getZoomShortcutModifierLabel(): string {
  if (typeof navigator === "undefined") return "Ctrl"
  return /Mac|iPhone|iPad/i.test(navigator.platform) ? "Cmd" : "Ctrl"
}

function clampZoomScale(value: number): number {
  const steps = ZOOM_SCALE_STEPS as readonly number[]
  if (value <= steps[0]!) return steps[0]!
  if (value >= steps[steps.length - 1]!) return steps[steps.length - 1]!
  return value
}

function getNextZoomScale(current: number): number {
  const steps = ZOOM_SCALE_STEPS as readonly number[]
  const index = steps.findIndex((step) => step === current)
  const nextIndex = index < 0 ? 0 : Math.min(index + 1, steps.length - 1)
  return steps[nextIndex]!
}

function getPreviousZoomScale(current: number): number {
  const steps = ZOOM_SCALE_STEPS as readonly number[]
  const index = steps.findIndex((step) => step === current)
  const previousIndex = index < 0 ? 0 : Math.max(index - 1, 0)
  return steps[previousIndex]!
}

function getDefaultZoomScale(): number {
  return ZOOM_SCALE_STEPS[0]!
}

function isPracticeSessionZoomInShortcut(event: KeyboardEvent): boolean {
  if (!event.ctrlKey && !event.metaKey) return false
  return event.key === "+" || event.key === "=" || event.code === "Equal" || event.code === "NumpadAdd"
}

function isPracticeSessionZoomOutShortcut(event: KeyboardEvent): boolean {
  if (!event.ctrlKey && !event.metaKey) return false
  return event.key === "-" || event.key === "_" || event.code === "Minus" || event.code === "NumpadSubtract"
}

function isPracticeSessionZoomResetShortcut(event: KeyboardEvent): boolean {
  if (!event.ctrlKey && !event.metaKey) return false
  return event.key === "0" || event.code === "Digit0" || event.code === "Numpad0"
}

function resolvePracticeSessionZoomShortcutAction(
  event: KeyboardEvent,
): "zoom-in" | "zoom-out" | "zoom-reset" | null {
  if (isPracticeSessionZoomResetShortcut(event)) return "zoom-reset"
  if (isPracticeSessionZoomInShortcut(event)) return "zoom-in"
  if (isPracticeSessionZoomOutShortcut(event)) return "zoom-out"
  return null
}

export {
  clampZoomScale,
  getDefaultZoomScale,
  getNextZoomScale,
  getPreviousZoomScale,
  getZoomShortcutModifierLabel,
  isPracticeSessionZoomInShortcut,
  isPracticeSessionZoomOutShortcut,
  isPracticeSessionZoomResetShortcut,
  resolvePracticeSessionZoomShortcutAction,
}
