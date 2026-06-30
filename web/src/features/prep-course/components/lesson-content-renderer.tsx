import { memo, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { RotateCcw } from "lucide-react"

import { resolveDrillLessonType } from "@/features/prep-course/lib/prep-course-format"
import { cn } from "@/lib/utils"

import { ActiveDrillIntroCard } from "@/features/prep-course/components/active-drill/active-drill-intro-card"
import { ActiveDrillQuestionResultDetail } from "@/features/prep-course/components/active-drill/active-drill-question-result-detail"
import { resolveDrillQuestionOutcomes } from "@/features/prep-course/lib/resolve-drill-question-outcomes"
import { resolveDrillResultLinkedRefs } from "@/features/prep-course/lib/resolve-drill-result-linked-refs"
import { ActiveDrillResultBar } from "@/features/prep-course/components/active-drill/active-drill-result-bar"
import { LessonDrillIntroCard } from "@/features/prep-course/components/lesson-drill/lesson-drill-intro-card"
import { htmlToPlainText, parseRepWorkFromTextContent, isRepWorkJson, stripInstructionsLabel, trimEmptyHtmlParagraphs, type RepWorkPair } from "@/lib/rep-work-content"
import type {
  PrepLesson,
  PrepLessonActiveDrillAttempt,
  PrepLessonLinkedQuestionRef,
} from "@/lib/api/prep-course"
import { HtmlContent } from "@/lib/html/html-content"

type DrillResultsPart = "cards" | "below" | "full"

type LessonContentRendererProps = {
  lesson: PrepLesson
  linkedQuestionRefs?: PrepLessonLinkedQuestionRef[]
  activeDrillAttempt?: PrepLessonActiveDrillAttempt | null
  hideTitle?: boolean
  belowVideo?: ReactNode
  onReviewDrill?: () => void
  onStartDrill?: () => void
  startingDrill?: boolean
  drillStartError?: string | null
  edgeToSidebar?: boolean
  skipArticleShell?: boolean
  sectionSubtitle?: string | null
  lessonBookmarked?: boolean
  onToggleLessonBookmark?: (next: boolean) => void
  drillResultsPart?: DrillResultsPart
}

function lessonArticleCardClass(edgeToSidebar: boolean, className: string) {
  return cn(className, edgeToSidebar && "rounded-r-none border-r-0")
}

function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url.trim())
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (u.hostname === "www.youtube.com" || u.hostname === "youtube.com" || u.hostname === "m.youtube.com") {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v")
        return id ? `https://www.youtube.com/embed/${id}` : null
      }
      const embed = u.pathname.match(/^\/embed\/([^/]+)/)
      if (embed?.[1]) return `https://www.youtube.com/embed/${embed[1]}`
    }
  } catch {
    /* ignore */
  }
  return null
}

function vimeoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url.trim())
    if (!u.hostname.includes("vimeo.com")) return null
    const m = u.pathname.match(/\/(?:video\/)?(\d+)/)
    return m?.[1] ? `https://player.vimeo.com/video/${m[1]}` : null
  } catch {
    return null
  }
}

function videoIframeSrc(raw: string): string {
  const yt = youtubeEmbedUrl(raw)
  if (yt) return yt
  const vm = vimeoEmbedUrl(raw)
  if (vm) return vm
  return raw.trim()
}

function LessonVideoBlock({
  lesson,
  belowVideo,
  hideTitle = false,
}: {
  lesson: PrepLesson
  belowVideo?: ReactNode
  hideTitle?: boolean
}) {
  const src = lesson.video_url ? videoIframeSrc(lesson.video_url) : ""
  const textClass = "ds-body-sm leading-7 text-[#36394a] [&_p]:mb-3"

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_1px_2px_0px_rgba(13,13,18,0.06)]">
        <div className="aspect-video w-full bg-[#e5efff]">
          <iframe
            className="h-full w-full"
            src={src}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
      {belowVideo}
      {lesson.text_content ? (
        hideTitle ? (
          <HtmlContent html={lesson.text_content} className={textClass} />
        ) : (
          <article>
            <h3 className="ds-heading-4 ds-text-heading">{lesson.title}</h3>
            <HtmlContent html={lesson.text_content} className={`${textClass} mt-4`} />
          </article>
        )
      ) : null}
    </div>
  )
}

