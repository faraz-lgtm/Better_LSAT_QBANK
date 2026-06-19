import { cn } from "@/lib/utils"

type PracticeSubmitSectionModalProps = {
  open: boolean
  message: string
  submitting?: boolean
  onCancel: () => void
  onConfirm: () => void
  titleId?: string
  title?: string
  confirmLabel?: string
}

function PracticeSubmitSectionModal({
  open,
  message,
  submitting = false,
  onCancel,
  onConfirm,
  titleId = "submit-section-title",
  title = "Submit Section",
  confirmLabel = "Submit Section",
}: PracticeSubmitSectionModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="flex w-full max-w-[484px] flex-col items-center gap-6 rounded-2xl border border-[#dfe1e7] bg-[#f2f7ff] p-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
        <h2
          id={titleId}
          className="w-full max-w-[436px] text-center text-2xl font-bold leading-[1.3] text-[#062357]"
        >
          {title}
        </h2>

        <div className="flex w-full max-w-[436px] flex-col gap-4">
          <p className="text-center text-sm font-medium leading-[1.5] tracking-[0.28px] text-[#062357]">
            {message}
          </p>

          <div className="flex items-center justify-center gap-8">
            <button
              type="button"
              className={cn(
                "inline-flex h-12 w-[110px] shrink-0 items-center justify-center rounded-2xl border border-[#dfe1e7] bg-white px-4 text-base font-semibold tracking-[0.32px] text-[#0d47a1] shadow-[0px_1px_2px_rgba(13,13,18,0.06)] transition hover:bg-[#f6f8fa] disabled:opacity-50",
              )}
              disabled={submitting}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className={cn(
                "inline-flex h-12 shrink-0 items-center justify-center rounded-2xl border border-[#0b4e6e] bg-[#0d47a1] px-4 text-base font-semibold tracking-[0.32px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition hover:bg-[#0a3d8a] disabled:opacity-50",
              )}
              disabled={submitting}
              onClick={onConfirm}
            >
              {submitting ? "Submitting…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { PracticeSubmitSectionModal }
