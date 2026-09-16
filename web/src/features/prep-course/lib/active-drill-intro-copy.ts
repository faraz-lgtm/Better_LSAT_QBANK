import { isPrepTestQuestionReferenceText } from "@/features/prep-course/lib/prep-course-format"
import type { PrepLesson } from "@/lib/api/prep-course"

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const DEFAULT_INTRO =
  "Work through this LSAT question with the concepts you've learned so far. After you finish, we'll walk you through our solution so you can handle similar questions in the future."

function looksLikeLessonAnalysis(text: string): boolean {
  return /stimulus analysis|answer choice analysis/i.test(text)
}

/** Intro copy for the pre-test start screen — avoids showing the full question before the drill. */
export function activeDrillIntroCopy(lesson: PrepLesson): string {
  const summary = lesson.summary?.trim()
  if (summary && !isPrepTestQuestionReferenceText(summary)) return summary

  const raw = lesson.text_content?.trim()
  if (raw) {
    const parts = raw.split(/the question:/i)
    const beforeQuestion = parts[0]?.trim()
    if (parts.length > 1 && beforeQuestion) {
      const text = stripHtml(beforeQuestion)
      if (text.length > 0 && !isPrepTestQuestionReferenceText(text) && !looksLikeLessonAnalysis(text)) {
        return text
      }
    }
  }

  return DEFAULT_INTRO
}
