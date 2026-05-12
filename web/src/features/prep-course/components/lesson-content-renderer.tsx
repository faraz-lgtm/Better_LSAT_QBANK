import { parseRepWorkFromTextContent, isRepWorkJson } from "@/lib/rep-work-content"
import type { PrepLesson } from "@/lib/api/prep-course"

type LessonContentRendererProps = {
  lesson: PrepLesson
}

function HtmlBlock({ html, className }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

function LessonContentRenderer({ lesson }: LessonContentRendererProps) {
  const type = lesson.lesson_type
  const legacyVideo = type === "video"
  const videoText = type === "video_text" || legacyVideo
  const showVideo = Boolean(lesson.video_url) && videoText

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
    return (
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-[#dfe1e7] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
          <div className="aspect-video w-full bg-[#e5efff]">
            <iframe
              className="h-full w-full"
              src={lesson.video_url ?? ""}
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
