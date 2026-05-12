import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-medium transition-colors",
  {
    variants: {
      variant: {
        neutral: "border-border bg-secondary text-foreground",
        primary: "border-primary/20 bg-primary/10 text-primary",
        success: "border-emerald-200 bg-emerald-50 text-emerald-700",
        warning: "border-amber-200 bg-amber-50 text-amber-700",
        destructive: "border-destructive/20 bg-destructive/10 text-destructive",
        outline: "border-border bg-transparent text-foreground",
      },
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-sm px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  },
)

function Badge({
  className,
  variant,
  size,
  children,
  dot = false,
  trailingIcon,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    dot?: boolean
    trailingIcon?: React.ReactNode
  }) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot ? <span aria-hidden className="size-1.5 rounded-full bg-current/80" /> : null}
      <span>{children}</span>
      {trailingIcon ? <span className="inline-flex items-center">{trailingIcon}</span> : null}
    </span>
  )
}

export { Badge, badgeVariants }
