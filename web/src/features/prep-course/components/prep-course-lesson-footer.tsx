import { ArrowLeft, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

type PrepCourseLessonFooterProps = {
  showSidebar: boolean
  onToggleSidebar: () => void
  onMarkComplete: () => void
  markCompleteDisabled?: boolean
  primaryAction?: {
    label: string
    onClick: () => void
    disabled?: boolean
  } | null
}

function PrepCourseLessonFooter({
  showSidebar,
  onToggleSidebar,
  onMarkComplete,
  markCompleteDisabled = false,
  primaryAction = null,
}: PrepCourseLessonFooterProps) {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-[#dfe1e7] bg-[#f2f7ff]">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Button
          type="button"
          variant="outline"
          onClick={onToggleSidebar}
          className="h-10 rounded-2xl border-[#dfe1e7] bg-white px-4 text-sm font-semibold tracking-[0.02em] text-[#0d47a1]"
        >
          <ArrowLeft className="mr-2 size-4" />
          {showSidebar ? "Hide Lesson" : "Show All Lesson"}
        </Button>
        {primaryAction ? (
          <Button
            type="button"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            className="ds-btn-sm cursor-pointer px-5 text-sm tracking-[0.02em] disabled:pointer-events-auto disabled:cursor-not-allowed"
          >
            {primaryAction.label}
            <ArrowRight className="ml-2 size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onMarkComplete}
            disabled={markCompleteDisabled}
            className="ds-btn-sm px-5 text-sm tracking-[0.02em]"
          >
            Mark Complete &amp; Continue
            <ArrowRight className="ml-2 size-4" />
          </Button>
        )}
      </div>
    </footer>
  )
}

export { PrepCourseLessonFooter }
