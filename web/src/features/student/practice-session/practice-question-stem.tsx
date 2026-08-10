import {
  ACTIVE_DRILL_ACTION_BUTTON_CLASS,
  ACTIVE_DRILL_STEM_GRID_CLASS,
  ACTIVE_DRILL_STEM_SECTION_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"
import { PracticeAnnotatedContent } from "@/features/student/practice-session/practice-annotated-content"
import { PracticeQuestionFlagButton } from "@/features/student/practice-session/practice-question-flag-button"
import { cn } from "@/lib/utils"
import type { PracticeSessionVariant, RegionKey } from "@/features/student/practice-session/practice-session-types"

type PracticeQuestionStemProps = {
  questionNumber: number
  regionKey: RegionKey
  html: string
  findQuery: string
  flagged: boolean
  onToggleFlag: () => void
  flagsDisabled?: boolean
  hideQuestionNumber?: boolean
  variant?: PracticeSessionVariant
  /** When false, flag is rendered by the side action rail instead */
  showSideFlag?: boolean
}

function PracticeQuestionStem({
  questionNumber,
  regionKey,
  html,
  findQuery,
  flagged,
  onToggleFlag,
  flagsDisabled,
  hideQuestionNumber = false,
  variant = "default",
  showSideFlag = true,
}: PracticeQuestionStemProps) {
  const isActiveDrill = variant === "active-drill"

  if (isActiveDrill) {
    return (
      <div className={ACTIVE_DRILL_STEM_SECTION_CLASS}>
        <div className={ACTIVE_DRILL_STEM_GRID_CLASS}>
          <PracticeAnnotatedContent
            regionKey={regionKey}
            html={html}
            findQuery={findQuery}
            scrollAnchor
            as="div"
            toolMode="none"
            className="min-w-0 text-lg leading-[1.35] text-[color:inherit] [&_ol]:m-0 [&_ol]:list-decimal [&_ol]:pl-7 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0"
          />
          {showSideFlag ? (
            <PracticeQuestionFlagButton
              flagged={flagged}
              onToggle={onToggleFlag}
              disabled={flagsDisabled}
              className={cn(ACTIVE_DRILL_ACTION_BUTTON_CLASS, flagged && "text-[#0d47a1]")}
            />
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <div className="flex min-w-0 flex-1 items-start gap-1.5">
        {hideQuestionNumber ? null : (
          <span className="shrink-0 text-sm font-semibold leading-snug text-[#0d47a1]">{questionNumber}.</span>
        )}
        <PracticeAnnotatedContent
          regionKey={regionKey}
          html={html}
          findQuery={findQuery}
          scrollAnchor
          as="div"
          toolMode="none"
          className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[color:inherit] [&_p:first-child]:mt-0 [&_p:last-child]:mb-0"
        />
      </div>
      <PracticeQuestionFlagButton flagged={flagged} onToggle={onToggleFlag} disabled={flagsDisabled} />
    </div>
  )
}

export { PracticeQuestionStem }
