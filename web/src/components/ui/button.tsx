import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:outline-none active:not-aria-[haspopup]:translate-y-px aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "text-white hover:text-white focus-visible:ring-0 disabled:opacity-100 [a]:hover:text-white",
        outline:
          "text-[#082c6b] hover:text-white focus-visible:ring-0 disabled:opacity-100",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:border-destructive/40 focus-visible:ring-3 focus-visible:ring-destructive/20 disabled:pointer-events-none disabled:opacity-50",
        link: "text-primary underline-offset-4 hover:underline disabled:pointer-events-none disabled:opacity-50",
      },
      size: {
        default: "text-sm font-semibold",
        xs: "h-8 gap-1.5 rounded-[10px] px-3 text-xs font-semibold",
        sm: "h-10 gap-2 rounded-[12px] px-4 text-sm font-semibold",
        lg: "text-base font-semibold",
        icon: "size-12",
        "icon-xs": "size-8 rounded-[10px]",
        "icon-sm": "size-10 rounded-[12px]",
        "icon-lg": "size-[52px] rounded-[16px]",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        size: ["default", "lg"],
        class: "ds-btn",
      },
      {
        variant: "default",
        size: ["xs", "sm"],
        class: "ds-btn-sm text-sm",
      },
      {
        variant: "outline",
        size: ["default", "lg"],
        class: "ds-btn-outline",
      },
      {
        variant: "outline",
        size: ["xs", "sm"],
        class: "ds-btn-outline-sm text-sm",
      },
      {
        variant: "default",
        size: ["icon", "icon-xs", "icon-sm", "icon-lg"],
        class:
          "!size-auto !h-auto !min-h-0 !gap-0 !rounded-lg !border-0 !bg-transparent !p-0 !shadow-none hover:!bg-muted focus-visible:!shadow-none disabled:!bg-transparent",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
