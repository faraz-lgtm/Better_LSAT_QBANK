import type { ReactNode } from "react"

import { STUDENT_MAIN_PADDING_CLASS, STUDENT_PAGE_CONTAINER_CLASS, STUDENT_SHELL_GUTTER_CLASS } from "@/features/student/components/student-page-container"
import { cn } from "@/lib/utils"

type StudentMainProps = {
  children: ReactNode
  className?: string
}

function StudentMain({ children, className = "" }: StudentMainProps) {
  return (
    <main className={cn("min-h-0 flex-1 overflow-y-auto", className)}>
      <div
        className={cn(
          STUDENT_PAGE_CONTAINER_CLASS,
          STUDENT_SHELL_GUTTER_CLASS,
          STUDENT_MAIN_PADDING_CLASS,
          className,
        )}
      >
        {children}
      </div>
    </main>
  )
}

export { StudentMain }
