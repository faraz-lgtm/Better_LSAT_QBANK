import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"


const radioVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-input bg-background transition-colors focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "size-4",
        md: "size-5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
)

type RadioProps = Omit<React.ComponentProps<"input">, "size" | "type"> & VariantProps<typeof radioVariants>

function Radio({ className, size, ...props }: RadioProps) {
  const checked = Boolean(props.checked)
  return (
    <label className="inline-flex cursor-pointer items-center">
      <input type="radio" className="peer sr-only" {...props} />
      <span data-slot="radio" className={cn(radioVariants({ size }), className)}>
        <span
          className={cn(
            "block rounded-full bg-primary transition-all",
            size === "sm" ? "size-1.5" : "size-2",
            checked ? "opacity-100" : "opacity-0",
          )}
        />
      </span>
    </label>
  )
}

function RadioGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div role="radiogroup" data-slot="radio-group" className={cn("flex flex-wrap gap-3", className)} {...props} />
}

export { Radio, RadioGroup, radioVariants }
