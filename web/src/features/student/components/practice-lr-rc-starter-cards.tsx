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
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <article className="rounded-2xl border border-[#d8dee8] bg-[#eef2f6] px-4 py-6 shadow-[0px_4px_10px_rgba(13,13,18,0.08)]">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[#fff5d8] text-sm font-black text-[#ae8b00]">
            LR
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="shrink-0 whitespace-nowrap text-[20px] font-normal leading-tight text-[#062357]">
                Logical Reasoning
              </h2>
              <button
                type="button"
                className="h-10 shrink-0 rounded-xl border border-[#ad52d9] bg-[#fff3cb] px-4 text-[16px] font-semibold leading-none tracking-[0.2px] text-[#ae8b00]"
                onClick={onStartLr}
              >
                {lrButtonLabel}
              </button>
            </div>
            <p className="mt-1 text-[12px] leading-tight tracking-[0.2px] text-[#3c527f]">{lrSubtitle}</p>
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-[#d8dee8] bg-[#eef2f6] px-4 py-6 shadow-[0px_4px_10px_rgba(13,13,18,0.08)]">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[#ff7f1f] text-sm font-black text-white">
            RC
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="shrink-0 whitespace-nowrap text-[20px] font-normal leading-tight text-[#062357]">
                Reading Comprehension
              </h2>
              <button
                type="button"
                className="h-10 shrink-0 rounded-xl border border-[#5ecab4] bg-[#fff0df] px-4 text-[16px] font-semibold leading-none tracking-[0.2px] text-[#ff9d51]"
                onClick={onStartRc}
              >
                {rcButtonLabel}
              </button>
            </div>
            <p className="mt-1 text-[12px] leading-tight tracking-[0.2px] text-[#3c527f]">{rcSubtitle}</p>
          </div>
        </div>
      </article>
    </div>
  )
}

export { PracticeLrRcStarterCards }
