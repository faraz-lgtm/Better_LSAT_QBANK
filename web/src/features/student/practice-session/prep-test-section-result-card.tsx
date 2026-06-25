import { PracticeResultOutcomeIcon } from "@/features/student/practice-session/practice-result-outcome-icon"

/** Figma `18942:44485` — results-by-section card (212×228) */
const PREP_TEST_SECTION_RESULT_CARD_CLASS =
  "flex h-[228px] w-[212px] shrink-0 flex-col gap-3 rounded-[16px] border border-[#f6f8fa] bg-white p-4"

const PREP_TEST_SECTION_KIND_BADGE_CLASS =
  "flex size-6 shrink-0 items-center justify-center rounded-[8px] border text-xs font-extrabold leading-[1.3]"

const SECTION_BADGE: Record<
  "LR" | "RC",
  { bg: string; text: string; border: string; short: string }
> = {
  LR: { bg: "#eafff4", text: "#00bc54", border: "#00bc54", short: "LR" },
  RC: { bg: "#e5fdff", text: "#0bbcc9", border: "#0bbcc9", short: "RC" },
}

type PrepTestSectionResultCardProps = {
  kind: "LR" | "RC"
  longName: string
  sectionLabel: string
  scoreDelta: string | number
  questionRows: Array<Array<"correct" | "incorrect">>
  accuracyPct: number
}

function PrepTestSectionResultCard({
  kind,
  longName,
  sectionLabel,
  scoreDelta,
  questionRows,
  accuracyPct,
}: PrepTestSectionResultCardProps) {
  const badge = SECTION_BADGE[kind]

  return (
    <article className={PREP_TEST_SECTION_RESULT_CARD_CLASS}>
      <div className="flex h-8 items-center gap-1.5">
        <div
          className={PREP_TEST_SECTION_KIND_BADGE_CLASS}
          style={{ backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }}
        >
          {badge.short}
        </div>
        <p className="text-[10px] font-bold leading-normal tracking-[0.2px] text-[#062357]">{longName}</p>
      </div>

      <div className="flex h-8 w-full items-center justify-between gap-1.5">
        <p className="shrink-0 text-xs font-semibold leading-normal tracking-[0.24px] text-[#062357]">
          {sectionLabel}
        </p>
        <p className="shrink-0 text-2xl font-bold leading-[1.3] text-[#041a44]">{scoreDelta}</p>
      </div>

      <div className="flex flex-col gap-1">
        {questionRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-wrap gap-1">
            {row.map((cell, cellIndex) => (
              <PracticeResultOutcomeIcon
                key={`${rowIndex}-${cellIndex}`}
                correct={cell === "correct"}
                variant="grid"
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex h-5 w-full items-center gap-2">
        <div className="h-1.5 w-[134px] shrink-0 overflow-hidden rounded-[8px] bg-[#f6f8fa]">
          <div
            className="h-full rounded-[8px] bg-[#0d47a1]"
            style={{ width: `${accuracyPct}%` }}
          />
        </div>
        <p className="w-[38px] text-right text-sm font-medium leading-normal tracking-[0.28px] text-[#0d47a1]">
          {accuracyPct}%
        </p>
      </div>
    </article>
  )
}

export {
  PREP_TEST_SECTION_KIND_BADGE_CLASS,
  PREP_TEST_SECTION_RESULT_CARD_CLASS,
  PrepTestSectionResultCard,
  SECTION_BADGE,
}
