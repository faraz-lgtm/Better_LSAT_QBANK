import { PracticeSubmitSectionModal } from "@/features/student/practice-session/practice-submit-section-modal"

const GUEST_DIAGNOSTIC_SUBMIT_MESSAGE =
  "Are you sure you want to submit this Test? You still have time left on the timer."

type GuestDiagnosticSubmitModalProps = {
  open: boolean
  submitting?: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** Figma `19510:22230` — submit diagnostic confirmation */
function GuestDiagnosticSubmitModal({
  open,
  submitting = false,
  onCancel,
  onConfirm,
}: GuestDiagnosticSubmitModalProps) {
  return (
    <PracticeSubmitSectionModal
      open={open}
      title="Submit Diagnostic Test"
      titleId="guest-diagnostic-submit-title"
      message={GUEST_DIAGNOSTIC_SUBMIT_MESSAGE}
      confirmLabel="Submit"
      submitting={submitting}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}

export { GuestDiagnosticSubmitModal, GUEST_DIAGNOSTIC_SUBMIT_MESSAGE }
