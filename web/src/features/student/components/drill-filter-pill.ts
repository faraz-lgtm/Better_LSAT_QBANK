function drillFilterPillClass(active: boolean, size: "default" | "compact" = "default"): string {
  const compact = size === "compact"
  const shape = compact
    ? "h-[32px] rounded-[12px] px-[12px] text-[12px] font-semibold leading-[1.5] tracking-[0.24px]"
    : "h-[40px] rounded-[14px] px-[16px] text-[14px] font-semibold leading-[1.5] tracking-[0.28px]"

  if (active) {
    return `${shape} border border-[var(--primary-border)] bg-[var(--primary)] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]`
  }
  /* Figma dark: Neutral/0 pill, primary label (node 20645:40063) */
  return compact
    ? `${shape} border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-[var(--primary)]`
    : `${shape} bg-[var(--greyscale-0)] text-[var(--primary)]`
}

export { drillFilterPillClass }
