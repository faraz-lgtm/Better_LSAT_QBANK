import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-foreground font-semibold",
  {
    variants: {
      size: {
        xs: "size-4 text-[10px]",
        sm: "size-6 text-xs",
        md: "size-8 text-sm",
        lg: "size-10 text-sm",
        xl: "size-12 text-base",
        "2xl": "size-14 text-lg",
        "3xl": "size-16 text-xl",
      },
      presence: {
        default: "",
        online: "after:absolute after:right-0 after:bottom-0 after:size-2.5 after:rounded-full after:border-2 after:border-white after:bg-emerald-500",
        offline: "after:absolute after:right-0 after:bottom-0 after:size-2.5 after:rounded-full after:border-2 after:border-white after:bg-muted-foreground/50",
      },
    },
    defaultVariants: {
      size: "lg",
      presence: "default",
    },
  },
)

type AvatarProps = React.ComponentProps<"div"> &
  VariantProps<typeof avatarVariants> & {
    src?: string
    alt?: string
    initials?: string
  }

function Avatar({ className, size, presence, src, alt, initials = "U", ...props }: AvatarProps) {
  return (
    <div data-slot="avatar" className={cn(avatarVariants({ size, presence }), className)} {...props}>
      {src ? <img src={src} alt={alt ?? "avatar"} className="size-full object-cover" /> : <span>{initials}</span>}
    </div>
  )
}

export { Avatar, avatarVariants }
