import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const socialButtonVariants = cva("figma-gap-12 justify-start", {
  variants: {
    theme: {
      "color-with-brand": "bg-white text-[#1f1f1f] border border-[#dadce0] hover:bg-[#f8f9fa]",
      brand: "bg-[#0d47a1] text-white hover:bg-[#0b3d8a]",
      neutral: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
    },
    iconOnly: {
      true: "justify-center",
      false: "",
    },
  },
  defaultVariants: {
    theme: "color-with-brand",
    iconOnly: false,
  },
})

type SocialButtonProps = React.ComponentProps<typeof Button> &
  VariantProps<typeof socialButtonVariants> & {
    provider?: "google"
  }

function SocialButton({
  className,
  theme,
  iconOnly,
  provider = "google",
  children,
  ...props
}: SocialButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn(socialButtonVariants({ theme, iconOnly }), className)}
      size={iconOnly ? "icon" : "default"}
      {...props}
    >
      <span
        aria-hidden
        className="inline-flex size-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#4285f4]"
      >
        G
      </span>
      {!iconOnly && <span>{children ?? (provider === "google" ? "Continue with Google" : "Continue")}</span>}
    </Button>
  )
}

export { SocialButton }
