function drillFilterPillClass(active: boolean): string {
  if (active) {
    return "h-[40px] rounded-[14px] border border-[var(--primary-border)] bg-[var(--primary)] px-[16px] text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
  }
  /* Figma dark: Neutral/0 pill, primary label (node 20645:40063) */
  return "h-[40px] rounded-[14px] bg-[var(--greyscale-0)] px-[16px] text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-[var(--primary)]"
}

export { drillFilterPillClass }
