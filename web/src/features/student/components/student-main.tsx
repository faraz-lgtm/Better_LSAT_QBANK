import type { ReactNode } from "react"

import { STUDENT_MAIN_PADDING_CLASS, STUDENT_PAGE_CONTAINER_CLASS, STUDENT_SHELL_GUTTER_CLASS } from "@/features/student/components/student-page-container"
import { cn } from "@/lib/utils"

type StudentMainProps = {
  children: ReactNode
  className?: string
  /** Locked: page fills the shell; children own internal scroll regions. */
  layout?: "scroll" | "locked"
}

function StudentMain({ children, className = "", layout = "scroll" }: StudentMainProps) {
  const locked = layout === "locked"

  return (
    <main
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        locked ? "h-full overflow-hidden" : "overflow-y-auto",
        className,
      )}
    >
      <div
        className={cn(
          STUDENT_PAGE_CONTAINER_CLASS,
          STUDENT_SHELL_GUTTER_CLASS,
          locked ? "flex h-full min-h-0 flex-1 flex-col overflow-hidden pt-6 pb-0" : STUDENT_MAIN_PADDING_CLASS,
        )}
      >
        {children}
      </div>
    </main>
  )
}

export { StudentMain }
