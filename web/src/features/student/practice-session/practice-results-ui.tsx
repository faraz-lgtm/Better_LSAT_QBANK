import { Check } from "lucide-react"

import type { ExplanationAnswerPopularityRow, ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import { cn } from "@/lib/utils"

export type PracticeDifficultyLabel = "Easiest" | "Easy" | "Medium" | "Hard" | "Hardest"

const DIFFICULTY_STYLE: Record<
  PracticeDifficultyLabel,
  { dots: number; color: string; inactive: string }
> = {
  Easiest: { dots: 1, color: "#40c4aa", inactive: "#ced0e7" },
  Easy: { dots: 2, color: "#ffbd4c", inactive: "#ced0e7" },
  Medium: { dots: 3, color: "#ff6f00", inactive: "#ced0e7" },
  Hard: { dots: 4, color: "#df1c41", inactive: "#ced0e7" },
  Hardest: { dots: 5, color: "#df1c41", inactive: "#ced0e7" },
}

export function difficultyLabelFromLevel(level: number): PracticeDifficultyLabel {
  if (level <= 1) return "Easiest"
  if (level === 2) return "Easy"
  if (level === 3) return "Medium"
  if (level === 4) return "Hard"
  return "Hardest"
}

export function formatPtQuestionTitle(detail: ExplanationDetailPayload): string {
  const pt = detail.prepTestNumber?.trim() || detail.prepTestTitle || "—"
  const section = detail.sectionNumber != null ? `S${detail.sectionNumber}` : "S—"
  const q = detail.questionNumber != null ? `Q${detail.questionNumber}` : "Q—"
  return `PT ${pt} . ${section} . ${q}`
}

export function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function targetTimeForDifficulty(label: PracticeDifficultyLabel): string {
  if (label === "Hardest" || label === "Hard") return "01:45"
  if (label === "Medium") return "01:30"
  return "01:15"
}

export function tagsFromTopicName(topicName: string): string[] {
  const t = topicName.trim()
  if (!t || t === "—") return []
  if (t.includes(",")) return t.split(",").map((s) => s.trim()).filter(Boolean)
  if (t.includes("·")) return t.split("·").map((s) => s.trim()).filter(Boolean)
  if (t.includes("|")) return t.split("|").map((s) => s.trim()).filter(Boolean)
  return [t]
}

export function resolveQuestionResultTags(
  detail: Pick<ExplanationDetailPayload, "topicName" | "tags" | "sectionType" | "passage">,
): string[] {
  if (detail.tags && detail.tags.length > 0) return detail.tags

  const fromTopic = tagsFromTopicName(detail.topicName)
  if (fromTopic.length > 0) return fromTopic

  const passageTitle = detail.passage?.title?.trim() ?? ""
  if (
    passageTitle &&
    !/^Passage \d+$/i.test(passageTitle) &&
    !/^Game \d+$/i.test(passageTitle)
  ) {
    const fromPassage = tagsFromTopicName(passageTitle)
    if (fromPassage.length > 0) return fromPassage
  }

  if (detail.sectionType) return [detail.sectionType]

  return []
}

export function correctChoiceLetter(
  choices: { id: string; index: number }[],
  correctChoiceId: string | null,
): string {
  if (!correctChoiceId) return "A"
  const normalized = correctChoiceId.trim().toUpperCase()
  const byId = choices.findIndex((c) => c.id.toUpperCase() === normalized)
  if (byId >= 0) return String.fromCharCode(65 + byId)
  const idx = choices.findIndex((c) => c.index === Number.parseInt(normalized, 10))
  if (idx >= 0) return String.fromCharCode(65 + idx)
  return normalized.slice(0, 1) || "A"
}

export function PracticeDifficultyMeter({ difficulty }: { difficulty: PracticeDifficultyLabel }) {
  const { dots, color, inactive } = DIFFICULTY_STYLE[difficulty]
  return (
    <div className="flex h-10 w-fit items-center gap-2.5 rounded-[10px] bg-[#f3f7ff] px-3">
      <div className="flex shrink-0 items-center gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="block h-4 w-1.5 rounded-full"
            style={{ backgroundColor: i < dots ? color : inactive }}
          />
        ))}
      </div>
      <span
        className="shrink-0 whitespace-nowrap text-xs font-semibold leading-normal tracking-[0.02em]"
        style={{ color }}
      >
        {difficulty}
      </span>
    </div>
  )
}

function CorrectAnswerPopularityBadge() {
  return (
    <span
      className="flex size-3 shrink-0 items-center justify-center rounded-full bg-[#00d492]"
      aria-hidden
    >
      <Check className="size-2 text-white" strokeWidth={3} />
    </span>
  )
}

export function PracticeAnswerPopularityBars({
  rows,
  correctLetter,
}: {
  rows: ExplanationAnswerPopularityRow[]
  correctLetter: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.pct))
  return (
    <div className="flex w-[224px] shrink-0 flex-col gap-2">
      <p className="m-0 text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">
        Answer Popularity
      </p>
      <div className="flex items-end gap-1.5">
        {rows.map((row) => {
          const h = Math.round((row.pct / max) * 100)
          const isCorrect = row.letter === correctLetter
          const fillHeight = isCorrect
            ? row.pct > 0
              ? `${Math.max(8, h)}%`
              : "10%"
            : row.pct > 0
              ? `${Math.max(8, h)}%`
              : "0%"
          return (
            <div key={row.letter} className="flex w-10 shrink-0 flex-col items-center gap-1">
              <div className="flex h-[72px] w-10 shrink-0 flex-col justify-end overflow-hidden rounded-t-[10px] bg-[#f3f4f6]">
                <div
                  className={cn(
                    "w-full shrink-0",
                    isCorrect ? "rounded-t-[10px] bg-[#00d492]" : "rounded-t-[10px] bg-[#dfe1e7]",
                  )}
                  style={{ height: fillHeight }}
                />
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className={cn(
                    "text-xs leading-4",
                    isCorrect ? "font-bold text-[#00d492]" : "font-normal text-[#666d80]",
                  )}
                >
                  {row.letter}
                </span>
                {isCorrect ? (
                  <CorrectAnswerPopularityBadge />
                ) : (
                  <span className="size-3 shrink-0" aria-hidden />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
