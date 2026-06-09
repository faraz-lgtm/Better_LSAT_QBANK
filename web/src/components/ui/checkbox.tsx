import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

const checkboxVariants = cva(
  "inline-flex items-center justify-center rounded border border-input bg-background text-primary transition-colors focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
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

type CheckboxProps = Omit<React.ComponentProps<"input">, "size" | "type"> &
  VariantProps<typeof checkboxVariants> & {
    indeterminate?: boolean
  }

function Checkbox({ className, size, indeterminate = false, ...props }: CheckboxProps) {
  const ref = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <span className="inline-flex shrink-0 items-center">
      <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
      <span
        data-slot="checkbox"
        aria-hidden
        className={cn(
          checkboxVariants({ size }),
          "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground",
          "[&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100",
          indeterminate && "border-primary bg-primary text-primary-foreground [&>svg]:opacity-100",
          className,
        )}
      >
        {indeterminate ? <Minus className="size-3" /> : <Check className="size-3" />}
      </span>
    </span>
  )
}

export { Checkbox, checkboxVariants }
