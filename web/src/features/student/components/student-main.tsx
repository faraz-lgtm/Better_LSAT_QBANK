import type { ReactNode } from "react"

import { STUDENT_MAIN_PADDING_CLASS, STUDENT_PAGE_CONTAINER_CLASS, STUDENT_SHELL_GUTTER_CLASS } from "@/features/student/components/student-page-container"
import { cn } from "@/lib/utils"

type StudentMainProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  /** Locked: page fills the shell; children own internal scroll regions. */
  layout?: "scroll" | "locked" | "immersive"
}

function StudentMain({ children, className = "", contentClassName = "", layout = "scroll" }: StudentMainProps) {
  const locked = layout === "locked"
  const immersive = layout === "immersive"

  return (
    <main
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col",
        immersive || locked ? "h-full overflow-x-clip overflow-y-hidden" : "overflow-y-auto overflow-x-hidden",
        className,
      )}
    >
      <div
        className={cn(
          !immersive && STUDENT_PAGE_CONTAINER_CLASS,
          !immersive && STUDENT_SHELL_GUTTER_CLASS,
          !immersive && "w-full",
          immersive
            ? "flex h-full min-h-0 flex-1 flex-col overflow-x-clip overflow-y-hidden"
            : locked
              ? "flex h-full min-h-0 flex-1 flex-col overflow-x-clip overflow-y-hidden pt-[24px] pb-0"
              : STUDENT_MAIN_PADDING_CLASS,
          contentClassName,
        )}
      >
        {children}
      </div>
    </main>
  )
}

export { StudentMain }
