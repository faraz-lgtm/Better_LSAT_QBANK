import { Button } from "@/components/ui/button"

type PracticeSubmitSectionModalProps = {
  open: boolean
  message: string
  submitting?: boolean
  onCancel: () => void
  onConfirm: () => void
  titleId?: string
}

function PracticeSubmitSectionModal({
  open,
  message,
  submitting = false,
  onCancel,
  onConfirm,
  titleId = "submit-section-title",
}: PracticeSubmitSectionModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="w-full max-w-[480px] rounded-2xl border border-[#dfe1e7] bg-white px-6 py-8 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
        <h2 id={titleId} className="text-center text-2xl font-bold text-[#062357]">
          Submit Section
        </h2>
        <p className="mt-4 text-center text-base leading-[1.5] tracking-[0.32px] text-[#062357]">
          {message}
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="min-w-[120px]"
            disabled={submitting}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            className="min-w-[140px]"
            disabled={submitting}
            onClick={onConfirm}
          >
            {submitting ? "Submitting…" : "Submit Section"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export { PracticeSubmitSectionModal }
