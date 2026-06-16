type DrillSection = "LR" | "RC"

function SectionInitialBadge({ section }: { section: DrillSection }) {
  const isLr = section === "LR"
  const accentColor = isLr ? "var(--explanation-lr-badge-bg)" : "var(--explanation-rc-badge-bg)"
  return (
    <span
      className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-white text-lg font-black leading-none tracking-tight"
      style={{ borderColor: accentColor, color: accentColor }}
    >
      {section}
    </span>
  )
}

export { SectionInitialBadge, type DrillSection }
