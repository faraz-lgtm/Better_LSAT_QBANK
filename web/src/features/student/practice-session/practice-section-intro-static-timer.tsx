import { formatPracticeElapsed } from "@/features/student/practice-session/use-practice-session-timer"
import { cn } from "@/lib/utils"

type PracticeSectionIntroStaticTimerProps = {
  label?: string
  displaySeconds: number
  progress?: number
  className?: string
}

/** Figma `18617:26310` — decorative timer on section intro (does not count down). */
function PracticeSectionIntroStaticTimer({
  label = "Time Left:",
  displaySeconds,
  progress = 1,
  className,
}: PracticeSectionIntroStaticTimerProps) {
  const pct = Math.min(100, Math.max(0, progress * 100))

  return (
    <div
      className={cn(
        "flex h-[52px] w-[203px] shrink-0 items-center rounded-[16px] border border-[#dfe1e7] bg-[#f6f8fa] px-3",
        className,
      )}
      aria-hidden
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex h-6 flex-nowrap items-center gap-2.5">
          <span className="shrink-0 whitespace-nowrap text-[14px] font-medium leading-none tracking-[0.28px] text-[#666d80]">
            {label}
          </span>
          <span className="w-[46px] shrink-0 whitespace-nowrap text-right text-[14px] font-semibold leading-none tabular-nums tracking-[0.28px] text-[#062357]">
            {formatPracticeElapsed(displaySeconds)}
          </span>
          <div className="ml-auto flex size-6 shrink-0 items-center justify-center text-[#666d80]">
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
          </div>
        </div>
        <div className="h-1.5 w-[179px] max-w-full overflow-hidden rounded-lg bg-[#dfe1e7]">
          <div className="h-full rounded-lg bg-[#0d47a1]" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

export { PracticeSectionIntroStaticTimer }
