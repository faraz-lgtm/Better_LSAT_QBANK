import { ArrowLeft, ArrowRight, CheckCircle2, PanelRightClose, PanelRightOpen } from "lucide-react"

import { cn } from "@/lib/utils"

type PrepCourseLessonFooterProps = {
  showSidebar: boolean
  onToggleSidebar: () => void
  onMarkComplete: () => void
  markCompleteDisabled?: boolean
  onPrev: () => void
  onNext: () => void
  prevDisabled?: boolean
  nextDisabled?: boolean
  primaryAction?: {
    label: string
    onClick: () => void
    disabled?: boolean
  } | null
}

const navBtnClass =
  "inline-flex h-12 min-w-0 shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-[color:var(--greyscale-100)] bg-[var(--greyscale-25)] px-3 text-sm font-semibold tracking-[0.02em] text-[color:var(--greyscale-500)] shadow-[0_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#eef1f4] disabled:cursor-not-allowed disabled:border-[color:var(--btn-disabled-border)] disabled:bg-[var(--btn-disabled-bg)] disabled:text-[color:var(--greyscale-400)] disabled:shadow-none"

const outlineActionBtnClass =
  "inline-flex h-12 max-w-full shrink items-center justify-center gap-2 rounded-2xl border border-[color:var(--greyscale-100)] bg-white px-4 text-base font-semibold tracking-[0.02em] text-[#0d47a1] shadow-[var(--shadow-xsmall)] transition-colors hover:bg-[var(--primary-0)]"

const primaryBtnClass =
  "inline-flex h-12 max-w-full shrink items-center justify-center gap-2 rounded-2xl border border-[#0b4e6e] bg-[#0d47a1] px-4 text-base font-semibold tracking-[0.02em] text-white shadow-[0_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--primary-600)] disabled:cursor-not-allowed disabled:border-[color:var(--btn-disabled-border)] disabled:bg-[var(--btn-disabled-bg)] disabled:text-[color:var(--btn-disabled-fg)] disabled:shadow-none"

function PrepCourseLessonFooter({
  showSidebar,
  onToggleSidebar,
  onMarkComplete,
  markCompleteDisabled = false,
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  primaryAction = null,
}: PrepCourseLessonFooterProps) {
  return (
    <footer className="min-w-0 w-full max-w-full shrink-0 overflow-x-clip border-t border-[color:var(--greyscale-100)] bg-[var(--secondary-0)] px-6">
      <div className="grid min-w-0 w-full grid-cols-1 gap-2 py-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center xl:gap-x-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-6">
          <button type="button" onClick={onPrev} disabled={prevDisabled} className={navBtnClass}>
            <ArrowLeft className="size-6 shrink-0" aria-hidden />
            Prev
          </button>
          <button type="button" onClick={onToggleSidebar} className={outlineActionBtnClass}>
            {showSidebar ? (
              <PanelRightClose className="size-5 shrink-0" aria-hidden />
            ) : (
              <PanelRightOpen className="size-5 shrink-0" aria-hidden />
            )}
            <span className="truncate">{showSidebar ? "Hide Lesson" : "Show All Lesson"}</span>
          </button>
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-4">
          {primaryAction ? (
            <button
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className={cn(primaryBtnClass, "disabled:pointer-events-auto")}
            >
              <span className="truncate">{primaryAction.label}</span>
              <ArrowRight className="size-5 shrink-0" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={onMarkComplete}
              disabled={markCompleteDisabled}
              className={primaryBtnClass}
            >
              <CheckCircle2 className="size-5 shrink-0" aria-hidden />
              <span className="truncate">Mark Complete &amp; Continue</span>
            </button>
          )}
          <button type="button" onClick={onNext} disabled={nextDisabled} className={navBtnClass}>
            Next
            <ArrowRight className="size-6 shrink-0" aria-hidden />
          </button>
        </div>
      </div>
    </footer>
  )
}

export { PrepCourseLessonFooter }
