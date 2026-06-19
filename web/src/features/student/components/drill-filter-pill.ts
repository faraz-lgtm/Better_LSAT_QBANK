function drillFilterPillClass(active: boolean): string {
  if (active) {
    return "h-[40px] rounded-[16px] border border-[#0b4e6e] bg-[#0d47a1] px-[16px] text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
  }
  return "h-[40px] rounded-[12px] border border-[#dfe1e7] bg-white px-[16px] text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-[#0d47a1] shadow-[0px_1px_2px_rgba(13,13,18,0.06)]"
}

export { drillFilterPillClass }
