import { useEffect } from "react"

/** Live GHL / LeadConnector calendar — same embed as booking.betterlsat.com. */
const BOOKING_WIDGET_SRC = "https://booking.betterlsat.com/widget/booking/ykgARKRGf5mpZC3nHOYQ"
const BOOKING_WIDGET_ID = "ykgARKRGf5mpZC3nHOYQ_1789994679867"
const BOOKING_EMBED_SCRIPT_ID = "ghl-booking-form-embed"
const BOOKING_EMBED_SCRIPT_SRC = "https://booking.betterlsat.com/js/form_embed.js"

/** Matches the last known-good embed height before the padding experiments. */
const BOOKING_IFRAME_HEIGHT_PX = 900

function ensureBookingEmbedScript() {
  if (document.getElementById(BOOKING_EMBED_SCRIPT_ID)) return

  const script = document.createElement("script")
  script.id = BOOKING_EMBED_SCRIPT_ID
  script.src = BOOKING_EMBED_SCRIPT_SRC
  script.type = "text/javascript"
  document.body.appendChild(script)
}

/**
 * form_embed.js temporarily parks booking iframes off-screen (opacity:0, left:-9999px)
 * until the first resize message. If that message is delayed/missed (SPA remount),
 * force the iframe back into view so the calendar never stays blank.
 */
function revealBookingIframe(iframe: HTMLIFrameElement) {
  iframe.style.opacity = "1"
  iframe.style.visibility = "visible"
  iframe.style.pointerEvents = "auto"
  iframe.style.display = "block"
  iframe.style.position = "relative"
  if (iframe.style.left === "-9999px") iframe.style.left = ""
  iframe.removeAttribute("data-initial-iframe-hidden")
}

/**
 * Official GHL booking embed for the Free Strategy Call page.
 * Keep this close to the official iframe + form_embed.js pattern — do not call
 * window.iFrameResize ourselves; that races form_embed and can leave the iframe hidden.
 */
function StrategyCallScheduler() {
  useEffect(() => {
    ensureBookingEmbedScript()

    const iframe = document.getElementById(BOOKING_WIDGET_ID)
    if (!(iframe instanceof HTMLIFrameElement)) return

    revealBookingIframe(iframe)

    // form_embed may re-hide on script load; reveal again after load + a short settle.
    const script = document.getElementById(BOOKING_EMBED_SCRIPT_ID)
    const reveal = () => revealBookingIframe(iframe)
    const settleTimer = window.setTimeout(reveal, 800)

    script?.addEventListener("load", reveal)
    return () => {
      window.clearTimeout(settleTimer)
      script?.removeEventListener("load", reveal)
    }
  }, [])

  return (
    <section
      id="strategy-call-scheduler"
      className="relative w-full"
      aria-label="FREE LSAT Strategy Call booking"
      data-testid="strategy-call-ghl-scheduler"
    >
      <iframe
        id={BOOKING_WIDGET_ID}
        title="FREE LSAT Strategy Call booking"
        src={BOOKING_WIDGET_SRC}
        allow="payment"
        scrolling="no"
        className="block w-full border-0"
        style={{
          width: "100%",
          border: "none",
          overflow: "hidden",
          height: BOOKING_IFRAME_HEIGHT_PX,
        }}
      />
    </section>
  )
}

export { StrategyCallScheduler, BOOKING_WIDGET_SRC, BOOKING_WIDGET_ID }
