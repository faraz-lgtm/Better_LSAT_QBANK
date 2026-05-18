type DrillSection = "LR" | "RC"

function SectionInitialBadge({ section }: { section: DrillSection }) {
  const isLr = section === "LR"
  return (
    <span
      className="flex size-12 shrink-0 items-center justify-center rounded-lg text-lg font-black leading-none tracking-tight"
      style={
        isLr
          ? { backgroundColor: "var(--lr-badge-bg)", color: "var(--lr-badge-text)" }
          : { backgroundColor: "var(--rc-badge-bg)", color: "var(--rc-badge-text)" }
      }
    >
      {section}
    </span>
  )
}

export { SectionInitialBadge, type DrillSection }
