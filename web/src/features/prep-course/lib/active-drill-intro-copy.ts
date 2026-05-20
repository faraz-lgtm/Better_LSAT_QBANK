import { isPrepTestQuestionReferenceText } from "@/features/prep-course/lib/prep-course-format"
import type { PrepLesson } from "@/lib/api/prep-course"

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

const DEFAULT_INTRO =
  "Work through this LSAT question with the concepts you've learned so far. After you finish, we'll walk you through our solution so you can tackle similar questions in the future."

/** Intro copy for the You Try card — avoids showing the full question before the drill. */
export function activeDrillIntroCopy(lesson: PrepLesson): string {
  const summary = lesson.summary?.trim()
  if (summary && !isPrepTestQuestionReferenceText(summary)) return summary

  const raw = lesson.text_content?.trim()
  if (raw) {
    const beforeQuestion = raw.split(/the question:/i)[0]?.trim()
    if (beforeQuestion) {
      const text = stripHtml(beforeQuestion)
      if (text.length > 0) return text
    }
  }

  return DEFAULT_INTRO
}
