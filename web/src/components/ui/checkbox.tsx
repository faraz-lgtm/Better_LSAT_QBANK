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

  const checked = Boolean(props.checked)

  return (
    <label className="inline-flex cursor-pointer items-center">
      <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
      <span
        data-slot="checkbox"
        className={cn(
          checkboxVariants({ size }),
          "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground",
          className,
        )}
      >
        {indeterminate ? <Minus className="size-3" /> : checked ? <Check className="size-3" /> : null}
      </span>
    </label>
  )
}

export { Checkbox, checkboxVariants }
