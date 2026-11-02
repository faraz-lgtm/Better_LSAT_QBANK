import { useEffect } from "react"

const BOOKING_WIDGET_SRC = "https://booking.betterlsat.com/widget/booking/ykgARKRGf5mpZC3nHOYQ"
const BOOKING_WIDGET_ID = "ykgARKRGf5mpZC3nHOYQ_1789994679867"
const BOOKING_EMBED_SCRIPT_ID = "ghl-booking-form-embed"
const BOOKING_EMBED_SCRIPT_SRC = "https://booking.betterlsat.com/js/form_embed.js"

function ensureBookingEmbedScript() {
  if (document.getElementById(BOOKING_EMBED_SCRIPT_ID)) return

  const script = document.createElement("script")
  script.id = BOOKING_EMBED_SCRIPT_ID
  script.src = BOOKING_EMBED_SCRIPT_SRC
  script.type = "text/javascript"
  document.body.appendChild(script)
}

function StrategyCallScheduler() {
  useEffect(() => {
    ensureBookingEmbedScript()
  }, [])

  return (
    <iframe
      id={BOOKING_WIDGET_ID}
      title="FREE LSAT Strategy Call booking"
      src={BOOKING_WIDGET_SRC}
      allow="payment"
      scrolling="no"
      className="block h-[900px] w-full border-0"
      style={{ width: "100%", border: "none", overflow: "hidden" }}
    />
  )
}

export { StrategyCallScheduler }
