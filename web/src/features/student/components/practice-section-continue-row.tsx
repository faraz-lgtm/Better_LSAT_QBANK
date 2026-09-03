import { ChevronRight } from "lucide-react"

import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"

type PracticeSectionContinueRowProps = {
  section: "LR" | "RC"
  title: string
  timeLeftLabel: string
  onContinue: () => void
}

function PracticeSectionContinueRow({
  section,
  title,
  timeLeftLabel,
  onContinue,
}: PracticeSectionContinueRowProps) {
  return (
    <div className="border-b border-[#dfe1e7]">
      <div className="flex flex-col gap-[16px] p-[16px] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-[6px]">
          <div className="flex min-w-0 items-center gap-[12px]">
            <SectionInitialBadge section={section} variant="compact" />
            <h3 className="truncate text-[16px] font-semibold leading-[1.35] text-[#041a44]">{title}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-[12px] pl-[44px]">
            <span className="inline-flex h-[28px] items-center gap-[8px] rounded-[10px] bg-[#f6f8fa] px-[16px]">
              <span className="size-[8px] rounded-full bg-[#666d80]" aria-hidden />
              <span className="text-[12px] font-semibold leading-[1.5] tracking-[0.24px] text-[#666d80]">
                In Process
              </span>
            </span>
            <p className="text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[#666d80]">
              {timeLeftLabel}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-[40px] shrink-0 items-center justify-center gap-[8px] self-start rounded-[14px] border border-[#dfe1e7] bg-white px-[16px] text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-[#0d47a1] shadow-[0px_1px_2px_rgba(13,13,18,0.06)] hover:bg-[#f6f8fa] sm:self-auto"
        >
          Continue
          <ChevronRight className="size-[16px]" aria-hidden />
        </button>
      </div>
    </div>
  )
}

export { PracticeSectionContinueRow }
