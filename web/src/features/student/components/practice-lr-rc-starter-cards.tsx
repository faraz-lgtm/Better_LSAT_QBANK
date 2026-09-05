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
   * `stacked` — Figma drills "Start A New Drill" nested card (title above, CTA bottom-right).
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
          <article className="flex flex-col gap-[16px] rounded-[18px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] p-[24px] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)] dark:bg-[var(--greyscale-0)]">
            <div className="flex flex-col gap-[6px]">
              <div className="flex items-center gap-[12px]">
                <span className="inline-flex size-[32px] shrink-0 items-center justify-center rounded-[8px] border-[0.5px] border-[var(--explanation-answered)] bg-[var(--explanation-answered-bg)] text-[14px] font-black leading-[1.5] tracking-[0.28px] text-[var(--explanation-answered)]">
                  LR
                </span>
                <h3 className="text-[16px] font-semibold leading-[1.35] text-[var(--color-student-heading)]">
                  Logical Reasoning
                </h3>
              </div>
              <p className="pl-[44px] text-[14px] font-normal leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]">
                {lrSubtitle}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex h-[40px] items-center justify-center rounded-[12px] border border-[var(--primary-border)] bg-[var(--primary)] px-[16px] text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
                onClick={onStartLr}
              >
                {lrButtonLabel}
              </button>
            </div>
          </article>
        ) : null}

        {showRc ? (
          <article className="flex flex-col gap-[16px] rounded-[18px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] p-[24px] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)] dark:bg-[var(--greyscale-0)]">
            <div className="flex flex-col gap-[6px]">
              <div className="flex items-center gap-[12px]">
                <span className="inline-flex size-[32px] shrink-0 items-center justify-center rounded-[8px] border-[0.5px] border-[var(--explanation-teal)] bg-[var(--explanation-rc-badge-bg-light)] text-[14px] font-black leading-[1.5] tracking-[0.28px] text-[var(--explanation-teal)]">
                  RC
                </span>
                <h3 className="text-[16px] font-semibold leading-[1.35] text-[var(--color-student-heading)]">
                  Reading Comprehension
                </h3>
              </div>
              <p className="pl-[44px] text-[14px] font-normal leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]">
                {rcSubtitle}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex h-[40px] items-center justify-center rounded-[12px] border border-[var(--primary-border)] bg-[var(--primary)] px-[16px] text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
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
        <article className="rounded-[24px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-[24px] py-[36px] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
          <div className="flex items-center gap-[22px]">
            <div className="flex h-[52px] min-w-0 flex-1 items-center gap-[10px]">
              <span className="inline-flex size-[40px] shrink-0 items-center justify-center rounded-[12px] border-[1.667px] border-[var(--explanation-answered)] bg-[var(--explanation-answered-bg)] text-[16.67px] font-black leading-[1.5] tracking-[0.53px] text-[var(--explanation-answered)]">
                LR
              </span>
              <div className="min-w-0">
                <h2 className="text-[20px] font-bold leading-[1.35] text-[var(--color-student-heading)]">
                  Logical Reasoning
                </h2>
                <p className="mt-[3px] text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[var(--color-student-heading)]">
                  {lrSubtitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="h-[52px] shrink-0 rounded-[16px] border border-[var(--explanation-answered)] bg-[var(--explanation-answered-bg)] px-[16px] text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[var(--explanation-answered)] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"
              onClick={onStartLr}
            >
              {lrButtonLabel}
            </button>
          </div>
        </article>
      ) : null}

      {showRc ? (
        <article className="rounded-[24px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-[24px] py-[36px] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]">
          <div className="flex items-center gap-[22px]">
            <div className="flex h-[52px] min-w-0 flex-1 items-center gap-[10px]">
              <span className="inline-flex size-[40px] shrink-0 items-center justify-center rounded-[12px] border border-[var(--explanation-teal)] bg-[var(--explanation-rc-badge-bg-light)] text-[16.67px] font-black leading-[1.5] tracking-[0.53px] text-[var(--explanation-teal)]">
                RC
              </span>
              <div className="min-w-0">
                <h2 className="text-[20px] font-bold leading-[1.35] text-[var(--color-student-heading)]">
                  Reading Comprehension
                </h2>
                <p className="mt-[3px] text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[var(--color-student-heading)]">
                  {rcSubtitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="h-[52px] shrink-0 rounded-[16px] border border-[var(--explanation-teal)] bg-[var(--explanation-rc-badge-bg-light)] px-[16px] text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[var(--explanation-teal)] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"
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
