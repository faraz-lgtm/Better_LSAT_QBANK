type StarterSection = "lr" | "rc"

type PracticeLrRcStarterCardsProps = {
  lrButtonLabel: string
  rcButtonLabel: string
  lrSubtitle: string
  rcSubtitle: string
  onStartLr: () => void
  onStartRc: () => void
  /** Which section cards to show. Default both. */
  visibleSections?: StarterSection[]
  /**
   * `inline` — horizontal row used on Sections.
   * `stacked` — Figma drills “Start A New Drill” nested card (title above, CTA bottom-right).
   */
  layout?: "inline" | "stacked"
}

function PracticeLrRcStarterCards({
  lrButtonLabel,
  rcButtonLabel,
  lrSubtitle,
  rcSubtitle,
  onStartLr,
  onStartRc,
  visibleSections = ["lr", "rc"],
  layout = "inline",
}: PracticeLrRcStarterCardsProps) {
  const showLr = visibleSections.includes("lr")
  const showRc = visibleSections.includes("rc")

  if (layout === "stacked") {
    const both = showLr && showRc
    return (
      <div className={`grid gap-[24px] ${both ? "lg:grid-cols-2" : "max-w-[502px] grid-cols-1"}`}>
        {showLr ? (
          <article className="flex flex-col gap-[16px] rounded-[18px] border border-[#dfe1e7] bg-white p-[24px] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
            <div className="flex flex-col gap-[6px]">
              <div className="flex items-center gap-[12px]">
                <span className="inline-flex size-[32px] shrink-0 items-center justify-center rounded-[8px] border-[0.5px] border-[#00bc54] bg-[#eafff4] text-[14px] font-black leading-[1.5] tracking-[0.28px] text-[#00bc54]">
                  LR
                </span>
                <h3 className="text-[16px] font-semibold leading-[1.35] text-[#041a44]">
                  Logical Reasoning
                </h3>
              </div>
              <p className="pl-[44px] text-[14px] font-normal leading-[1.5] tracking-[0.28px] text-[#666d80]">
                {lrSubtitle}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex h-[40px] items-center justify-center rounded-[12px] border border-[#0b4e6e] bg-[#0d47a1] px-[16px] text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
                onClick={onStartLr}
              >
                {lrButtonLabel}
              </button>
            </div>
          </article>
        ) : null}

        {showRc ? (
          <article className="flex flex-col gap-[16px] rounded-[18px] border border-[#dfe1e7] bg-white p-[24px] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
            <div className="flex flex-col gap-[6px]">
              <div className="flex items-center gap-[12px]">
                <span className="inline-flex size-[32px] shrink-0 items-center justify-center rounded-[8px] border-[0.5px] border-[#0bbcc9] bg-[#e5fdff] text-[14px] font-black leading-[1.5] tracking-[0.28px] text-[#0bbcc9]">
                  RC
                </span>
                <h3 className="text-[16px] font-semibold leading-[1.35] text-[#041a44]">
                  Reading Comprehension
                </h3>
              </div>
              <p className="pl-[44px] text-[14px] font-normal leading-[1.5] tracking-[0.28px] text-[#666d80]">
                {rcSubtitle}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex h-[40px] items-center justify-center rounded-[12px] border border-[#0b4e6e] bg-[#0d47a1] px-[16px] text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
                onClick={onStartRc}
              >
                {rcButtonLabel}
              </button>
            </div>
          </article>
        ) : null}
      </div>
    )
  }

  return (
    <div className={`grid gap-[32px] ${showLr && showRc ? "lg:grid-cols-2" : "grid-cols-1"}`}>
      {showLr ? (
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
      ) : null}

      {showRc ? (
        <article className="rounded-[24px] border border-[#dfe1e7] bg-[#f6f8fa] px-[24px] py-[36px] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
          <div className="flex items-center gap-[22px]">
            <div className="flex h-[52px] min-w-0 flex-1 items-center gap-[10px]">
              <span className="inline-flex size-[40px] shrink-0 items-center justify-center rounded-[12px] border border-[#0bbcc9] bg-[#e5fdff] text-[16.67px] font-black leading-[1.5] tracking-[0.53px] text-[#0bbcc9]">
                RC
              </span>
              <div className="min-w-0">
                <h2 className="text-[20px] font-bold leading-[1.35] text-[#062357]">
                  Reading Comprehension
                </h2>
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
      ) : null}
    </div>
  )
}

export { PracticeLrRcStarterCards }
