import { useEffect } from "react"
import { X } from "lucide-react"

const BOOKING_WIDGET_SRC = "https://booking.betterlsat.com/widget/booking/ykgARKRGf5mpZC3nHOYQ"
const BOOKING_WIDGET_ID = "ykgARKRGf5mpZC3nHOYQ_1789994679867"
const BOOKING_EMBED_SCRIPT_ID = "ghl-booking-form-embed"
const BOOKING_EMBED_SCRIPT_SRC = "https://booking.betterlsat.com/js/form_embed.js"

type StrategyCallSchedulerProps = {
  onClose?: () => void
}

function ensureBookingEmbedScript() {
  if (document.getElementById(BOOKING_EMBED_SCRIPT_ID)) return

  const script = document.createElement("script")
  script.id = BOOKING_EMBED_SCRIPT_ID
  script.src = BOOKING_EMBED_SCRIPT_SRC
  script.type = "text/javascript"
  document.body.appendChild(script)
}

function StrategyCallScheduler({ onClose }: StrategyCallSchedulerProps) {
  useEffect(() => {
    ensureBookingEmbedScript()
  }, [])

  return (
    <div className="relative w-full">
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close booking widget"
          className="absolute right-2 top-2 z-10 inline-flex size-9 items-center justify-center rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-[var(--color-student-heading)] shadow-sm transition-colors hover:bg-[var(--primary-25)]"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
      <iframe
        id={BOOKING_WIDGET_ID}
        title="FREE LSAT Strategy Call booking"
        src={BOOKING_WIDGET_SRC}
        allow="payment"
        scrolling="no"
        className="block h-[900px] w-full border-0"
        style={{ width: "100%", border: "none", overflow: "hidden" }}
      />
    </div>
  )
}

export { StrategyCallScheduler }
