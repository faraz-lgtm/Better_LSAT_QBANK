type DrillSection = "LR" | "RC"

function SectionInitialBadge({ section }: { section: DrillSection }) {
  const isLr = section === "LR"
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
