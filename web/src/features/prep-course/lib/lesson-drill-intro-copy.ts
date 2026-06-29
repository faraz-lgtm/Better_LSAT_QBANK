import { isPrepTestQuestionReferenceText } from "@/features/prep-course/lib/prep-course-format"
import { resolveDrillLessonType } from "@/features/prep-course/lib/prep-course-format"
import type { PrepLesson } from "@/lib/api/prep-course"

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

const ACTIVE_DEFAULT =
  "Work through this LSAT question with the concepts you've learned so far. After you finish, we'll walk you through our solution so you can tackle similar questions in the future."

const ADAPTIVE_DEFAULT =
  "Mixed practice keeps your thinking flexible. This set is tailored to challenge you just the right amount."

/** Intro copy for drill lesson cards — avoids showing full question content pre-drill. */
export function lessonDrillIntroCopy(lesson: PrepLesson): string {
  const summary = lesson.summary?.trim()
  if (summary && !isPrepTestQuestionReferenceText(summary)) return summary

  const raw = lesson.text_content?.trim()
  if (raw) {
    const beforeQuestion = raw.split(/the question:/i)[0]?.trim()
    if (beforeQuestion) {
      const text = stripHtml(beforeQuestion)
      if (text.length > 0 && !isPrepTestQuestionReferenceText(text)) return text
    }
  }

  return resolveDrillLessonType(lesson) === "adaptive_drill" ? ADAPTIVE_DEFAULT : ACTIVE_DEFAULT
}
