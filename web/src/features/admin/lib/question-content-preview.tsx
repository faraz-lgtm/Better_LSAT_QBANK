import { sanitizeAdminHtml } from "@/features/admin/lib/sanitize-admin-html"

export function firstOrSelf<T extends Record<string, unknown>>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

export function buildQuestionPreviewLeftHtml(question: Record<string, unknown>): string {
  const sec = firstOrSelf(question.admin_sections as Record<string, unknown> | Record<string, unknown>[] | undefined)
  const st = String(sec?.section_type ?? "").toUpperCase()
  if (st === "RC") {
    const passage = firstOrSelf(sec?.admin_passages as Record<string, unknown> | Record<string, unknown>[] | undefined)
    const rcCandidates = [
      passage?.content,
      passage?.passage_text,
      passage?.stimulus_text,
      question.passage_text,
      question.stimulus_text,
    ]
    const firstNonEmpty = rcCandidates.find((v) => typeof v === "string" && v.trim().length > 0)
    return sanitizeAdminHtml(firstNonEmpty)
  }
  if (st === "LG") {
    const game = firstOrSelf(sec?.admin_logic_games as Record<string, unknown> | Record<string, unknown>[] | undefined)
    const setup = sanitizeAdminHtml(game?.setup_text)
    const rules = sanitizeAdminHtml(game?.rules_text)
    return `${setup}<div class="mt-4">${rules}</div>`
  }
  return sanitizeAdminHtml(question.stimulus_text)
}

function optionLetterFromIndex(idx: number): string {
  return String.fromCharCode(65 + idx)
}

export function choicesToPreviewRows(raw: unknown): Array<{ letter: string; html: string }> {
  const arr = Array.isArray(raw) ? raw : []
  return arr.map((choice, idx) => {
    const letter = optionLetterFromIndex(idx)
    if (typeof choice === "string") {
      return { letter, html: sanitizeAdminHtml(choice) }
    }
    if (choice && typeof choice === "object") {
      const o = choice as Record<string, unknown>
      const L = typeof o.optionLetter === "string" ? o.optionLetter : letter
      return { letter: L, html: sanitizeAdminHtml(o.optionContent) }
    }
    return { letter, html: "" }
  })
}

type QuestionContentPreviewProps = {
  question: Record<string, unknown>
  correctAnswer: string
  className?: string
}

function QuestionContentPreview({ question, correctAnswer, className }: QuestionContentPreviewProps) {
  const leftHtml = buildQuestionPreviewLeftHtml(question)
  const stemHtml = sanitizeAdminHtml(question.stem_text)
  const rows = choicesToPreviewRows(question.choices)
  const normalizedCorrectAnswer = correctAnswer.trim().toUpperCase()

  return (
    <div className={className ?? ""}>
      <div className="grid grid-cols-1 gap-0 overflow-auto md:grid-cols-2">
        <div className="overflow-auto border-r border-border bg-background px-6 py-6 font-serif text-[14px] leading-relaxed text-foreground select-none md:max-h-[75vh]">
          <div dangerouslySetInnerHTML={{ __html: leftHtml || "<p></p>" }} />
        </div>
        <div className="overflow-auto bg-background px-6 py-6 font-serif text-[14px] leading-relaxed text-foreground select-none md:max-h-[75vh]">
          <div dangerouslySetInnerHTML={{ __html: stemHtml || "<p></p>" }} />
          <ol className="mt-4 list-none space-y-3 pl-0">
            {rows.map((row) => {
              const isCorrect = row.letter.trim().toUpperCase() === normalizedCorrectAnswer
              return (
                <li
                  key={row.letter}
                  className={`flex gap-2 rounded-md px-2 py-1.5 ${
                    isCorrect ? "border border-emerald-300 bg-emerald-50 text-emerald-900" : ""
                  }`}
                >
                  <span className="shrink-0 font-semibold">{row.letter}.</span>
                  <div className="min-w-0 flex-1 [&_p]:mb-2" dangerouslySetInnerHTML={{ __html: row.html || "" }} />
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </div>
  )
}

export { QuestionContentPreview }
