import { PracticeSessionSideWidget } from "@/features/student/practice-session/practice-session-side-action-rail"
import type { PracticeToolMode } from "@/features/student/practice-session/practice-session-types"
import { useResponseMasking } from "@/features/student/practice-session/use-response-masking"

type PracticeSessionMobileToolsOverlayProps = {
  questionId: string
  flagged: boolean
  onToggleFlag: () => void
  flagsDisabled?: boolean
  onReview?: () => void
  reviewActive?: boolean
  onAccessibility?: () => void
  onFullscreen?: () => void
  fullView?: boolean
  onExpandedChange: (expanded: boolean) => void
  onKeyboardHighlight?: () => void
  keyboardHighlightActive?: boolean
  toolMode?: PracticeToolMode
}

/** Figma `21453:49252` — mobile tools menu overlay (session-body). */
function PracticeSessionMobileToolsOverlay({
  questionId,
  flagged,
  onToggleFlag,
  flagsDisabled,
  onReview,
  reviewActive,
  onAccessibility,
  onFullscreen,
  fullView,
  onExpandedChange,
  onKeyboardHighlight,
  keyboardHighlightActive,
}: PracticeSessionMobileToolsOverlayProps) {
  const { responseMasking, toggleResponseMasking } = useResponseMasking(questionId)

  return (
    <PracticeSessionSideWidget
      variant="official"
      mobileOverlay
      expanded
      onExpandedChange={onExpandedChange}
      flagged={flagged}
      onToggleFlag={onToggleFlag}
      flagsDisabled={flagsDisabled}
      responseMasking={responseMasking}
      onToggleResponseMasking={toggleResponseMasking}
      onReview={onReview}
      reviewActive={reviewActive}
      onAccessibility={onAccessibility}
      onFullscreen={onFullscreen}
      fullView={fullView}
      onKeyboardHighlight={onKeyboardHighlight}
      keyboardHighlightActive={keyboardHighlightActive}
    />
  )
}

export { PracticeSessionMobileToolsOverlay }
