import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const switchVariants = cva(
  "peer relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-5 w-9",
        md: "h-6 w-11",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
)

type SwitchProps = Omit<React.ComponentProps<"input">, "size" | "type"> & VariantProps<typeof switchVariants>

function Switch({ className, size, ...props }: SwitchProps) {
  const checked = Boolean(props.checked)
  return (
    <label className="inline-flex cursor-pointer items-center">
      <input type="checkbox" role="switch" className="peer sr-only" {...props} />
      <span
        data-slot="switch"
        className={cn(
          switchVariants({ size }),
          checked ? "bg-primary" : "bg-input",
          className,
        )}
      >
        <span
          className={cn(
            "pointer-events-none block rounded-full bg-white shadow-sm transition-transform",
            size === "sm" ? "size-4" : "size-5",
            checked ? (size === "sm" ? "translate-x-4" : "translate-x-5") : "translate-x-0",
          )}
        />
      </span>
    </label>
  )
}

export { Switch, switchVariants }
