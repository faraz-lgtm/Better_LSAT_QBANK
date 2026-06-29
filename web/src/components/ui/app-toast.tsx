import type { AppToastState } from "@/hooks/use-app-toast"
import { cn } from "@/lib/utils"

function AppToast({ toast, onDismiss }: { toast: AppToastState; onDismiss: () => void }) {
  return (
    <div
      role={toast.variant === "error" ? "alert" : "status"}
      aria-live="assertive"
      className={cn(
        "pointer-events-auto fixed bottom-6 left-1/2 z-[100] max-w-[min(92vw,28rem)] -translate-x-1/2 rounded-lg border px-4 py-3 text-sm shadow-lg",
        toast.variant === "error"
          ? "border-[var(--red)]/30 bg-[#fff5f5] text-[var(--red)]"
          : "border-[var(--primary-20)] bg-[var(--primary-0)] text-[var(--primary-100)]",
      )}
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 leading-snug">{toast.message}</p>
        <button
          type="button"
          className="shrink-0 text-xs font-medium opacity-70 hover:opacity-100"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

export { AppToast }
