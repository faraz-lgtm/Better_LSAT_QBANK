import { useMemo, useState } from "react"

import { parseRepWorkFromTextContent, isRepWorkJson } from "@/lib/rep-work-content"
import type { PrepLesson, PrepLessonLinkedQuestionRef } from "@/lib/api/prep-course"

type LessonContentRendererProps = {
  lesson: PrepLesson
  linkedQuestionRefs?: PrepLessonLinkedQuestionRef[]
}

function HtmlBlock({ html, className }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
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

function formatLinkedSectionLabel(row: PrepLessonLinkedQuestionRef): string {
  const n = row.section_number ?? "—"
  const type = row.section_type?.trim() || row.section_title?.trim() || "Section"
  return `Section ${n} · ${type}`
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

function LessonContentRenderer({ lesson, linkedQuestionRefs = [] }: LessonContentRendererProps) {
  const type = lesson.lesson_type
  const legacyVideo = type === "video"
  const videoText = type === "video_text" || legacyVideo
  const isDrill = type === "active_drill" || type === "adaptive_drill"
  const hasVideo = Boolean(lesson.video_url?.trim())
  const showVideo = hasVideo && (videoText || isDrill)

  if (type === "rep_work" || isRepWorkJson(lesson.text_content)) {
    const { instructions, pairs } = parseRepWorkFromTextContent(lesson.text_content)
    return (
      <article className="space-y-6 rounded-2xl border border-[#dfe1e7] bg-white p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <div>
          <h3 className="ds-heading-4 ds-text-heading">{lesson.title}</h3>
          <HtmlBlock html={instructions} className="rep-instructions ds-body-sm mt-4 leading-7 text-[#36394a] [&_p]:mb-3" />
        </div>
        <ol className="space-y-8">
          {pairs.map((pair, i) => (
            <li key={i} className="rounded-xl border border-[#dfe1e7] bg-[#f6f8fa] p-5">
              <p className="ds-body-sm font-semibold text-[#1a1b25]">Question {i + 1}</p>
              <HtmlBlock html={pair.question} className="ds-body-sm mt-3 leading-7 text-[#36394a] [&_p]:mb-3" />
              <p className="ds-body-sm mt-6 font-semibold text-[#1a1b25]">Answer</p>
              <HtmlBlock html={pair.answer} className="ds-body-sm mt-3 leading-7 text-[#36394a] [&_p]:mb-3" />
            </li>
          ))}
        </ol>
      </article>
    )
  }

  if (showVideo) {
    const src = lesson.video_url ? videoIframeSrc(lesson.video_url) : ""
    return (
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
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
        {lesson.text_content ? (
          <article className="rounded-2xl border border-[#dfe1e7] bg-white p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
            <HtmlBlock html={lesson.text_content} className="ds-body-sm leading-7 text-[#36394a] [&_p]:mb-3" />
          </article>
        ) : null}
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
          <h3 className="ds-heading-4 ds-text-heading">{lesson.title}</h3>
          {lesson.text_content ? (
            <HtmlBlock html={lesson.text_content} className="ds-body-sm mt-4 leading-7 text-[#36394a] [&_p]:mb-3" />
          ) : (
            <p className="ds-body-sm mt-4 leading-7 text-[#36394a]">No notes available.</p>
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

  return (
    <article className="rounded-2xl border border-[#dfe1e7] bg-white p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h3 className="ds-heading-4 ds-text-heading">{lesson.title}</h3>
      {lesson.text_content ? (
        <HtmlBlock html={lesson.text_content} className="ds-body-sm mt-4 leading-7 text-[#36394a] [&_p]:mb-3" />
      ) : (
        <p className="ds-body-sm mt-4 leading-7 text-[#36394a]">No notes available.</p>
      )}
    </article>
  )
}

export { LessonContentRenderer }
