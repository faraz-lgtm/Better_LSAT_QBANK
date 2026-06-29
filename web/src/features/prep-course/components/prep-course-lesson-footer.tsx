import type { SVGProps } from "react"
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"

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
  "box-border inline-flex h-[48px] w-[90px] shrink-0 items-center justify-center gap-[6px] rounded-[16px] border border-[#dfe1e7] bg-[#f6f8fa] px-3 py-1 text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-[#666d80] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#eef1f4] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"

/** Figma `18624:73705` / `17802:2872` */
const outlineActionBtnClass =
  "box-border inline-flex h-[48px] shrink-0 items-center justify-center gap-2 rounded-[16px] border border-[#dfe1e7] bg-white px-4 py-2 text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[#0d47a1] shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f6f8fa]"

/** Figma `18624:73705` / `17802:2911` */
const primaryBtnClass =
  "box-border inline-flex h-[48px] shrink-0 items-center justify-center gap-2 rounded-[16px] border border-[#0b4e6e] bg-[#0d47a1] px-4 py-2 text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#0b3d8a] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"

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
    <footer className="practice-session-footer prep-course-lesson-footer box-border flex w-full min-w-0 max-w-full shrink-0 flex-col items-center justify-center rounded-b-[16px] border-t border-[#dfe1e7] bg-[#f5f9ff] px-6">
      <div className="flex h-[56px] w-full min-w-0 items-center justify-between">
        <div className="flex h-[48px] min-w-0 items-center gap-6">
          <button type="button" onClick={onPrev} disabled={prevDisabled} className={navBtnClass}>
            <ChevronLeft className="size-6 shrink-0" strokeWidth={2} aria-hidden />
            Prev
          </button>
          <button type="button" onClick={onToggleSidebar} className={outlineActionBtnClass}>
            {showSidebar ? (
              <BookMinusOutlineIcon className="size-5 shrink-0" />
            ) : (
              <BookPlusOutlineIcon className="size-5 shrink-0" />
            )}
            <span className="whitespace-nowrap">{showSidebar ? "Hide Lesson" : "Show All Lesson"}</span>
          </button>
        </div>
        <div className="flex h-[48px] min-w-0 items-center gap-4">
          {primaryAction ? (
            <button
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className={cn(primaryBtnClass, "disabled:pointer-events-auto")}
            >
              <span className="truncate">{primaryAction.label}</span>
              <ChevronRight className="size-5 shrink-0" strokeWidth={2} aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={onMarkComplete}
              disabled={markCompleteDisabled}
              className={primaryBtnClass}
            >
              <CheckCircle2 className="size-5 shrink-0" strokeWidth={2} aria-hidden />
              <span className="whitespace-nowrap">Mark Complete &amp; Continue</span>
            </button>
          )}
          <button type="button" onClick={onNext} disabled={nextDisabled} className={navBtnClass}>
            Next
            <ChevronRight className="size-6 shrink-0" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </footer>
  )
}

export { PrepCourseLessonFooter }
