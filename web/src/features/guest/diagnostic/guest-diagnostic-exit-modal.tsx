import { PracticeSubmitSectionModal } from "@/features/student/practice-session/practice-submit-section-modal"

const GUEST_DIAGNOSTIC_EXIT_SAVE_MESSAGE =
  "Are you sure you want to leave this diagnostic? Your progress will be saved and you will return to the platform."

const GUEST_DIAGNOSTIC_EXIT_DISCARD_MESSAGE =
  "Are you sure you want to exit without saving? Your answers will be lost and you will return to the platform."

type GuestDiagnosticExitMode = "save" | "discard"

type GuestDiagnosticExitModalProps = {
  open: boolean
  mode?: GuestDiagnosticExitMode
  confirming?: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** Confirmation before leaving the diagnostic for the platform. */
function GuestDiagnosticExitModal({
  open,
  mode = "save",
  confirming = false,
  onCancel,
  onConfirm,
}: GuestDiagnosticExitModalProps) {
  const isDiscard = mode === "discard"
  return (
    <PracticeSubmitSectionModal
      open={open}
      title={isDiscard ? "Exit Without Saving" : "Leave Diagnostic"}
      titleId="guest-diagnostic-exit-title"
      message={isDiscard ? GUEST_DIAGNOSTIC_EXIT_DISCARD_MESSAGE : GUEST_DIAGNOSTIC_EXIT_SAVE_MESSAGE}
      confirmLabel={isDiscard ? "Exit Without Saving" : "Leave"}
      submitting={confirming}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}

export {
  GuestDiagnosticExitModal,
  GUEST_DIAGNOSTIC_EXIT_SAVE_MESSAGE,
  GUEST_DIAGNOSTIC_EXIT_DISCARD_MESSAGE,
}
export type { GuestDiagnosticExitMode }