function CompletedDrillResultsSection({
  lesson,
  linkedQuestionRefs,
  activeDrillAttempt,
  drillTitlePrefix,
  onStartDrill,
  startingDrill,
  hideTitle,
  belowVideo,
  showVideo,
  part = "full",
}: {
  lesson: PrepLesson
  linkedQuestionRefs: PrepLessonLinkedQuestionRef[]
  activeDrillAttempt: PrepLessonActiveDrillAttempt
  drillTitlePrefix: string
  onStartDrill?: () => void
  startingDrill?: boolean
  hideTitle?: boolean
  belowVideo?: ReactNode
  showVideo: boolean
  part?: DrillResultsPart
}) {
  const drillResultItems = resolveDrillResultLinkedRefs(linkedQuestionRefs, activeDrillAttempt)
  const textClass = "ds-body-sm leading-7 text-[#36394a] [&_p]:mb-3"

  const resultCards = (
    <>
      <ActiveDrillResultBar
        attempt={activeDrillAttempt}
        lessonTitle={`${drillTitlePrefix} - ${lesson.title}`}
        questionOutcomes={resolveDrillQuestionOutcomes(linkedQuestionRefs, activeDrillAttempt)}
        onRetake={onStartDrill}
        retaking={startingDrill}
        retakeLabel={activeDrillAttempt.questionCount > 1 ? "Start another Drill" : "Retake"}
      />
      {drillResultItems.map((linked, index) => (
        <ActiveDrillQuestionResultDetail
          key={linked.question_id}
          linked={linked}
          attempt={activeDrillAttempt}
          sequenceNumber={index + 1}
        />
      ))}
    </>
  )

  const lessonBelow =
    showVideo ? (
      <LessonVideoBlock lesson={lesson} belowVideo={belowVideo} hideTitle={hideTitle} />
    ) : lesson.text_content ? (
      <article className="rounded-2xl border border-[#dfe1e7] bg-white p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
        {hideTitle ? null : <h3 className="ds-heading-4 ds-text-heading">{lesson.title}</h3>}
        <HtmlContent
          html={lesson.text_content}
          className={`${textClass} ${hideTitle ? "" : "mt-4"}`}
        />
      </article>
    ) : null

  if (part === "cards") {
    return <div className="flex min-w-0 max-w-full flex-col gap-6">{resultCards}</div>
  }

  if (part === "below") {
    return lessonBelow
  }

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-6">
      {resultCards}
      {lessonBelow}
    </div>
  )
}

function formatLinkedSectionLabel(row: PrepLessonLinkedQuestionRef): string {
  const n = row.section_number ?? "—"
  const type = row.section_type?.trim() || row.section_title?.trim() || "Section"
  return `Section ${n} · ${type}`
}

const repWorkBodyClass = "rep-work-instructions-body"

function RepWorkInstructions({ html }: { html: string }) {
  const bodyHtml = useMemo(
    () => trimEmptyHtmlParagraphs(stripInstructionsLabel(html)),
    [html],
  )

  return (
    <div className="flex w-full flex-col gap-1">
      <p className="m-0 text-lg font-semibold leading-[1.4] tracking-[0.36px] text-[#1a1b25]">Instructions:</p>
      <HtmlContent html={bodyHtml} className={repWorkBodyClass} />
    </div>
  )
}

function resizeRepWorkTextarea(el: HTMLTextAreaElement) {
  el.style.height = "auto"
  el.style.overflow = "hidden"
  el.style.height = `${Math.max(88, el.scrollHeight)}px`
}

