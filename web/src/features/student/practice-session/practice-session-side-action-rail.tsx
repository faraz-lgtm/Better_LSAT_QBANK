import { Fragment, useState, type ComponentType, type SVGProps } from "react"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ACTIVE_DRILL_SIDE_WIDGET_COLLAPSED_CLASS,
  ACTIVE_DRILL_SIDE_WIDGET_EXPANDED_CLASS,
  ACTIVE_DRILL_SIDE_WIDGET_ITEM_CLASS,
  ACTIVE_DRILL_SIDE_WIDGET_ITEM_EXPANDED_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import {
  SideWidgetAccessibilityIcon,
  SideWidgetCollapseMenuIcon,
  SideWidgetFlagIcon,
  SideWidgetFullScreenIcon,
  SideWidgetResponseMaskingIcon,
  SideWidgetReviewIcon,
} from "@/features/student/practice-session/practice-session-side-widget-icons"
import { cn } from "@/lib/utils"

type SideWidgetIconComponent = ComponentType<SVGProps<SVGSVGElement>>

type PracticeSessionSideWidgetProps = {
  flagged: boolean
  onToggleFlag: () => void
  flagsDisabled?: boolean
  responseMasking: boolean
  onToggleResponseMasking: () => void
  onFullScreen?: () => void
  onReview?: () => void
  onAccessibility?: () => void
}

type SideWidgetItem = {
  id: string
  label: string
  icon: SideWidgetIconComponent
  onClick: () => void
  active?: boolean
  disabled?: boolean
}

/** Figma `18781:29066` — exam side widget (collapsed icons / expanded labels) */
function PracticeSessionSideWidget({
  flagged,
  onToggleFlag,
  flagsDisabled,
  responseMasking,
  onToggleResponseMasking,
  onFullScreen,
  onReview,
  onAccessibility,
}: PracticeSessionSideWidgetProps) {
  const [expanded, setExpanded] = useState(false)

  function handleFullScreen() {
    if (onFullScreen) {
      onFullScreen()
      return
    }
    const card = document.querySelector(".practice-session-card")
    const target = card instanceof HTMLElement ? card : document.documentElement
    if (document.fullscreenElement) {
      void document.exitFullscreen()
      return
    }
    void target.requestFullscreen?.()
  }

  function handleReview() {
    if (onReview) {
      onReview()
      return
    }
    setExpanded(true)
  }

  function handleAccessibility() {
    if (onAccessibility) {
      onAccessibility()
    }
  }

  const items: SideWidgetItem[] = [
    {
      id: "fullscreen",
      label: "Full Screen",
      icon: SideWidgetFullScreenIcon,
      onClick: handleFullScreen,
    },
    {
      id: "review",
      label: "Review",
      icon: SideWidgetReviewIcon,
      onClick: handleReview,
    },
    {
      id: "accessibility",
      label: "Accessibility",
      icon: SideWidgetAccessibilityIcon,
      onClick: handleAccessibility,
    },
    {
      id: "flag",
      label: "Flag item",
      icon: SideWidgetFlagIcon,
      onClick: onToggleFlag,
      active: flagged,
      disabled: flagsDisabled,
    },
    {
      id: "masking",
      label: "Response Masking",
      icon: SideWidgetResponseMaskingIcon,
      onClick: onToggleResponseMasking,
      active: responseMasking,
    },
    {
      id: "collapse",
      label: "Collapse Menu",
      icon: SideWidgetCollapseMenuIcon,
      onClick: () => setExpanded((open) => !open),
    },
  ]

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          "practice-session-side-widget absolute right-0 top-6 z-10 flex flex-col",
          expanded ? ACTIVE_DRILL_SIDE_WIDGET_EXPANDED_CLASS : ACTIVE_DRILL_SIDE_WIDGET_COLLAPSED_CLASS,
        )}
        aria-label="Exam tools"
      >
        {items.map((item) => {
          const Icon = item.icon
          const isFlag = item.id === "flag"
          const button = (
            <button
              type="button"
              disabled={item.disabled}
              className={cn(
                expanded ? ACTIVE_DRILL_SIDE_WIDGET_ITEM_EXPANDED_CLASS : ACTIVE_DRILL_SIDE_WIDGET_ITEM_CLASS,
                item.active && "text-[#0d47a1]",
                item.disabled && "cursor-default opacity-50",
              )}
              aria-label={item.label}
              aria-pressed={item.active || undefined}
              onClick={item.onClick}
            >
              <Icon
                className={cn("size-5 shrink-0", isFlag && item.active && "fill-current")}
                aria-hidden
              />
              {expanded ? (
                <span className="whitespace-nowrap text-sm font-medium text-[#062357]">{item.label}</span>
              ) : null}
            </button>
          )

          if (expanded) {
            return <Fragment key={item.id}>{button}</Fragment>
          }

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent side="left">{item.label}</TooltipContent>
            </Tooltip>
          )
        })}
      </aside>
    </TooltipProvider>
  )
}

export { PracticeSessionSideWidget, PracticeSessionSideWidget as PracticeSessionSideActionRail }
