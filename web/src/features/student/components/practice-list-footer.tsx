type PracticeListFooterProps = {
  hasMore: boolean
  onShowMore: () => void
  showMoreLabel?: string
}

function PracticeListFooter({
  hasMore,
  onShowMore,
  showMoreLabel = "Show more",
}: PracticeListFooterProps) {
  return (
    <div className="flex h-[32px] items-center justify-center">
      {hasMore ? (
        <button
          type="button"
          className="text-[16px] font-semibold leading-[1.35] text-[var(--primary)] hover:underline"
          onClick={onShowMore}
        >
          {showMoreLabel}
        </button>
      ) : (
        <p className="text-[16px] font-semibold leading-[1.35] text-[var(--primary)]">No More</p>
      )}
    </div>
  )
}

export { PracticeListFooter }