const RepWorkEditableQuestion = memo(function RepWorkEditableQuestion({
  plainText,
  questionLabel,
  showAnswer,
}: {
  plainText: string
  questionLabel: string
  showAnswer: boolean
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    if (textareaRef.current) {
      resizeRepWorkTextarea(textareaRef.current)
    }
  }, [plainText])

  function handleReset() {
    if (textareaRef.current) {
      textareaRef.current.value = plainText
      resizeRepWorkTextarea(textareaRef.current)
    }
  }

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-2">
      <textarea
        ref={textareaRef}
        defaultValue={plainText}
        aria-label={questionLabel}
        onInput={(event) => resizeRepWorkTextarea(event.currentTarget)}
        className={`rep-work-question-input box-border max-w-full min-h-[88px] w-full resize-none overflow-hidden rounded-2xl border bg-white p-4 text-[#041a44] outline-none transition-colors focus-visible:border-[#0d47a1] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0d47a1]/15 ${
          showAnswer ? "border-[#0d47a1]" : "border-[color:var(--greyscale-100)]"
        }`}
      />

      <div className="flex min-w-0 max-w-full flex-wrap items-center justify-end gap-x-6 gap-y-1">
        <p className="m-0 min-w-0 text-sm tracking-[0.02em] text-[#818898]">Click box to edit the text.</p>
        {showAnswer ? (
          <button
            type="button"
            className="inline-flex h-[22px] items-center justify-center gap-2 rounded-2xl text-base font-semibold tracking-[0.02em] text-[#0d47a1] transition-opacity hover:opacity-80"
            onClick={handleReset}
          >
            <RotateCcw className="size-5 shrink-0" aria-hidden />
            Reset
          </button>
        ) : null}
      </div>
    </div>
  )
})

function RepWorkAnswerToggle({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      onMouseDown={(event) => event.preventDefault()}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0d47a1]/30",
        checked ? "bg-[#0d47a1]" : "bg-[color:var(--greyscale-100)]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  )
}

function clampHorizontalScroll(origin: HTMLElement | null) {
  document.documentElement.scrollLeft = 0
  document.body.scrollLeft = 0

  let node: HTMLElement | null = origin
  while (node) {
    if (node.scrollLeft !== 0) {
      node.scrollLeft = 0
    }
    node = node.parentElement
  }
}

