function DecorativeScene() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute top-[26%] left-[14%] h-20 w-20 border border-[#36394a]/60" />
      <div className="absolute bottom-[16%] left-[14%] h-24 w-16 bg-[#0d47a1]" />
      <div className="absolute bottom-[16%] right-[14%] h-20 w-14 bg-[#0d47a1]" />
      <div className="absolute top-[28%] right-[22%] h-10 w-14 border border-[#36394a]/60" />
      <div className="absolute right-[26%] bottom-[28%] h-48 w-28 rounded-t-[70px] rounded-b-[12px] bg-[#0d47a1]/10" />
      <div className="absolute right-[28%] bottom-[25%] h-24 w-20 rounded-3xl bg-[#0d47a1]" />
      <div className="absolute inset-x-[7%] bottom-[16%] h-px bg-[#36394a]/40" />
    </div>
  )
}

export { DecorativeScene }
