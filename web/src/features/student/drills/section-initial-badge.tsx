type DrillSection = "LR" | "RC"

type SectionInitialBadgeProps = {
  section: DrillSection
  variant?: "default" | "section" | "compact"
}

function SectionInitialBadge({ section, variant = "default" }: SectionInitialBadgeProps) {
  const isLr = section === "LR"
  /* Figma dark: secondary-green-300 / secondary-blue-300 fills (node 20645:40107) */
  const tone = isLr
    ? "border-[var(--explanation-answered)] bg-[var(--explanation-answered-bg)] text-[var(--explanation-answered)]"
    : "border-[var(--explanation-teal)] bg-[var(--explanation-rc-badge-bg-light)] text-[var(--explanation-teal)]"

  if (variant === "compact") {
    return (
      <span
        className={`inline-flex size-[32px] shrink-0 items-center justify-center rounded-[8px] border-[0.5px] p-[5px] text-[14px] font-black leading-[1.5] tracking-[0.28px] ${tone}`}
      >
        {section}
      </span>
    )
  }

  if (variant === "section") {
    return (
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-[8px] p-[5px] text-xl font-black leading-normal tracking-[0.4px] ${
          isLr
            ? "bg-[var(--explanation-answered-bg)] text-[var(--explanation-answered)]"
            : "bg-[var(--explanation-rc-badge-bg-light)] text-[var(--explanation-teal)]"
        }`}
      >
        {section}
      </span>
    )
  }

  return (
    <span
      className={`flex size-10 shrink-0 items-center justify-center rounded-[14px] border p-[5px] text-xl font-black leading-none ${tone}`}
    >
      {section}
    </span>
  )
}

export { SectionInitialBadge, type DrillSection }