function RepWorkPairCard({ pair, index }: { pair: RepWorkPair; index: number }) {
  const cardRef = useRef<HTMLLIElement>(null)
  const plainQuestionText = useMemo(() => htmlToPlainText(pair.question), [pair.question])
  const answerText = useMemo(() => htmlToPlainText(pair.answer), [pair.answer])
  const [showAnswer, setShowAnswer] = useState(false)

  useLayoutEffect(() => {
    clampHorizontalScroll(cardRef.current)
  }, [showAnswer])

  return (
    <li
      ref={cardRef}
      className="prep-course-rep-work-pair min-w-0 max-w-full overflow-x-clip rounded-3xl border border-[color:var(--greyscale-100)] bg-white p-6"
    >
      <div className="flex min-w-0 max-w-full flex-col gap-6">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
          <h2 className="m-0 min-w-0 flex-1 text-2xl font-bold leading-[1.3] text-[#062357]">
            Question {index + 1}
          </h2>
          <div className="min-w-0 sm:ml-auto">
            <div className="grid w-full max-w-[197px] grid-cols-[1fr_auto] items-start gap-x-3 gap-y-0.5 sm:w-auto">
              <span className="text-xl font-bold leading-[1.35] text-[#062357]">Answer</span>
              <RepWorkAnswerToggle
                checked={showAnswer}
                onCheckedChange={setShowAnswer}
                label={`Show or hide answer for question ${index + 1}`}
              />
              <span className="col-span-2 text-xs tracking-[0.02em] text-[#666d80]">
                On/Off to see and hide the answer
              </span>
            </div>
          </div>
        </div>

        <div className="min-w-0 max-w-full overflow-x-clip rounded-3xl border border-[color:var(--greyscale-100)] bg-[var(--secondary-0)] p-6">
          <div className="flex min-w-0 flex-col gap-3">
            <RepWorkEditableQuestion
              plainText={plainQuestionText}
              questionLabel={`Question ${index + 1} text`}
              showAnswer={showAnswer}
            />

            {showAnswer ? (
              <div className="flex min-w-0 flex-col gap-3">
                <h3 className="m-0 text-xl font-bold leading-[1.35] text-[#062357]">Answer</h3>
                <p className="m-0 max-w-full break-words [overflow-wrap:anywhere] whitespace-pre-wrap text-lg leading-[1.4] tracking-[0.02em] text-[#1a1b25]">
                  {answerText || "No answer provided."}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  )
}

function LessonDrillLinkedQuestions({
  lesson,
  linked,
}: {
  lesson: PrepLesson
  linked: PrepLessonLinkedQuestionRef[]
}) {
  const isActive = lesson.lesson_type === "active_drill"
  const items = useMemo(() => (isActive ? linked.slice(0, 1) : linked), [isActive, linked])
  const [idx, setIdx] = useState(0)

  if (items.length === 0) {
    return (
      <article className="rounded-2xl border border-[#dfe1e7] bg-white p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <h3 className="ds-heading-4 ds-text-heading">PrepTest question</h3>
        <p className="ds-body-sm mt-3 text-[#666d80]">No PrepTest question is linked to this lesson yet.</p>
      </article>
    )
  }

  const safeIdx = Math.min(Math.max(idx, 0), items.length - 1)
  const current = items[safeIdx]!

  const showNav = !isActive && items.length > 1

  return (
    <article className="rounded-2xl border border-[#dfe1e7] bg-white p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="ds-heading-4 ds-text-heading">{isActive ? "Your drill question" : "PrepTest questions"}</h3>
          <p className="ds-body-sm mt-1 text-[#666d80]">
            {current.prep_test_module_id ?? current.prep_test_title ?? "PrepTest"} · {formatLinkedSectionLabel(current)}{" "}
            · Q{Number(current.question_number ?? 0)}
          </p>
        </div>
        {showNav ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              disabled={safeIdx <= 0}
              onClick={() => setIdx((i) => Math.max(0, Math.min(i, items.length - 1) - 1))}
              className="rounded-lg border border-[#dfe1e7] px-3 py-1.5 text-sm font-semibold text-[#0d47a1] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-[#666d80]">
              {safeIdx + 1} / {items.length}
            </span>
            <button
              type="button"
              disabled={safeIdx >= items.length - 1}
              onClick={() => setIdx((i) => Math.min(items.length - 1, Math.min(i, items.length - 1) + 1))}
              className="rounded-lg border border-[#dfe1e7] px-3 py-1.5 text-sm font-semibold text-[#0d47a1] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
      <p className="ds-body-sm mt-4 leading-7 text-[#36394a]">
        Open this question in LawHub or your practice flow using the identifiers above. In-product question playback is
        coming soon.
      </p>
    </article>
  )
}

function LessonContentRenderer({
  lesson,
  linkedQuestionRefs = [],
  activeDrillAttempt = null,
  hideTitle = false,
  belowVideo,
  onStartDrill,
  startingDrill = false,
  drillStartError = null,
  edgeToSidebar = false,
  skipArticleShell = false,
  sectionSubtitle = null,
  lessonBookmarked = false,
  onToggleLessonBookmark,
  drillResultsPart = "full",
}: LessonContentRendererProps) {
  const drillKind = resolveDrillLessonType(lesson)
  const type = drillKind ?? lesson.lesson_type
  const legacyVideo = type === "video"
  const videoText = type === "video_text" || legacyVideo
  const isDrill = type === "active_drill" || type === "adaptive_drill"
  const hasVideo = Boolean(lesson.video_url?.trim())
  const showVideo = hasVideo && (videoText || isDrill)

  if (type === "adaptive_drill") {
    if (activeDrillAttempt) {
      return (
        <CompletedDrillResultsSection
          lesson={lesson}
          linkedQuestionRefs={linkedQuestionRefs}
          activeDrillAttempt={activeDrillAttempt}
          drillTitlePrefix="Adaptive Drill"
          onStartDrill={onStartDrill}
          startingDrill={startingDrill}
          hideTitle={hideTitle}
          belowVideo={belowVideo}
          showVideo={showVideo}
          part={drillResultsPart}
        />
      )
    }
    return (
      <LessonDrillIntroCard
        lesson={lesson}
        linked={linkedQuestionRefs}
        sectionSubtitle={sectionSubtitle}
        lessonBookmarked={lessonBookmarked}
        onToggleLessonBookmark={onToggleLessonBookmark}
        onStartDrill={onStartDrill}
        startingDrill={startingDrill}
        drillStartError={drillStartError}
      />
    )
  }

  if (type === "active_drill") {
    if (activeDrillAttempt) {
      return (
        <CompletedDrillResultsSection
          lesson={lesson}
          linkedQuestionRefs={linkedQuestionRefs}
          activeDrillAttempt={activeDrillAttempt}
          drillTitlePrefix="Active Drill"
          onStartDrill={onStartDrill}
          startingDrill={startingDrill}
          hideTitle={hideTitle}
          belowVideo={belowVideo}
          showVideo={showVideo}
          part={drillResultsPart}
        />
      )
    }
    return (
      <ActiveDrillIntroCard
        lesson={lesson}
        linked={linkedQuestionRefs[0] ?? null}
        hideTitle={hideTitle}
        onStartDrill={onStartDrill}
        startingDrill={startingDrill}
        drillStartError={drillStartError}
      />
    )
  }

  if (type === "rep_work" && !isRepWorkJson(lesson.text_content)) {
    return (
      <div className="border-t border-[color:var(--greyscale-100)] pt-4">
        {lesson.text_content ? (
          <HtmlContent html={lesson.text_content} className={repWorkBodyClass} />
        ) : (
          <p className={`m-0 ${repWorkBodyClass}`}>No notes available.</p>
        )}
      </div>
    )
  }

  if (isRepWorkJson(lesson.text_content)) {
    const { instructions, pairs } = parseRepWorkFromTextContent(lesson.text_content)
    return (
      <div className="flex min-w-0 max-w-full flex-col gap-2">
        <RepWorkInstructions html={instructions} />
        <ol className="m-0 flex min-w-0 max-w-full list-none flex-col gap-6 p-0">
          {pairs.map((pair, i) => (
            <RepWorkPairCard key={i} pair={pair} index={i} />
          ))}
        </ol>
      </div>
    )
  }

  if (showVideo) {
    return (
      <div className="space-y-4">
        <LessonVideoBlock lesson={lesson} belowVideo={belowVideo} hideTitle={hideTitle} />
        {isDrill ? (
          <LessonDrillLinkedQuestions
            key={linkedQuestionRefs.map((r) => r.question_id).join("|") || "none"}
            lesson={lesson}
            linked={linkedQuestionRefs}
          />
        ) : null}
      </div>
    )
  }

  if (isDrill) {
    return (
      <div className="space-y-6">
        <article className="rounded-2xl border border-[#dfe1e7] bg-white p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
          {hideTitle ? null : <h3 className="ds-heading-4 ds-text-heading">{lesson.title}</h3>}
          {lesson.text_content ? (
            <HtmlContent
              html={lesson.text_content}
              className={`ds-body-sm leading-7 text-[#36394a] [&_p]:mb-3 ${hideTitle ? "" : "mt-4"}`}
            />
          ) : (
            <p className={`ds-body-sm leading-7 text-[#36394a] ${hideTitle ? "" : "mt-4"}`}>No notes available.</p>
          )}
        </article>
        <LessonDrillLinkedQuestions
          key={linkedQuestionRefs.map((r) => r.question_id).join("|") || "none"}
          lesson={lesson}
          linked={linkedQuestionRefs}
        />
      </div>
    )
  }

  if (skipArticleShell) {
    return lesson.text_content ? (
      <HtmlContent html={lesson.text_content} className="ds-body-sm leading-7 text-[#36394a] [&_p]:mb-3" />
    ) : (
      <p className="ds-body-sm leading-7 text-[#36394a]">No notes available.</p>
    )
  }

  return (
    <article
      className={lessonArticleCardClass(
        edgeToSidebar,
        "rounded-2xl border border-[#dfe1e7] bg-white p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]",
      )}
    >
      {hideTitle ? null : <h3 className="ds-heading-4 ds-text-heading">{lesson.title}</h3>}
      {lesson.text_content ? (
        <HtmlContent
          html={lesson.text_content}
          className={`ds-body-sm leading-7 text-[#36394a] [&_p]:mb-3 ${hideTitle ? "" : "mt-4"}`}
        />
      ) : (
        <p className={`ds-body-sm leading-7 text-[#36394a] ${hideTitle ? "" : "mt-4"}`}>No notes available.</p>
      )}
    </article>
  )
}

export { LessonContentRenderer }
