import { useEffect } from "react"
import { Lock, X } from "lucide-react"

import { Button } from "@/components/ui/button"

type GuestLockedContentModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubscribe: () => void
}

/** Figma `19939:8387` backdrop + compact locked-content upgrade prompt. */
function GuestLockedContentModal({ open, onOpenChange, onSubscribe }: GuestLockedContentModalProps) {
  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onOpenChange, open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/30 p-4 backdrop-blur-[3px] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-locked-content-modal-title"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative flex w-full max-w-[484px] flex-col items-center gap-6 rounded-[16px] border border-[#dfe1e7] bg-[#f2f7ff] p-6 text-center shadow-[0px_5px_10px_-2px_rgba(13,13,18,0.04),0px_4px_8px_-1px_rgba(13,13,18,0.02)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full text-[#666d80] transition-colors hover:bg-white hover:text-[#0d47a1]"
          aria-label="Close upgrade prompt"
          onClick={() => onOpenChange(false)}
        >
          <X className="size-4" strokeWidth={2.2} />
        </button>

        <span className="flex size-9 items-center justify-center text-[#0d47a1]" aria-hidden>
          <Lock className="size-8" strokeWidth={2.4} />
        </span>

        <h2
          id="guest-locked-content-modal-title"
          className="w-full max-w-[436px] text-center text-[24px] font-bold leading-[1.3] text-[#062357]"
        >
          Subscriber-Only Content
        </h2>
        <div className="flex w-full max-w-[436px] flex-col gap-4">
          <p className="text-center text-sm font-medium leading-[1.5] tracking-[0.28px] text-[#062357]">
            This question is available exclusively to subscribers. Upgrade your plan to access every official LSAT PrepTest ever released, including 101 previous-generation tests.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-8">
            <Button
              type="button"
              variant="outline"
              className="h-10 min-w-[68px] rounded-[14px] border-[#dfe1e7] bg-white px-4 py-2 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#0d47a1] shadow-[0px_1px_2px_rgba(13,13,18,0.06)] hover:bg-[#edf3ff]"
              onClick={() => onOpenChange(false)}
            >
              Back
            </Button>
            <Button
              type="button"
              className="h-10 min-w-[136px] rounded-[14px] border border-[#0b4e6e] bg-[#0d47a1] px-4 py-2 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] hover:bg-[#0b3d8a]"
              onClick={onSubscribe}
            >
              Subscribe Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { GuestLockedContentModal }
