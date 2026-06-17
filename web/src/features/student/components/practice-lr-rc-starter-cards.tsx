type PracticeLrRcStarterCardsProps = {
  lrButtonLabel: string
  rcButtonLabel: string
  lrSubtitle: string
  rcSubtitle: string
  onStartLr: () => void
  onStartRc: () => void
}

function PracticeLrRcStarterCards({
  lrButtonLabel,
  rcButtonLabel,
  lrSubtitle,
  rcSubtitle,
  onStartLr,
  onStartRc,
}: PracticeLrRcStarterCardsProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <article className="rounded-3xl border border-[#dfe1e7] bg-[#f6f8fa] px-6 py-9 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
        <div className="flex items-center gap-[22px]">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] border-[1.667px] border-[#00bc54] bg-[#eafff4] text-lg font-black leading-none text-[#00bc54]">
              LR
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold leading-[1.35] text-[#062357]">Logical Reasoning</h2>
              <p className="mt-0.5 text-xs leading-[1.5] tracking-[0.24px] text-[#062357]">{lrSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            className="h-[52px] shrink-0 rounded-3xl border border-[#00bc54] bg-[#eafff4] px-4 text-base font-semibold leading-none tracking-[0.32px] text-[#00bc54] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"
            onClick={onStartLr}
          >
            {lrButtonLabel}
          </button>
        </div>
      </article>

      <article className="rounded-3xl border border-[#dfe1e7] bg-[#f6f8fa] px-6 py-9 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
        <div className="flex items-center gap-[22px]">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-[#0bbcc9] bg-[#e5fdff] text-lg font-black leading-none text-[#0bbcc9]">
              RC
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold leading-[1.35] text-[#062357]">Reading Comprehension</h2>
              <p className="mt-0.5 text-xs leading-[1.5] tracking-[0.24px] text-[#062357]">{rcSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            className="h-[52px] shrink-0 rounded-3xl border border-[#0bbcc9] bg-[#e5fdff] px-4 text-base font-semibold leading-none tracking-[0.32px] text-[#0bbcc9] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"
            onClick={onStartRc}
          >
            {rcButtonLabel}
          </button>
        </div>
      </article>
    </div>
  )
}

export { PracticeLrRcStarterCards }
