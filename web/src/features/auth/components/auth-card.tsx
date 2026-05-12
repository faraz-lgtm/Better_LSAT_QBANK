import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

function AuthCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        "auth-card figma-w-500 figma-max-w-500 figma-p-24 w-full rounded-2xl border border-[#dfe1e7] bg-white text-left shadow-[0px_5px_10px_0px_rgba(13,13,18,0.04),0px_4px_8px_0px_rgba(13,13,18,0.02)]",
        className,
      )}
    >
      {children}
    </section>
  )
}

export { AuthCard }
