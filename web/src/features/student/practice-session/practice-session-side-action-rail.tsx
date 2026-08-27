import { useState, type ComponentType, type ReactNode, type SVGProps } from "react"

import {
  ACTIVE_DRILL_SIDE_WIDGET_COLLAPSED_CLASS,
  ACTIVE_DRILL_SIDE_WIDGET_EXPANDED_CLASS,
  ACTIVE_DRILL_SIDE_WIDGET_ITEM_CLASS,
  ACTIVE_DRILL_SIDE_WIDGET_ITEM_EXPANDED_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import {
  OFFICIAL_SIDE_WIDGET_CLASS,
  OFFICIAL_SIDE_WIDGET_EXPANDED_CLASS,
  OFFICIAL_SIDE_WIDGET_ITEM_CLASS,
  OFFICIAL_SIDE_WIDGET_ITEM_EXPANDED_CLASS,
} from "@/features/student/practice-session/practice-session-official-styles"
import {
  SideWidgetAccessibilityIcon,
  SideWidgetArrowsPointingInIcon,
  SideWidgetCollapseDockIcon,
  SideWidgetExpandIcon,
  SideWidgetFlagIcon,
  SideWidgetHighlighterIcon,
  SideWidgetResponseMaskingIcon,
  SideWidgetReviewIcon,
} from "@/features/student/practice-session/practice-session-side-widget-icons"
import { isOfficialLayout, type PracticeSessionVariant, type PracticeToolMode } from "@/features/student/practice-session/practice-session-types"
import { cn } from "@/lib/utils"

type SideWidgetIconComponent = ComponentType<SVGProps<SVGSVGElement> & { expanded?: boolean; active?: boolean }>

type PracticeSessionSideWidgetProps = {
  flagged: boolean
  onToggleFlag: () => void
  flagsDisabled?: boolean
  responseMasking: boolean
  onToggleResponseMasking: () => void
  onReview?: () => void
  reviewActive?: boolean
  onAccessibility?: () => void
  variant?: PracticeSessionVariant
  toolMode?: PracticeToolMode
  onHighlighter?: () => void
  onEraser?: () => void
  lineFocusActive?: boolean
  onLineFocus?: () => void
  onFullscreen?: () => void
  /** Official full-page / browser-fullscreen chrome uses arrows-in. */
  fullView?: boolean
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

/** Figma `20268:102762` — exam side widget; official expanded rail is Figma `20255:51704`. */
function PracticeSessionSideWidget({
  flagged,
  onToggleFlag,
  flagsDisabled,
  responseMasking,
  onToggleResponseMasking,
  onReview,
  reviewActive = false,
  onAccessibility,
  variant = "default",
  toolMode = "none",
  onHighlighter,
  onFullscreen,
  fullView = false,
}: PracticeSessionSideWidgetProps) {
  const [expanded, setExpanded] = useState(false)
  const officialChrome = isOfficialLayout(variant)

  const officialTools: SideWidgetItem[] = [
    {
      id: "fullscreen",
      label: fullView ? "Normal view" : "Full Screen",
      icon: fullView ? SideWidgetArrowsPointingInIcon : SideWidgetExpandIcon,
      onClick: () => onFullscreen?.(),
    },
    {
      id: "review",
      label: "Review",
      icon: SideWidgetReviewIcon,
      onClick: () => onReview?.(),
      active: reviewActive,
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
      id: "highlighter",
      label: "Keyboard Highlight",
      icon: SideWidgetHighlighterIcon,
      onClick: () => onHighlighter?.(),
      active: toolMode === "highlighter",
    },
  ]

  const collapseItem: SideWidgetItem = {
    id: "collapse",
    label: officialChrome
      ? expanded
        ? "Collapse menu"
        : "Open menu"
      : expanded
        ? "Collapse Menu"
        : "Open Menu",
    icon: SideWidgetCollapseDockIcon,
    onClick: () => setExpanded((open) => !open),
  }

  const items: SideWidgetItem[] = officialChrome
    ? [...officialTools, collapseItem]
    : [
        {
          id: "review",
          label: "Review",
          icon: SideWidgetReviewIcon,
          onClick: () => onReview?.(),
          active: reviewActive,
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
        collapseItem,
      ]

  function renderItem(item: SideWidgetItem): ReactNode {
    const Icon = item.icon
    const isCollapse = item.id === "collapse"
    return (
      <button
        key={item.id}
        type="button"
        disabled={item.disabled}
        className={cn(
          "group relative",
          officialChrome
            ? expanded
              ? OFFICIAL_SIDE_WIDGET_ITEM_EXPANDED_CLASS
              : OFFICIAL_SIDE_WIDGET_ITEM_CLASS
            : expanded
              ? ACTIVE_DRILL_SIDE_WIDGET_ITEM_EXPANDED_CLASS
              : ACTIVE_DRILL_SIDE_WIDGET_ITEM_CLASS,
          item.active &&
            (officialChrome
              ? item.id === "flag"
                ? "text-[#1877b1]"
                : "bg-white text-[#1877b1]"
              : "text-[#0d47a1]"),
          item.disabled && "cursor-default opacity-50",
        )}
        aria-label={item.label}
        aria-pressed={isCollapse ? expanded : item.active || undefined}
        aria-expanded={isCollapse ? expanded : undefined}
        onClick={item.onClick}
      >
        <Icon
          className={cn("shrink-0", officialChrome && item.id === "flag" && item.active && "practice-session-side-widget__flag-active")}
          expanded={isCollapse ? expanded : undefined}
          active={officialChrome && item.id === "flag" ? item.active : undefined}
          aria-hidden
        />
        {expanded ? (
          <span
            className={
              officialChrome
                ? "whitespace-nowrap text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[#0d0d12]"
                : "whitespace-nowrap text-sm font-medium text-[#062357]"
            }
          >
            {item.label}
          </span>
        ) : (
          <span className={SIDE_WIDGET_HOVER_LABEL_CLASS} aria-hidden>
            {item.label}
          </span>
        )}
      </button>
    )
  }

  return (
    <aside
      className={cn(
        officialChrome
          ? expanded
            ? OFFICIAL_SIDE_WIDGET_EXPANDED_CLASS
            : OFFICIAL_SIDE_WIDGET_CLASS
          : cn(
              "practice-session-side-widget absolute right-0 top-6 z-10 flex flex-col overflow-visible",
              expanded ? ACTIVE_DRILL_SIDE_WIDGET_EXPANDED_CLASS : ACTIVE_DRILL_SIDE_WIDGET_COLLAPSED_CLASS,
            ),
      )}
      aria-label="Exam tools"
    >
      {officialChrome && expanded ? (
        <>
          <div className="flex w-full flex-col">{officialTools.map(renderItem)}</div>
          {renderItem(collapseItem)}
        </>
      ) : (
        items.map(renderItem)
      )}
    </aside>
  )
}

export { PracticeSessionSideWidget, PracticeSessionSideWidget as PracticeSessionSideActionRail }
