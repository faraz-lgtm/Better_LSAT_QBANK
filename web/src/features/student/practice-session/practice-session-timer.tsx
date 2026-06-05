import { formatPracticeElapsed } from "@/features/student/practice-session/use-practice-session-timer"
import { cn } from "@/lib/utils"

type PracticeSessionTimerProps = {
  label?: string
  displaySeconds: number
  paused: boolean
  onTogglePause: () => void
  onReset?: () => void
  progress: number
  displayClassName?: string
}

/** Figma `18034:12885` — elapsed timer pill */
function PracticeSessionTimer({
  label = "Elapsed",
  displaySeconds,
  paused,
  onTogglePause,
  onReset,
  progress,
  displayClassName,
}: PracticeSessionTimerProps) {
  const pct = Math.min(100, Math.max(0, progress * 100))
  const isRemaining = label === "Remaining"
  const timerWidthClass = isRemaining ? "w-[200px]" : "w-[179px]"

  return (
    <div
      className={cn(
        "practice-session-timer flex h-[52px] shrink-0 items-center overflow-hidden rounded-2xl border border-[#dfe1e7] bg-[#f6f8fa] px-3",
        timerWidthClass,
      )}
    >
      <div className="flex w-full flex-col gap-1.5 overflow-hidden">
        <div className="flex items-center gap-1.5">
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
          <span className="shrink-0 text-[14px] font-medium leading-none tracking-[0.02em] text-[#666d80]">
            {label}
          </span>
          <span
            className={cn(
              "shrink-0 text-[14px] font-semibold leading-none tabular-nums tracking-[0.02em] text-[#062357]",
              displayClassName,
            )}
          >
            {formatPracticeElapsed(displaySeconds)}
          </span>
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
              className="inline-flex size-4 items-center justify-center text-[#062357] transition hover:opacity-80"
              aria-label={paused ? "Resume timer" : "Pause timer"}
              onClick={onTogglePause}
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
                    d="M6 4.5L11.5 8L6 11.5V4.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
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
                  <path d="M5.5 3.5V12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M10.5 3.5V12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-lg bg-[#dfe1e7]">
          <div
            className="h-full rounded-lg bg-[#0d47a1] transition-[width] duration-300 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export { PracticeSessionTimer }
