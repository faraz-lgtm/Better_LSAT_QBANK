import { CheckCircle2 } from "lucide-react"

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
  return [t]
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
    <div className="flex h-10 w-[132px] items-center gap-2.5 rounded-[10px] bg-[#f3f7ff] px-2.5">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="block h-4 w-1.5 rounded-full"
            style={{ backgroundColor: i < dots ? color : inactive }}
          />
        ))}
      </div>
      <span className="text-xs font-semibold leading-normal tracking-[0.02em]" style={{ color }}>
        {difficulty}
      </span>
    </div>
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
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <p className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">Answer Popularity</p>
      <div className="flex flex-wrap items-end justify-between gap-2">
        {rows.map((row) => {
          const h = Math.round((row.pct / max) * 100)
          const isCorrect = row.letter === correctLetter
          return (
            <div key={row.letter} className="flex w-[72px] flex-col items-center gap-1 sm:w-[84px]">
              <div className="flex h-20 w-full flex-col justify-end overflow-hidden rounded-t-[10px] bg-[#f3f4f6]">
                <div
                  className={cn("w-full rounded-t-[10px]", isCorrect ? "bg-[#00d492]" : "bg-[#dfe1e7]")}
                  style={{ height: `${Math.max(8, h)}%` }}
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
                {isCorrect ? <CheckCircle2 className="size-3 text-[#00d492]" aria-hidden /> : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
