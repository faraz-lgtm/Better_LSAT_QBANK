import { X } from "lucide-react"

import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"

const BOOKING_IFRAME_HEIGHT_PX = 750

type PackageBookingModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  bookingUrl: string | null
}

function PackageBookingModal({ open, onOpenChange, title, bookingUrl }: PackageBookingModalProps) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Keep `fixed` from the dialog primitive — do not add `relative` (twMerge drops fixed).
        className="flex h-[min(820px,calc(100vh-2rem))] w-[min(720px,calc(100%-2rem))] flex-col gap-0 overflow-hidden bg-[var(--greyscale-0)] p-0 sm:max-w-[720px]"
        aria-describedby="package-booking-desc"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        // Booking iframes move focus into a nested document; Radix would otherwise
        // treat that as focus-outside and immediately dismiss the dialog.
        onFocusOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => {
          const target = event.target
          if (target instanceof Element && target.closest("iframe")) {
            event.preventDefault()
          }
        }}
        onInteractOutside={(event) => {
          const target = event.target
          if (target instanceof Element && target.closest("iframe")) {
            event.preventDefault()
          }
        }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription id="package-booking-desc" className="sr-only">
          Complete your tutoring package booking in the form below.
        </DialogDescription>
        <DialogClose
          type="button"
          className="absolute top-3 right-3 z-10 inline-flex size-8 items-center justify-center rounded-[8px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-[var(--greyscale-500)] shadow-sm transition-colors hover:bg-[var(--greyscale-50)] hover:text-[var(--greyscale-800)]"
          aria-label="Close booking"
        >
          <X className="size-4" aria-hidden />
        </DialogClose>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--greyscale-0)]">
          {open && bookingUrl ? (
            <iframe
              title={title}
              src={bookingUrl}
              height={BOOKING_IFRAME_HEIGHT_PX}
              width="100%"
              className="block w-full border-0"
              style={{ height: BOOKING_IFRAME_HEIGHT_PX, width: "100%" }}
              allow="payment"
            />
          ) : null}
        </div>
      </DialogContent>
    </DialogRoot>
  )
}

export { PackageBookingModal }
