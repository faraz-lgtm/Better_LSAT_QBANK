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

const PASSAGE_EXPLANATION_CARD_CLASS =
  "rounded-xl border border-[#DFE1E7] bg-[#F6F8FA] p-6 dark:border-[var(--greyscale-100)] dark:bg-[var(--greyscale-25)]"

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
          <div data-passage-analysis="explanation" className={PASSAGE_EXPLANATION_CARD_CLASS}>
            <HtmlContent
              html={paragraph.explanationHtml}
              className="explanation-review-body text-[var(--color-student-heading)]"
            />
          </div>
        </section>
      ))}
      {analysis.overallHtml?.trim() ? (
        <section
          className="lesson-section-empty flex w-full min-w-0 flex-col gap-2 overflow-clip rounded-[20px] border-0"
          style={{ background: "linear-gradient(90deg, var(--primary) 0%, #419df8 100%)" }}
        >
          <p className="m-0 text-xs font-bold uppercase leading-[1.5] tracking-[0.24px] text-white">
            Overall
          </p>
          <HtmlContent
            html={analysis.overallHtml}
            className="lesson-section-body lesson-section-body--inverse passage-analysis-overall text-white [&_*]:text-white"
          />
        </section>
      ) : null}
    </div>
  )
}
