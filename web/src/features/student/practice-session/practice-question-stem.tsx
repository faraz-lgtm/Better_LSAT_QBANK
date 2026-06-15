import type { MouseEvent } from "react"

import { PracticeAnnotatedContent } from "@/features/student/practice-session/practice-annotated-content"
import { PracticeQuestionFlagButton } from "@/features/student/practice-session/practice-question-flag-button"
import type { PracticeSessionVariant, PracticeToolMode, RegionKey } from "@/features/student/practice-session/practice-session-types"

type PracticeQuestionStemProps = {
  questionNumber: number
  regionKey: RegionKey
  html: string
  findQuery: string
  toolMode: PracticeToolMode
  onContentMouseUp: (regionKey: RegionKey, container: HTMLElement | null, event?: MouseEvent) => void
  onContentClick: (regionKey: RegionKey, container: HTMLElement | null, event: MouseEvent) => void
  flagged: boolean
  onToggleFlag: () => void
  flagsDisabled?: boolean
  hideQuestionNumber?: boolean
  variant?: PracticeSessionVariant
}

function PracticeQuestionStem({
  questionNumber,
  regionKey,
  html,
  findQuery,
  toolMode,
  onContentMouseUp,
  onContentClick,
  flagged,
  onToggleFlag,
  flagsDisabled,
  hideQuestionNumber = false,
  variant = "default",
}: PracticeQuestionStemProps) {
  const isActiveDrill = variant === "active-drill"

  if (isActiveDrill) {
    return (
      <div className="shrink-0 border-b border-[#dfe1e7] bg-white px-3 py-3">
        <div className="flex items-start gap-3">
          <PracticeAnnotatedContent
            regionKey={regionKey}
            html={html}
            findQuery={findQuery}
            scrollAnchor
            as="div"
            className="min-w-0 flex-1 text-lg leading-normal text-[#0d0d12] [&_p:first-child]:mt-0 [&_p:last-child]:mb-0"
            toolMode={toolMode}
            onMouseUp={onContentMouseUp}
            onClickCapture={onContentClick}
          />
          <PracticeQuestionFlagButton flagged={flagged} onToggle={onToggleFlag} disabled={flagsDisabled} />
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
          className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[#062357] [&_p:first-child]:mt-0 [&_p:last-child]:mb-0"
          toolMode={toolMode}
          onMouseUp={onContentMouseUp}
          onClickCapture={onContentClick}
        />
      </div>
      <PracticeQuestionFlagButton flagged={flagged} onToggle={onToggleFlag} disabled={flagsDisabled} />
    </div>
  )
}

export { PracticeQuestionStem }
