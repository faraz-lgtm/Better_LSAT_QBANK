import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-lg border bg-background px-3 text-sm text-foreground shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
  {
    variants: {
      size: {
        sm: "h-10",
        lg: "figma-h-52",
      },
    },
    defaultVariants: {
      size: "lg",
    },
  },
)

export type InputProps = Omit<React.ComponentProps<"input">, "size"> & VariantProps<typeof inputVariants>

function Input({ className, type, size, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ size, className }))}
      {...props}
    />
  )
}

export { Input, inputVariants }
