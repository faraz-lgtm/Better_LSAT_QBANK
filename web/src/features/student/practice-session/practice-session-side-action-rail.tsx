import { useEffect, useState, type ComponentType, type SVGProps } from "react"

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
  SideWidgetMedSizeIcon,
  SideWidgetOpenMenuIcon,
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

/** Hover label stays in-tree (beside the icon) so CSS `zoom` cannot misplace a portaled tooltip. */
const SIDE_WIDGET_HOVER_LABEL_CLASS =
  "pointer-events-none absolute right-[calc(100%+8px)] top-1/2 z-20 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#062357] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"

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
  const [isFullScreen, setIsFullScreen] = useState(false)

  useEffect(() => {
    function syncFullScreen() {
      setIsFullScreen(Boolean(document.fullscreenElement))
    }
    syncFullScreen()
    document.addEventListener("fullscreenchange", syncFullScreen)
    return () => document.removeEventListener("fullscreenchange", syncFullScreen)
  }, [])

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
      label: isFullScreen ? "Exit Full Screen" : "Full Screen",
      icon: isFullScreen ? SideWidgetMedSizeIcon : SideWidgetFullScreenIcon,
      onClick: handleFullScreen,
      active: isFullScreen,
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
      label: expanded ? "Collapse Menu" : "Open Menu",
      icon: expanded ? SideWidgetCollapseMenuIcon : SideWidgetOpenMenuIcon,
      onClick: () => setExpanded((open) => !open),
    },
  ]

  return (
    <aside
      className={cn(
        "practice-session-side-widget absolute right-0 top-6 z-10 flex flex-col overflow-visible",
        expanded ? ACTIVE_DRILL_SIDE_WIDGET_EXPANDED_CLASS : ACTIVE_DRILL_SIDE_WIDGET_COLLAPSED_CLASS,
      )}
      aria-label="Exam tools"
    >
      {items.map((item) => {
        const Icon = item.icon
        const isFlag = item.id === "flag"
        return (
          <button
            key={item.id}
            type="button"
            disabled={item.disabled}
            className={cn(
              "group relative",
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
            ) : (
              <span className={SIDE_WIDGET_HOVER_LABEL_CLASS} aria-hidden>
                {item.label}
              </span>
            )}
          </button>
        )
      })}
    </aside>
  )
}

export { PracticeSessionSideWidget, PracticeSessionSideWidget as PracticeSessionSideActionRail }
