import { formatPracticeElapsed } from "@/features/student/practice-session/use-practice-session-timer"
import {
  ACTIVE_DRILL_HEADER_TIMER_CLASS,
  PRACTICE_SESSION_HEADER_CONTROL_RADIUS_CLASS,
  PRACTICE_SESSION_TIMER_PROGRESS_RADIUS_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import { OFFICIAL_HEADER_TIMER_CLASS } from "@/features/student/practice-session/practice-session-official-styles"
import {
  ExamHeaderTimerIcon,
  OfficialHeaderTimerIcon,
} from "@/features/student/practice-session/practice-session-header-icons"
import { cn } from "@/lib/utils"

type PracticeSessionTimerProps = {
  label?: string
  displaySeconds: number
  paused: boolean
  onPauseRequest: () => void
  onReset?: () => void
  progress: number
  displayClassName?: string
  showClockIcon?: boolean
  /** `inline` is the LSAT default header; `official` is LawHub clock + time only. */
  layout?: "card" | "inline" | "official"
}

/** Drill timer stamp — elapsed / remaining pill with progress bar */
function PracticeSessionTimer({
  label = "Elapsed",
  displaySeconds,
  paused,
  onPauseRequest,
  onReset,
  progress,
  displayClassName,
  showClockIcon = true,
  layout = "card",
}: PracticeSessionTimerProps) {
  const pct = Math.min(100, Math.max(0, progress * 100))
  const isCountdown =
    label === "Remaining" || label === "Time Left" || label === "Time Left:"
  const timerMinWidthClass = isCountdown ? "min-w-[213px]" : "min-w-[189px]"
  const timeLabel = formatPracticeElapsed(displaySeconds)

  if (layout === "official") {
    return (
      <div className={OFFICIAL_HEADER_TIMER_CLASS}>
        {showClockIcon ? <OfficialHeaderTimerIcon /> : null}
        <span
          className={cn(
            "shrink-0 text-[14px] font-normal leading-5 tabular-nums text-[#2c3143]",
            displayClassName,
          )}
        >
          {timeLabel}
        </span>
      </div>
    )
  }

  if (layout === "inline") {
    return (
      <div className={ACTIVE_DRILL_HEADER_TIMER_CLASS}>
        <div className="flex items-center gap-2">
          {showClockIcon ? (
            <span className="inline-flex size-6 shrink-0 flex-col items-start rounded-lg px-1 pt-1">
              <ExamHeaderTimerIcon />
            </span>
          ) : null}
          {label ? (
            <span className="flex h-6 shrink-0 items-center text-sm font-medium leading-[1.5] tracking-[0.28px] text-[#666d80]">
              {label}
            </span>
          ) : null}
          <span
            className={cn(
              "mr-8 flex h-6 w-[56px] shrink-0 items-center justify-end text-right text-sm font-semibold leading-[1.5] tabular-nums tracking-[0.28px] text-[#062357]",
              displayClassName,
            )}
          >
            {timeLabel}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "practice-session-timer flex shrink-0 flex-col gap-1.5 overflow-hidden border border-[#dfe1e7] bg-white px-4 py-2 shadow-[0px_1px_1px_rgba(13,13,18,0.04)]",
        PRACTICE_SESSION_HEADER_CONTROL_RADIUS_CLASS,
        timerMinWidthClass,
      )}
    >
      <div className="flex w-full items-center gap-2">
        {showClockIcon ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="size-4 shrink-0 text-[#666d80]"
            aria-hidden
          >
            <path
              d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z"
              stroke="currentColor"
              strokeWidth="1.33333"
            />
            <path d="M8 5V8L10 9" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" />
          </svg>
        ) : null}
        <span className="shrink-0 text-sm font-medium leading-none tracking-[0.02em] text-[#666d80]">
          {label}
        </span>
        <button
          type="button"
          className={cn(
            "shrink-0 rounded-[6px] text-sm font-bold leading-none tabular-nums tracking-[0.02em] text-[#062357] transition hover:bg-[#f6f8fa]",
            displayClassName,
          )}
          aria-label={paused ? "Section paused" : "Pause section timer"}
          onClick={onPauseRequest}
        >
          {formatPracticeElapsed(displaySeconds)}
        </button>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {onReset ? (
            <button
              type="button"
              className="inline-flex size-4 items-center justify-center text-[#666d80] transition hover:text-[#062357]"
              aria-label="Reset timer"
              onClick={onReset}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="size-4"
                aria-hidden
              >
                <path
                  d="M2.66699 8.00001C2.66699 5.05449 5.05448 2.66699 8.00001 2.66699C10.9455 2.66699 13.333 5.05449 13.333 8.00001C13.333 10.9455 10.9455 13.333 8.00001 13.333C5.05448 13.333 2.66699 10.9455 2.66699 8.00001ZM2.66699 8.00001V4.00001M2.66699 4.00001H6.66699"
                  stroke="currentColor"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}
          <button
            type="button"
            className="inline-flex size-4 shrink-0 items-center justify-center text-[#666d80] transition hover:text-[#062357]"
            aria-label={paused ? "Section paused" : "Pause section timer"}
            onClick={onPauseRequest}
          >
            {paused ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="size-4"
                aria-hidden
              >
                <path
                  d="M11.2495 4.00009H9.74951C9.3353 4.00009 8.99951 4.22395 8.99951 4.50009V11.5001C8.99951 11.7762 9.3353 12.0001 9.74951 12.0001H11.2495C11.6637 12.0001 11.9995 11.7762 11.9995 11.5001V4.50009C11.9995 4.22395 11.6637 4.00009 11.2495 4.00009Z"
                  stroke="currentColor"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.24951 4.00009H4.74951C4.3353 4.00009 3.99951 4.22395 3.99951 4.50009V11.5001C3.99951 11.7762 4.3353 12.0001 4.74951 12.0001H6.24951C6.66373 12.0001 6.99951 11.7762 6.99951 11.5001V4.50009C6.99951 4.22395 6.66373 4.00009 6.24951 4.00009Z"
                  stroke="currentColor"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="size-4"
                aria-hidden
              >
                <path
                  d="M11.2495 4.00009H9.74951C9.3353 4.00009 8.99951 4.22395 8.99951 4.50009V11.5001C8.99951 11.7762 9.3353 12.0001 9.74951 12.0001H11.2495C11.6637 12.0001 11.9995 11.7762 11.9995 11.5001V4.50009C11.9995 4.22395 11.6637 4.00009 11.2495 4.00009Z"
                  stroke="currentColor"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.24951 4.00009H4.74951C4.3353 4.00009 3.99951 4.22395 3.99951 4.50009V11.5001C3.99951 11.7762 4.3353 12.0001 4.74951 12.0001H6.24951C6.66373 12.0001 6.99951 11.7762 6.99951 11.5001V4.50009C6.99951 4.22395 6.66373 4.00009 6.24951 4.00009Z"
                  stroke="currentColor"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div
        className={cn(
          "h-[6px] w-full overflow-hidden bg-[#dfe1e7]",
          PRACTICE_SESSION_TIMER_PROGRESS_RADIUS_CLASS,
        )}
      >
        <div
          className={cn(
            "h-full bg-[#0d47a1] transition-[width] duration-300 ease-linear",
            PRACTICE_SESSION_TIMER_PROGRESS_RADIUS_CLASS,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export { PracticeSessionTimer }
