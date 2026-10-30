import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  getLockedContentCopy,
  type LockedContentVariant,
} from "@/features/guest/pricing/guest-locked-content-copy"

type GuestLockedContentModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubscribe: () => void
  variant?: LockedContentVariant
}

const LOCK_ICON_SRC = "/figma/guest/icon-lock-upgrade.svg"

/** Figma `21587:34268` / `21587:32455` / `21587:36586` / `21587:36609` locked-content upgrade prompt. */
function GuestLockedContentModal({
  open,
  onOpenChange,
  onSubscribe,
  variant = "default",
}: GuestLockedContentModalProps) {
  const copy = getLockedContentCopy(variant)
  const dismissLabel = copy.dismissLabel ?? "Back"

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
        className="relative flex w-full max-w-[484px] flex-col items-center gap-6 rounded-[16px] border border-[var(--greyscale-100,#dfe1e7)] bg-[var(--primary-25,#edf3ff)] p-6 text-center shadow-[0px_5px_10px_-2px_rgba(13,13,18,0.04),0px_4px_8px_-1px_rgba(13,13,18,0.02)]"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="relative inline-flex size-9 shrink-0 overflow-hidden" aria-hidden>
          <img
            src={LOCK_ICON_SRC}
            alt=""
            className="size-full max-w-none object-contain"
            width={36}
            height={36}
          />
        </span>

        <h2
          id="guest-locked-content-modal-title"
          className="w-full max-w-[436px] text-center text-[24px] font-bold leading-[1.3] text-[var(--color-student-heading,#041a44)]"
        >
          {copy.title}
        </h2>
        <div className="flex w-full max-w-[436px] flex-col gap-4">
          <div className="flex flex-col gap-3">
            {copy.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="text-center text-sm font-medium leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading,#041a44)]"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-8">
            <Button
              type="button"
              variant="outline"
              className="h-10 min-w-[68px] rounded-[14px] border-[var(--greyscale-100,#dfe1e7)] bg-white px-4 py-2 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#0d47a1] shadow-[0px_1px_2px_rgba(13,13,18,0.06)] hover:bg-[#edf3ff]"
              onClick={() => onOpenChange(false)}
            >
              {dismissLabel}
            </Button>
            <Button
              type="button"
              className="h-10 min-w-[136px] rounded-[14px] border border-[#0b4e6e] bg-[#0d47a1] px-4 py-2 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] hover:bg-[#0b3d8a]"
              onClick={onSubscribe}
            >
              {copy.ctaLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { GuestLockedContentModal }
