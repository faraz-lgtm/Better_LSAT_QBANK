import { extractHtmlParagraphs } from "@/lib/html/extract-html-paragraphs"
import { HtmlContent } from "@/lib/html/html-content"

export type PassageAnalysisPayload = {
  paragraphs: Array<{
    label: string
    passageHtml?: string | null
    explanationHtml: string
  }>
  overallHtml: string | null
}

export function hasPassageAnalysis(analysis: PassageAnalysisPayload | null | undefined): boolean {
  if (!analysis) return false
  return analysis.paragraphs.length > 0 || Boolean(analysis.overallHtml?.trim())
}

export function resolveAnalysisParagraphs(analysis: PassageAnalysisPayload, passageBody: string) {
  const fromBody = extractHtmlParagraphs(passageBody)
  return analysis.paragraphs.map((paragraph, index) => ({
    ...paragraph,
    passageHtml: paragraph.passageHtml?.trim() || fromBody[index] || null,
  }))
}

type PassageAnalysisBodyProps = {
  analysis: PassageAnalysisPayload
  passageBody: string
  className?: string
}

/** RC paragraph + overall analysis (P1, P2, …) — shared by explanation + review tester. */
export function PassageAnalysisBody({ analysis, passageBody, className }: PassageAnalysisBodyProps) {
  const paragraphs = resolveAnalysisParagraphs(analysis, passageBody)

  return (
    <div className={className ?? "flex flex-col gap-6"}>
      {paragraphs.map((paragraph) => (
        <section key={paragraph.label} className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center rounded-md bg-[var(--primary-0)] px-2.5 py-1 text-xs font-semibold tracking-[0.24px] text-[var(--color-student-heading)]">
            {paragraph.label}
          </span>
          {paragraph.passageHtml ? (
            <HtmlContent
              html={paragraph.passageHtml}
              className="explanation-passage-body text-[var(--color-student-heading)]"
            />
          ) : null}
          <div className="rounded-xl bg-[var(--greyscale-25)] px-4 py-3">
            <HtmlContent
              html={paragraph.explanationHtml}
              className="explanation-review-body text-[var(--color-student-heading)]"
            />
          </div>
        </section>
      ))}
      {analysis.overallHtml?.trim() ? (
        <section className="flex flex-col gap-3 border-t border-[var(--greyscale-100)] pt-5">
          <span className="inline-flex w-fit items-center rounded-md bg-[var(--greyscale-25)] px-2.5 py-1 text-xs font-semibold tracking-[0.24px] text-[var(--greyscale-500)]">
            Overall
          </span>
          <div className="rounded-xl bg-[var(--greyscale-25)] px-4 py-3">
            <HtmlContent
              html={analysis.overallHtml}
              className="explanation-review-body text-[var(--color-student-heading)]"
            />
          </div>
        </section>
      ) : null}
    </div>
  )
}
