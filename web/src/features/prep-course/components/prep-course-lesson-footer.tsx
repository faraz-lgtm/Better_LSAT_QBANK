import type { SVGProps } from "react"
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

type PrepCourseLessonFooterProps = {
  showSidebar: boolean
  onToggleSidebar: () => void
  onBackToCourseModule: () => void
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

/** Figma `18624:73705` — `huge-icon/education/outline/book-minus` */
function BookMinusOutlineIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className} {...props}>
      <path
        d="M12 20.5V6.8M12 20.5C12 20.5 9.2 20.5 7.4 20.5C5.5 20.5 4 19 4 17.1V6.9C4 5 5.5 3.5 7.4 3.5C9.2 3.5 12 5.6 12 5.6C12 5.6 14.8 3.5 16.6 3.5C18.5 3.5 20 5 20 6.9V17.1C20 19 18.5 20.5 16.6 20.5C14.8 20.5 12 20.5 12 20.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.5 12H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Figma companion — open book for “Show All Lesson” */
function BookPlusOutlineIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className} {...props}>
      <path
        d="M12 20.5V6.8M12 20.5C12 20.5 9.2 20.5 7.4 20.5C5.5 20.5 4 19 4 17.1V6.9C4 5 5.5 3.5 7.4 3.5C9.2 3.5 12 5.6 12 5.6C12 5.6 14.8 3.5 16.6 3.5C18.5 3.5 20 5 20 6.9V17.1C20 19 18.5 20.5 16.6 20.5C14.8 20.5 12 20.5 12 20.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 9.5V14.5M9.5 12H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Figma `18624:73705` / `18781:28397` / `18781:28180` */
const navBtnClass =
  "prep-course-lesson-footer__nav box-border inline-flex shrink-0 items-center justify-center rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-[var(--greyscale-500)] shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--greyscale-25)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none sm:rounded-[12px]"

/** Figma `18624:73705` / `17802:2872` */
const outlineActionBtnClass =
  "prep-course-lesson-footer__outline box-border inline-flex min-w-0 shrink items-center justify-center rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] font-semibold text-[var(--primary)] shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--greyscale-25)] sm:shrink-0 sm:rounded-[14px]"

/** Figma `18624:73705` / `17802:2911` */
const primaryBtnClass =
  "prep-course-lesson-footer__primary box-border inline-flex min-w-0 flex-1 items-center justify-center rounded-[12px] border border-[var(--primary-border)] bg-[var(--primary)] font-semibold text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[var(--primary-600)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none sm:flex-none sm:rounded-[14px]"

/** Figma `18624:73566` / `19466:19273` — text action, no border */
const backToModuleBtnClass =
  "prep-course-lesson-footer__back box-border inline-flex shrink-0 items-center justify-center rounded-[14px] font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-25)]"

function PrepCourseLessonFooter({
  showSidebar,
  onToggleSidebar,
  onBackToCourseModule,
  onMarkComplete,
  markCompleteDisabled = false,
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  primaryAction = null,
}: PrepCourseLessonFooterProps) {
  function renderPrimary(compact: boolean) {
    if (primaryAction) {
      return (
        <button
          type="button"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          className={cn(primaryBtnClass, "disabled:pointer-events-auto")}
        >
          <span className="truncate">{primaryAction.label}</span>
          <ChevronRight className={cn("shrink-0", compact ? "size-3.5" : "size-4")} strokeWidth={2} aria-hidden />
        </button>
      )
    }

    return (
      <button type="button" onClick={onMarkComplete} disabled={markCompleteDisabled} className={primaryBtnClass}>
        <CheckCircle2 className={cn("shrink-0", compact ? "size-3.5" : "size-4")} strokeWidth={2} aria-hidden />
        {compact ? (
          <span className="whitespace-nowrap">Mark Complete</span>
        ) : (
          <span className="whitespace-nowrap">Mark Complete &amp; Continue</span>
        )}
      </button>
    )
  }

  return (
    <footer className="practice-session-footer prep-course-lesson-footer relative z-20 box-border flex w-full min-w-0 shrink-0 flex-col items-center justify-center border-t border-[var(--greyscale-100)] bg-[var(--primary-0)] px-3 py-2 sm:px-6">
      {/* Mobile: one compact action row + back link below */}
      <div className="flex w-full min-w-0 flex-col gap-1 sm:hidden">
        <div className="flex min-h-[36px] w-full min-w-0 flex-nowrap items-center gap-1.5">
          <button type="button" onClick={onPrev} disabled={prevDisabled} className={navBtnClass} aria-label="Previous lesson">
            <ChevronLeft className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
          </button>
          <button type="button" onClick={onToggleSidebar} className={outlineActionBtnClass}>
            {showSidebar ? (
              <BookMinusOutlineIcon className="size-3.5 shrink-0" />
            ) : (
              <BookPlusOutlineIcon className="size-3.5 shrink-0" />
            )}
            <span className="whitespace-nowrap">{showSidebar ? "Hide Lesson" : "Show Lesson"}</span>
          </button>
          {renderPrimary(true)}
          <button type="button" onClick={onNext} disabled={nextDisabled} className={navBtnClass} aria-label="Next lesson">
            <ChevronRight className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
          </button>
        </div>
        <button type="button" onClick={onBackToCourseModule} className={backToModuleBtnClass}>
          <span className="whitespace-nowrap">Back to Course Module</span>
        </button>
      </div>

      {/* Desktop: original left / right layout */}
      <div className="hidden min-h-[48px] w-full min-w-0 items-center justify-between gap-4 sm:flex">
        <div className="flex min-w-0 items-center gap-6">
          <button type="button" onClick={onPrev} disabled={prevDisabled} className={navBtnClass} aria-label="Previous lesson">
            <ChevronLeft className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          </button>
          <button type="button" onClick={onToggleSidebar} className={outlineActionBtnClass}>
            {showSidebar ? (
              <BookMinusOutlineIcon className="size-4 shrink-0" />
            ) : (
              <BookPlusOutlineIcon className="size-4 shrink-0" />
            )}
            <span className="whitespace-nowrap">{showSidebar ? "Hide Lesson" : "Show Lesson"}</span>
          </button>
          <button type="button" onClick={onBackToCourseModule} className={backToModuleBtnClass}>
            <span className="whitespace-nowrap">Back to Course Module</span>
          </button>
        </div>
        <div className="flex min-w-0 shrink-0 items-center gap-4">
          {renderPrimary(false)}
          <button type="button" onClick={onNext} disabled={nextDisabled} className={navBtnClass} aria-label="Next lesson">
            <ChevronRight className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </footer>
  )
}

export { PrepCourseLessonFooter }
