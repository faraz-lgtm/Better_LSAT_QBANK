import { ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CARD_SHADOW } from "@/features/student/practice-session/practice-preptest-section-intro-panel"
import {
  formatDiagnosticTimeMinutes,
  type GuestDiagnosticTestConfig,
} from "@/features/guest/diagnostic/guest-diagnostic-test-config"

type GuestDiagnosticTestInstructionsPanelProps = {
  config: GuestDiagnosticTestConfig
  onGoToQuestions: () => void
}

/** Figma `19510:22745` — diagnostic test instructions modal card */
function GuestDiagnosticTestInstructionsPanel({
  config,
  onGoToQuestions,
}: GuestDiagnosticTestInstructionsPanelProps) {
  return (
    <div
      className={`flex w-full max-w-[648px] flex-col gap-6 rounded-[16px] border border-[#dfe1e7] bg-[#f6f8fa] p-6 ${CARD_SHADOW}`}
      data-node-id="19510:22745"
    >
      <div className="flex w-full flex-col gap-4">
        <h2 className="text-[20px] font-bold leading-[1.35] text-[#062357]">{config.title}</h2>
        <div className="flex items-center justify-between text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[#0d47a1]">
          <span>
            {config.questionCount} question{config.questionCount === 1 ? "" : "s"}
          </span>
          <span>Time: {formatDiagnosticTimeMinutes(config.timeMinutes)}</span>
        </div>
      </div>

      <div className="flex w-full flex-col items-end gap-4">
        <p className="w-full text-[14px] font-normal leading-[1.5] tracking-[0.28px] text-[#0d0d12]">
          {config.instructions}
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

export { GuestDiagnosticTestInstructionsPanel }
