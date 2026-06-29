type DrillSection = "LR" | "RC"

type SectionInitialBadgeProps = {
  section: DrillSection
  variant?: "default" | "section"
}

function SectionInitialBadge({ section, variant = "default" }: SectionInitialBadgeProps) {
  const isLr = section === "LR"

  if (variant === "section") {
    return (
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-[8px] p-[5px] text-xl font-black leading-normal tracking-[0.4px] ${
          isLr ? "bg-[#eafff4] text-[#00bc54]" : "bg-[#e5fdff] text-[#0bbcc9]"
        }`}
      >
        {section}
      </span>
    )
  }

  return (
    <span
      className={`flex size-10 shrink-0 items-center justify-center rounded-[14px] border p-[5px] text-xl font-black leading-none ${
        isLr
          ? "border-[#00bc54] bg-[#eafff4] text-[#00bc54]"
          : "border-[#0bbcc9] bg-[#e5fdff] text-[#0bbcc9]"
      }`}
    >
      {section}
    </span>
  )
}

export { SectionInitialBadge, type DrillSection }
