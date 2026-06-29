import { ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  formatSectionTimeMinutes,
  sectionIntroDirections,
  sectionIntroTitle,
} from "@/features/student/sections/section-intro-directions"
import type { SectionType } from "@/features/student/sections/section-types"

const CARD_SHADOW =
  "shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"

type PracticePrepTestSectionIntroPanelProps = {
  sectionNumber: number | null
  sectionType: SectionType
  questionCount: number
  timeMinutes: number | null
  onGoToQuestions: () => void
}

/** Figma `18617:26312` — inner directions card (648×326) */
function PracticePrepTestSectionIntroPanel({
  sectionNumber,
  sectionType,
  questionCount,
  timeMinutes,
  onGoToQuestions,
}: PracticePrepTestSectionIntroPanelProps) {
  return (
    <div
      className={`flex w-full flex-col gap-6 rounded-[16px] border border-[#dfe1e7] bg-[#f6f8fa] p-6 ${CARD_SHADOW}`}
    >
      <div className="flex w-full flex-col gap-4">
        <h2 className="text-[20px] font-bold leading-[1.35] text-[#062357]">
          {sectionIntroTitle(sectionNumber, sectionType)}
        </h2>
        <div className="flex items-center justify-between text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[#0d47a1]">
          <span>
            {questionCount} question{questionCount === 1 ? "" : "s"}
          </span>
          <span>
            Time:{" "}
            {timeMinutes == null ? "Unlimited" : formatSectionTimeMinutes(timeMinutes)}
          </span>
        </div>
      </div>

      <div className="flex w-full flex-col items-end gap-4">
        <p className="w-full text-[14px] font-normal leading-[1.5] tracking-[0.28px] text-[#0d0d12]">
          Directions: {sectionIntroDirections(sectionType)}
        </p>
        <Button
          type="button"
          className="ds-btn h-12 gap-2 rounded-[16px] px-4 text-[16px] font-semibold leading-[1.5] tracking-[0.32px]"
          onClick={onGoToQuestions}
        >
          Go to Question
          <ChevronRight className="size-5" aria-hidden />
        </Button>
      </div>
    </div>
  )
}

export { PracticePrepTestSectionIntroPanel, CARD_SHADOW }
