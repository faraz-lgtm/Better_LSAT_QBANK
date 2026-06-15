import type { ReactNode } from "react"

import { STUDENT_PAGE_CONTAINER_CLASS } from "@/features/student/components/student-page-container"
import { cn } from "@/lib/utils"

type StudentMainProps = {
  children: ReactNode
  className?: string
}

function StudentMain({ children, className = "" }: StudentMainProps) {
  return (
    <main className={cn(STUDENT_PAGE_CONTAINER_CLASS, "min-h-0 flex-1 overflow-y-auto py-6", className)}>
      {children}
    </main>
  )
}

export { StudentMain }
