import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import { HtmlContent, LessonHtmlContent } from "@/lib/html/html-content"
import { plainTextFromHtml } from "@/lib/html/plain-text-from-html"
import { stripLeadingChoiceRestatement } from "@/lib/html/strip-leading-choice-restatement"
import { cn } from "@/lib/utils"

import { useActiveDrillExplanationDetail } from "@/features/prep-course/components/active-drill/use-active-drill-explanation-detail"

type ActiveDrillResultsExplanationProps = {
  questionId?: string | null
  detail?: ExplanationDetailPayload | null
  videoUrl?: string | null
  videoTitle?: string
  fallbackHtml?: string | null
}

function hasHtmlOrText(value: string | null | undefined): boolean {
  return Boolean(plainTextFromHtml(value ?? "").trim() || value?.replace(/<[^>]+>/g, "").trim())
}

function choiceLetter(choice: { id: string; index: number }): string {
  const fromId = choice.id.trim().toUpperCase().slice(0, 1)
  if (/^[A-E]$/.test(fromId)) return fromId
  if (choice.index >= 1 && choice.index <= 5) return String.fromCharCode(64 + choice.index)
  return fromId || "A"
}

function looksLikeHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value)
}

function ExplanationCopy({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  if (looksLikeHtml(text)) {
    return <HtmlContent html={text} className={className} />
  }
  return <p className={cn("m-0", className)}>{text}</p>
}

function videoEmbedSrc(raw: string): string {
  const trimmed = raw.trim()
  try {
    const url = new URL(trimmed)
    if (url.hostname === "youtu.be") {
      const id = url.pathname.replace(/^\//, "").split("/")[0]
      return id ? `https://www.youtube.com/embed/${id}` : trimmed
    }
    if (
      url.hostname === "www.youtube.com" ||
      url.hostname === "youtube.com" ||
      url.hostname === "m.youtube.com"
    ) {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v")
        return id ? `https://www.youtube.com/embed/${id}` : trimmed
      }
      const embed = url.pathname.match(/^\/embed\/([^/]+)/)
      if (embed?.[1]) return `https://www.youtube.com/embed/${embed[1]}`
    }
    if (url.hostname.includes("vimeo.com")) {
      const match = url.pathname.match(/\/(?:video\/)?(\d+)/)
      if (match?.[1]) return `https://player.vimeo.com/video/${match[1]}`
    }
  } catch {
    /* keep raw src */
  }
  return trimmed
}

function hasStimulusHeading(html: string): boolean {
  return /<h[1-6][^>]*>\s*Stimulus\b/i.test(html)
}

function ActiveDrillResultsExplanation({
  questionId = null,
  detail: detailProp = null,
  videoUrl = null,
  videoTitle = "Explanation video",
  fallbackHtml = null,
}: ActiveDrillResultsExplanationProps) {
  const fetched = useActiveDrillExplanationDetail(detailProp ? null : questionId)
  const detail = detailProp ?? fetched

  const stem = detail?.stemText?.trim() || ""
  const stimulus = detail?.stimulusText?.trim() || ""
  const explanationHtml = detail?.explanationHtml?.trim() || ""
  const choices = detail?.choices ?? []
  const embedSrc = videoUrl?.trim() ? videoEmbedSrc(videoUrl) : ""
  const showStimulusHeading = Boolean(explanationHtml || stimulus) && !hasStimulusHeading(explanationHtml)
  const choiceBlocks = choices.filter((choice) => hasHtmlOrText(choice.text) || hasHtmlOrText(choice.explanationHtml))
  const showFallback = !explanationHtml && !stimulus && !stem && !choiceBlocks.length && hasHtmlOrText(fallbackHtml)

  if (!embedSrc && !stem && !explanationHtml && !stimulus && !choiceBlocks.length && !showFallback) {
    return null
  }

  return (
    <article className="mx-auto flex w-full max-w-[888px] flex-col overflow-hidden rounded-[18px] bg-[var(--greyscale-0)]">
      {embedSrc || stem ? (
        <header className="flex flex-col items-center gap-5 px-8 pb-8 pt-12 md:px-16">
          {embedSrc ? (
            <div className="relative h-[310px] w-full max-w-[640px] overflow-hidden rounded-t-[18px] bg-[var(--primary-25)]">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={embedSrc}
                title={videoTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}
          {stem ? (
            <div className="flex w-full max-w-[640px] flex-col gap-3">
              <h2 className="m-0 text-[24px] font-bold leading-[1.3] text-[var(--primary-800)]">Question</h2>
              <ExplanationCopy text={stem} className="active-drill-results-stem" />
            </div>
          ) : null}
        </header>
      ) : null}

      <div
        className={cn(
          "flex w-full flex-col items-center px-8 py-8 md:px-[124px]",
          embedSrc || stem ? "border-t border-[var(--greyscale-100)]" : "pt-8",
        )}
      >
        <div className="flex w-full max-w-[640px] flex-col gap-[72px]">
          {explanationHtml || stimulus ? (
            <section className="flex w-full flex-col gap-4">
              {showStimulusHeading ? (
                <h3 className="m-0 text-[24px] font-bold leading-[1.3] text-[#36394a]">Stimulus</h3>
              ) : null}
              {explanationHtml ? (
                <HtmlContent html={explanationHtml} className="active-drill-results-body" />
              ) : (
                <ExplanationCopy text={stimulus} className="active-drill-results-body" />
              )}
            </section>
          ) : showFallback ? (
            <LessonHtmlContent html={fallbackHtml} className="active-drill-results-body text-[var(--color-student-heading)]" />
          ) : null}

          {choiceBlocks.length > 0 ? (
            <div className="flex w-full flex-col gap-[72px]">
              {choiceBlocks.map((choice) => {
                const letter = choiceLetter(choice)
                const choiceExplanation = stripLeadingChoiceRestatement(choice.explanationHtml, choice.text)
                return (
                  <section key={choice.id || letter} className="flex w-full flex-col gap-8">
                    <div className="flex w-full flex-col gap-2.5 border-l-4 border-[var(--primary)] pl-[26px]">
                      <p className="m-0 text-base font-extrabold leading-[1.35] text-[var(--primary)]">
                        {`Answer Choice ${letter}`}
                      </p>
                      {hasHtmlOrText(choice.text) ? (
                        <ExplanationCopy text={choice.text} className="active-drill-results-choice" />
                      ) : null}
                    </div>
                    {hasHtmlOrText(choiceExplanation) ? (
                      <HtmlContent html={choiceExplanation} className="active-drill-results-body" />
                    ) : null}
                  </section>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export { ActiveDrillResultsExplanation }
