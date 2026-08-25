import { useState, type ComponentType, type SVGProps } from "react"

import {
  ACTIVE_DRILL_SIDE_WIDGET_COLLAPSED_CLASS,
  ACTIVE_DRILL_SIDE_WIDGET_EXPANDED_CLASS,
  ACTIVE_DRILL_SIDE_WIDGET_ITEM_CLASS,
  ACTIVE_DRILL_SIDE_WIDGET_ITEM_EXPANDED_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import {
  SideWidgetAccessibilityIcon,
  SideWidgetCollapseDockIcon,
  SideWidgetFlagIcon,
  SideWidgetResponseMaskingIcon,
  SideWidgetReviewIcon,
} from "@/features/student/practice-session/practice-session-side-widget-icons"
import { cn } from "@/lib/utils"

type SideWidgetIconComponent = ComponentType<SVGProps<SVGSVGElement> & { expanded?: boolean }>

type PracticeSessionSideWidgetProps = {
  flagged: boolean
  onToggleFlag: () => void
  flagsDisabled?: boolean
  responseMasking: boolean
  onToggleResponseMasking: () => void
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

/** Figma `20268:102762` — exam side widget with expand/collapse */
function PracticeSessionSideWidget({
  flagged,
  onToggleFlag,
  flagsDisabled,
  responseMasking,
  onToggleResponseMasking,
  onReview,
  onAccessibility,
}: PracticeSessionSideWidgetProps) {
  const [expanded, setExpanded] = useState(false)

  const items: SideWidgetItem[] = [
    {
      id: "review",
      label: "Review",
      icon: SideWidgetReviewIcon,
      onClick: () => onReview?.(),
    },
    {
      id: "accessibility",
      label: "Accessibility",
      icon: SideWidgetAccessibilityIcon,
      onClick: () => onAccessibility?.(),
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
      icon: SideWidgetCollapseDockIcon,
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
        const isCollapse = item.id === "collapse"
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
            aria-pressed={isCollapse ? expanded : item.active || undefined}
            aria-expanded={isCollapse ? expanded : undefined}
            onClick={item.onClick}
          >
            <Icon className="shrink-0" expanded={isCollapse ? expanded : undefined} aria-hidden />
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
