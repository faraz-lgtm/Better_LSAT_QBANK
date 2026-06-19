import { ClipboardList, EyeOff } from "lucide-react"



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

  lineSpacing?: number

  boldEnabled: boolean

  italicEnabled: boolean

  onSelectColor: (color: HighlightColor) => void

  onEraser: () => void

  onUnderline: () => void

  onFontSize: () => void

  onLineSpacing?: () => void

  onToggleBold: () => void

  onToggleItalic: () => void

  notesOpen: boolean

  notesEnabled: boolean

  onToggleNotes: () => void

  onExitSection: () => void

  exiting?: boolean

}



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

  lineSpacing,

  boldEnabled,

  italicEnabled,

  onSelectColor,

  onEraser,

  onUnderline,

  onFontSize,

  onLineSpacing,

  onToggleBold,

  onToggleItalic,

  notesOpen,

  notesEnabled,

  onToggleNotes,

  onExitSection,

  exiting = false,

}: PracticeBlindReviewSessionHeaderProps) {

  const blindReviewView = answerView === "blind_review"



  return (

    <header className="practice-session-header shrink-0 border-b border-[#dfe1e7] bg-[#f5f9ff] px-4 py-3 md:px-6">

      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-3 md:gap-4">

        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-2.5">

          <p className="shrink-0 text-xl font-bold leading-[1.35] text-[#062357]">{prepTestLabel}</p>

          <PracticeBlindReviewSectionSelect

            sections={sectionOptions}

            activeSectionSessionId={activeSectionSessionId}

            onSelect={onSelectSection}

          />

          <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-[#fff3ea] px-3 text-xs font-medium tracking-[0.02em] text-[#ff6f00] md:px-4">

            <EyeOff className="size-3 shrink-0" aria-hidden />

            Blind Review

          </span>

          <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-[#fff6e0] px-3 text-xs font-medium tracking-[0.02em] text-[#956321] md:px-4">

            {actualScoreLabel}

          </span>

          <span className="min-w-0 truncate text-xs font-medium tracking-[0.02em] text-[#666d80]">{questionRef}</span>

        </div>



        <div className="flex shrink-0 items-center gap-3 md:gap-4">

          {blindReviewView ? (

            <PracticeSessionToolbar

              activeColor={activeColor}

              toolMode={toolMode}

              fontScale={fontScale}

              lineSpacing={lineSpacing}

              boldEnabled={boldEnabled}

              italicEnabled={italicEnabled}

              onSelectColor={onSelectColor}

              onEraser={onEraser}

              onUnderline={onUnderline}

              onFontSize={onFontSize}

              onLineSpacing={onLineSpacing}

              onToggleBold={onToggleBold}

              onToggleItalic={onToggleItalic}

            />

          ) : null}



          <button

            type="button"

            onClick={onToggleNotes}

            disabled={!notesEnabled}

            className={cn(

              "inline-flex h-[52px] shrink-0 items-center gap-2 rounded-2xl border px-3 text-base font-medium tracking-[0.02em] transition-colors disabled:cursor-not-allowed disabled:opacity-45",

              notesOpen && notesEnabled

                ? "border-[#0d47a1] bg-[#edf3ff] text-[#0d47a1]"

                : "border-[#dfe1e7] bg-white text-[#666d80] hover:bg-[#f6f8fa]",

            )}

            aria-pressed={notesOpen && notesEnabled}

          >

            <ClipboardList className="size-5 shrink-0" aria-hidden />

            <span className="hidden sm:inline">Notes</span>

          </button>



          <button

            type="button"

            className="inline-flex h-[52px] shrink-0 items-center justify-center rounded-2xl border border-[#0d47a1] bg-white px-3 text-base font-medium tracking-[0.02em] text-[#0d47a1] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition hover:bg-[#edf3ff] disabled:opacity-50"

            onClick={onExitSection}

            disabled={exiting}

          >

            {exiting ? "Exiting…" : "Exit Section"}

          </button>

        </div>

      </div>

    </header>

  )

}



export { PracticeBlindReviewSessionHeader }

