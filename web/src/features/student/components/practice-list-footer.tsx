type PracticeListFooterProps = {
  hasMore: boolean
  onShowMore: () => void
  expanded?: boolean
  onShowLess?: () => void
  showMoreLabel?: string
  showLessLabel?: string
  /** Optional label color override (e.g. free-plan Figma primary-700). */
  labelClassName?: string
}

function PracticeListFooter({
  hasMore,
  onShowMore,
  expanded = false,
  onShowLess,
  showMoreLabel = "See more",
  showLessLabel = "See less",
  labelClassName = "text-[var(--primary)]",
}: PracticeListFooterProps) {
  const canCollapse = Boolean(expanded && onShowLess)
  if (!hasMore && !canCollapse) return null

  const label = hasMore ? showMoreLabel : showLessLabel
  const onClick = hasMore ? onShowMore : onShowLess

  return (
    <div className="flex h-[32px] items-center justify-center">
      <button
        type="button"
        className={`text-[16px] font-semibold leading-[1.35] hover:underline ${labelClassName}`}
        onClick={onClick}
      >
        {label}
      </button>
    </div>
  )
}

export { PracticeListFooter }
