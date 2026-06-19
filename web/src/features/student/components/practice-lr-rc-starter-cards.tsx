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
    <div className="grid gap-[32px] lg:grid-cols-2">
      <article className="rounded-[24px] border border-[#dfe1e7] bg-[#f6f8fa] px-[24px] py-[36px] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
        <div className="flex items-center gap-[22px]">
          <div className="flex h-[52px] min-w-0 flex-1 items-center gap-[10px]">
            <span className="inline-flex size-[40px] shrink-0 items-center justify-center rounded-[12px] border-[1.667px] border-[#00bc54] bg-[#eafff4] text-[16.67px] font-black leading-[1.5] tracking-[0.53px] text-[#00bc54]">
              LR
            </span>
            <div className="min-w-0">
              <h2 className="text-[20px] font-bold leading-[1.35] text-[#062357]">Logical Reasoning</h2>
              <p className="mt-[3px] text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[#062357]">
                {lrSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="h-[52px] shrink-0 rounded-[16px] border border-[#00bc54] bg-[#eafff4] px-[16px] text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[#00bc54] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"
            onClick={onStartLr}
          >
            {lrButtonLabel}
          </button>
        </div>
      </article>

      <article className="rounded-[24px] border border-[#dfe1e7] bg-[#f6f8fa] px-[24px] py-[36px] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
        <div className="flex items-center gap-[22px]">
          <div className="flex h-[52px] min-w-0 flex-1 items-center gap-[10px]">
            <span className="inline-flex size-[40px] shrink-0 items-center justify-center rounded-[12px] border border-[#0bbcc9] bg-[#e5fdff] text-[16.67px] font-black leading-[1.5] tracking-[0.53px] text-[#0bbcc9]">
              RC
            </span>
            <div className="min-w-0">
              <h2 className="text-[20px] font-bold leading-[1.35] text-[#062357]">Reading Comprehension</h2>
              <p className="mt-[3px] text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[#062357]">
                {rcSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="h-[52px] shrink-0 rounded-[16px] border border-[#0bbcc9] bg-[#e5fdff] px-[16px] text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[#0bbcc9] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"
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
