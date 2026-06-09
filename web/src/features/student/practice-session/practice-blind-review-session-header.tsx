import type { ReactNode } from "react"
import { FileText, FolderOpen, List } from "lucide-react"

import type { BlindReviewAnswerView } from "@/features/student/practice-session/practice-blind-review-answer-toggle"
import {
  PracticeBlindReviewSectionSelect,
  type BlindReviewSectionOption,
} from "@/features/student/practice-session/practice-blind-review-section-select"
import { PracticeSessionToolbar } from "@/features/student/practice-session/practice-session-toolbar"
import type { HighlightColor, PracticeToolMode } from "@/features/student/practice-session/practice-session-types"
import { cn } from "@/lib/utils"

type PracticeBlindReviewSessionHeaderProps = {
  prepTestLabel: string
  sectionOptions: BlindReviewSectionOption[]
  activeSectionSessionId: string | null
  onSelectSection: (sectionSessionId: string) => void
  questionRef: string
  actualScoreLabel: string
  answerView: BlindReviewAnswerView
  activeColor: HighlightColor | null
  toolMode: PracticeToolMode
  fontScale: number
  boldEnabled: boolean
  italicEnabled: boolean
  onSelectColor: (color: HighlightColor) => void
  onEraser: () => void
  onUnderline: () => void
  onFontSize: () => void
  onToggleBold: () => void
  onToggleItalic: () => void
  notesOpen: boolean
  notesEnabled: boolean
  onToggleNotes: () => void
  finishButton: ReactNode
}

const toolTextBtnClass =
  "flex size-7 items-center justify-center rounded text-xs font-bold text-[#666d80] transition hover:bg-[#eceff3] hover:text-[#062357]"

function PracticeBlindReviewSessionHeader({
  prepTestLabel,
  sectionOptions,
  activeSectionSessionId,
  onSelectSection,
  questionRef,
  actualScoreLabel,
  answerView,
  activeColor,
  toolMode,
  fontScale,
  boldEnabled,
  italicEnabled,
  onSelectColor,
  onEraser,
  onUnderline,
  onFontSize,
  onToggleBold,
  onToggleItalic,
  notesOpen,
  notesEnabled,
  onToggleNotes,
  finishButton,
}: PracticeBlindReviewSessionHeaderProps) {
  const blindReviewView = answerView === "blind_review"
  const notesLayout = notesOpen && notesEnabled

  return (
    <header
      className={cn(
        "practice-session-header flex shrink-0 border-b border-[#dfe1e7] bg-white px-4 py-3 md:px-6",
        notesLayout ? "flex-col gap-2" : "items-center gap-3 md:gap-4",
      )}
    >
      <div className="flex w-full flex-wrap items-center gap-3">
        <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2">
          <p className="truncate text-lg font-bold leading-tight text-[#062357] md:text-xl">{prepTestLabel}</p>
          <PracticeBlindReviewSectionSelect
            sections={sectionOptions}
            activeSectionSessionId={activeSectionSessionId}
            onSelect={onSelectSection}
          />
          {notesLayout ? (
            <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#0d47a1]/25 bg-[#edf3ff] px-3 text-xs font-semibold text-[#0d47a1]">
              <FolderOpen className="size-3.5 shrink-0" aria-hidden />
              Container
            </span>
          ) : null}
        </div>

        {notesLayout ? (
          <p className="mx-auto hidden text-xs font-medium tracking-[0.02em] text-[#818898] lg:block">
            <span className="text-[#666d80]">{actualScoreLabel}</span>{" "}
            <span className="text-[#062357]">{questionRef}</span>
          </p>
        ) : null}

        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2 md:gap-3">
          {blindReviewView ? (
            <PracticeSessionToolbar
              activeColor={activeColor}
              toolMode={toolMode}
              fontScale={fontScale}
              boldEnabled={boldEnabled}
              italicEnabled={italicEnabled}
              onSelectColor={onSelectColor}
              onEraser={onEraser}
              onUnderline={onUnderline}
              onFontSize={onFontSize}
              onToggleBold={onToggleBold}
              onToggleItalic={onToggleItalic}
            />
          ) : (
            <div className="flex h-[52px] items-center rounded-2xl border border-[#dfe1e7] bg-[#f6f8fa] px-3">
              <button type="button" className={toolTextBtnClass} aria-label="Text size" onClick={onFontSize}>
                Aa
                <span className="sr-only"> ({fontScale}x)</span>
              </button>
              <button type="button" className={toolTextBtnClass} aria-label="Line spacing">
                <List className="size-4" strokeWidth={2} aria-hidden />
              </button>
              <button
                type="button"
                className={cn(toolTextBtnClass, "underline", toolMode === "underline" && "bg-[#eceff3] text-[#062357]")}
                aria-label="Underline"
                aria-pressed={toolMode === "underline"}
                onClick={onUnderline}
              >
                U
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleNotes}
            disabled={!notesEnabled}
            className={cn(
              "inline-flex h-[52px] items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45",
              notesOpen && notesEnabled
                ? "border-[#0d47a1] bg-[#0d47a1] text-white"
                : "border-[#dfe1e7] bg-white text-[#062357] hover:bg-[#f6f8fa]",
            )}
            aria-pressed={notesOpen && notesEnabled}
          >
            <FileText className="size-4 shrink-0" aria-hidden />
            Notes
          </button>
          {finishButton}
        </div>
      </div>

      {notesLayout ? (
        <p className="text-xs font-medium tracking-[0.02em] text-[#818898] lg:hidden">
          <span className="text-[#666d80]">{actualScoreLabel}</span>{" "}
          <span className="text-[#062357]">{questionRef}</span>
        </p>
      ) : null}
    </header>
  )
}

export { PracticeBlindReviewSessionHeader }
