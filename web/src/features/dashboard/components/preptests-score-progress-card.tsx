import { useState } from "react"

import {
  ScoreProgressChart,
  ScoreProgressTabs,
  type ScoreProgressTab,
} from "@/features/student/analytics/components/analytics-overview-ui"
import type { ScoreProgressPoint } from "@/features/student/lib/mock-analytics"

type PrepTestsScoreProgressCardProps = {
  points: ScoreProgressPoint[]
}

/** Figma `19640:23056` — dashboard PrepTests Score Progress panel */
function PrepTestsScoreProgressCard({ points }: PrepTestsScoreProgressCardProps) {
  const [tab, setTab] = useState<ScoreProgressTab>("both")

  return (
    <section className="flex min-w-0 flex-col rounded-[24px] border border-[#dfe1e7] bg-white p-6">
      <div className="flex min-h-[465px] flex-col gap-[18px] rounded-2xl bg-[#f6f8fa] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#062357] uppercase">
            PrepTests Score Progress
          </h2>
          <ScoreProgressTabs value={tab} onChange={setTab} variant="dashboard" />
        </div>

        <div className="min-h-0 flex-1 pb-2">
          <ScoreProgressChart points={points} tab={tab} variant="dashboard" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-[#e5e7eb] pt-6">
          <span className="inline-flex items-center gap-2 px-4 text-sm tracking-[0.28px] text-[#666d80]">
            <span className="size-4 rounded-full bg-[#0d47a1]" aria-hidden />
            Regular Score
          </span>
          <span className="inline-flex items-center gap-2 px-4 text-sm tracking-[0.28px] text-[#666d80]">
            <span className="size-4 rounded-full bg-[#ff6f00]" aria-hidden />
            Blind Review
          </span>
        </div>
      </div>
    </section>
  )
}

export { PrepTestsScoreProgressCard }
