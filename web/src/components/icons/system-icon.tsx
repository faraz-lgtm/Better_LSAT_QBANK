import { cn } from "@/lib/utils"

import { iconRegistry, iconVariants, type IconName, type IconVariantProps } from "./system-icon.config"

type SystemIconProps = IconVariantProps & {
  name: IconName
  className?: string
}

function SystemIcon({ name, size, tone, className }: SystemIconProps) {
  const Icon = iconRegistry[name]
  return <Icon aria-hidden className={cn(iconVariants({ size, tone }), className)} />
}

export { SystemIcon }
