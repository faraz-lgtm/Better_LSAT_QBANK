import { X } from "lucide-react"

const BOOKING_PAGE_SRC = "https://old.betterlsat.com/booking/free-test-session/"

type StrategyCallSchedulerProps = {
  onClose?: () => void
}

function StrategyCallScheduler({ onClose }: StrategyCallSchedulerProps) {
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
        title="FREE LSAT Strategy Call booking with Amelia"
        src={BOOKING_PAGE_SRC}
        allow="payment"
        scrolling="no"
        className="block h-[900px] w-full border-0"
        style={{ width: "100%", border: "none", overflow: "hidden" }}
      />
    </div>
  )
}

export { StrategyCallScheduler }
