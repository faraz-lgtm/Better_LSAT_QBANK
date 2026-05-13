import type { ReactNode } from "react"

type StudentMainProps = {
  children: ReactNode
  className?: string
}

function StudentMain({ children, className = "" }: StudentMainProps) {
  return <main className={`mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 md:px-6 ${className}`}>{children}</main>
}

export { StudentMain }
