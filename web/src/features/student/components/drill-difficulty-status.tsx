type DrillDifficultyStatusProps = {
  label: string
  filledBars: number
  color: string
  layout?: "inline" | "stacked"
}

function DifficultyBars({ filledBars, color }: { filledBars: number; color: string }) {
  return (
    <div className="flex items-center gap-[6px]" aria-hidden>
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className="h-[16px] w-[6px] rounded-full"
          style={{ backgroundColor: index < filledBars ? color : "#ced0e7" }}
        />
      ))}
    </div>
  )
}

function DrillDifficultyStatus({
  label,
  filledBars,
  color,
  layout = "inline",
}: DrillDifficultyStatusProps) {
  if (layout === "stacked") {
    return (
      <div className="shrink-0 rounded-[10px] bg-[#f3f7ff] px-[10px] py-[8px]">
        <p className="text-[12px] font-semibold leading-[1.5] tracking-[0.24px]" style={{ color }}>
          {label}
        </p>
        <div className="mt-[10px]">
          <DifficultyBars filledBars={filledBars} color={color} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[40px] shrink-0 items-center gap-[10px] rounded-[10px] bg-white px-[10px]">
      <DifficultyBars filledBars={filledBars} color={color} />
      <span className="text-[12px] font-semibold leading-[1.5] tracking-[0.24px]" style={{ color }}>
        {label}
      </span>
    </div>
  )
}

export { DrillDifficultyStatus }
