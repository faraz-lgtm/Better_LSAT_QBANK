import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

function AuthCard({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("auth-card text-left", className)}>{children}</section>
}

export { AuthCard }
