import { AlignLeft, CalendarDays, Clock3, Globe2, GraduationCap, X } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Legacy Amelia booking page for the free 15-minute strategy call. */
const BOOKING_PAGE_SRC = "https://old.betterlsat.com/booking/free-test-session/"
const BOOKING_WIDGET_SRC = BOOKING_PAGE_SRC
const BOOKING_WIDGET_ID = "amelia-free-strategy-call-booking"

/** Matches the last known-good embed height before the padding experiments. */
const BOOKING_IFRAME_HEIGHT_PX = 900

type StrategyCallSchedulerProps = {
  /**
   * Toggle mode: when false, show the Figma summary card; when true, show the Amelia calendar.
   * Omit (and pass `alwaysOpen`) for the Free Strategy Call always-on embed.
   */
  calendarOpen?: boolean
  /** Skip the summary card and always mount the live embed. */
  alwaysOpen?: boolean
  onOpenCalendar?: () => void
  onCloseCalendar?: () => void
}

/**
 * Figma booking card — summary entry point with Amelia calendar on expand,
 * or always-on embed when `alwaysOpen` is set.
 */
function StrategyCallScheduler({
  calendarOpen = false,
  alwaysOpen = false,
  onOpenCalendar,
  onCloseCalendar,
}: StrategyCallSchedulerProps) {
  const isCalendarOpen = alwaysOpen || calendarOpen

  return (
    <section
      id="strategy-call-scheduler"
      className="relative w-full overflow-hidden rounded-[20px] border border-[#dbe5f3] bg-[var(--greyscale-0)]"
      aria-label="FREE LSAT Strategy Call booking"
      data-testid="strategy-call-amelia-scheduler"
      data-calendar-open={isCalendarOpen ? "true" : "false"}
    >
      {isCalendarOpen ? (
        <>
          {!alwaysOpen && onCloseCalendar ? (
            <button
              type="button"
              onClick={onCloseCalendar}
              aria-label="Close booking calendar"
              className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-[var(--color-student-heading)] shadow-sm transition-colors hover:bg-[var(--primary-25)]"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
          <iframe
            id={BOOKING_WIDGET_ID}
            title="FREE LSAT Strategy Call booking"
            src={BOOKING_PAGE_SRC}
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
        </>
      ) : (
        <div className="flex flex-col items-start p-[30px]">
          <div className="flex items-center gap-3">
            <div className="flex size-[46px] shrink-0 items-center justify-center overflow-hidden text-[var(--primary)]">
              <GraduationCap className="size-7" strokeWidth={1.75} aria-hidden />
            </div>
            <h2 className="text-[18px] font-bold leading-[1.35] text-[var(--color-student-heading)]">
              FREE LSAT Strategy Call
            </h2>
          </div>

          <div className="flex w-full flex-col items-stretch gap-6 pt-[18px] lg:flex-row lg:items-start">
            <div className="w-full shrink-0 rounded-[14px] border border-[#dbe5f3] bg-[#f6f9fe] px-[18px] py-4 lg:max-w-[485px]">
              <ul className="flex flex-col gap-[9px]">
                <li className="flex items-start gap-[11px] text-sm font-medium leading-[22.4px] text-[#5a718f]">
                  <Clock3 className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                  <span>15 min</span>
                </li>
                <li className="flex items-start gap-[11px] text-sm font-medium leading-[22.4px] text-[#5a718f]">
                  <CalendarDays className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                  <span>Wed, Nov 11, 2026</span>
                </li>
                <li className="flex items-start gap-[11px] text-sm font-medium leading-[22.4px] text-[#5a718f]">
                  <Globe2 className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                  <span>Asia/Karachi (GMT+5)</span>
                </li>
                <li className="flex items-start gap-[11px] text-[#5a718f]">
                  <AlignLeft className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                  <p className="text-[13.5px] font-normal leading-[20.925px]">
                    A 15-minute 1-on-1 call to find your biggest score gap and the best way to fix it.
                  </p>
                </li>
              </ul>
            </div>

            <div className="flex min-h-[170px] w-full flex-col lg:max-w-[503px]">
              <p className="text-base font-bold leading-[25.6px] text-[#0e3a6e]">Pick a time that works</p>
              <p className="pt-3.5 text-[14.5px] leading-[23.2px] text-[#5a718f]">
                Calls run Monday to Friday evenings, Karachi time. Choose a slot and we will send the Zoom link
                straight away.
              </p>
              <div className="mt-auto flex items-end pt-3.5">
                <Button
                  type="button"
                  size="lg"
                  className="h-12 rounded-[10px] px-4"
                  onClick={onOpenCalendar}
                >
                  See available times
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export { StrategyCallScheduler, BOOKING_PAGE_SRC, BOOKING_WIDGET_SRC, BOOKING_WIDGET_ID }
