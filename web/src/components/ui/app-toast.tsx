import type { AppToastState } from "@/hooks/use-app-toast"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

function AppToast({
  toast,
  onDismiss,
  className,
}: {
  toast: AppToastState
  onDismiss: () => void
  className?: string
}) {
  const isError = toast.variant === "error"

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live="assertive"
      className={cn(
        "pointer-events-auto fixed z-[100] max-w-[min(92vw,28rem)] rounded-lg border px-4 py-3 text-sm shadow-lg",
        "right-6 top-6",
        isError
          ? "border-[var(--red)]/30 bg-[#fff5f5] text-[var(--red)]"
          : "border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-[var(--color-student-heading)]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {!isError ? (
          <span
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white"
            aria-hidden
          >
            <Check className="size-3" strokeWidth={3} />
          </span>
        ) : null}
        <p className="flex-1 font-medium leading-snug">{toast.message}</p>
        <button
          type="button"
          className="shrink-0 text-xs font-medium opacity-70 hover:opacity-100"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export { AppToast }
