import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { LessonContentRenderer } from "@/features/prep-course/components/lesson-content-renderer"
import type { PrepLesson, PrepLessonActiveDrillAttempt, PrepLessonLinkedQuestionRef } from "@/lib/api/prep-course"

const baseLesson: PrepLesson = {
  id: "l1",
  course_id: "c1",
  slug: "active-drill-1",
  title: "Active Drill: Sample",
  lesson_type: "active_drill",
  sort_order: 1,
  summary: "Try this question.",
  duration_minutes: 0,
  video_url: null,
  text_content: "<p>The Question:</p><p>Hidden until complete.</p>",
  is_published: true,
  created_at: "",
  updated_at: "",
}

const linked: PrepLessonLinkedQuestionRef = {
  question_id: "q1",
  question_number: 5,
  prep_test_module_id: "LSAC133",
  prep_test_title: null,
  section_number: 2,
  section_type: "LR",
  section_title: null,
}

const attempt: PrepLessonActiveDrillAttempt = {
  sessionId: "s1",
  completedAt: "2026-01-01T00:00:00Z",
  rawScore: 1,
  questionCount: 1,
  elapsedSeconds: 90,
  answers: [{ questionId: "q1", selectedAnswer: "C", isCorrect: true }],
}

const adaptiveLesson: PrepLesson = {
  ...baseLesson,
  slug: "adaptive-drill-1",
  title: "Adaptive Drill - Mixed Practice (5 Qs)",
  lesson_type: "adaptive_drill",
  summary: "Mixed practice keeps your thinking flexible.",
  text_content: "<p>Lesson notes after drill.</p>",
}

const adaptiveAttempt: PrepLessonActiveDrillAttempt = {
  sessionId: "s2",
  completedAt: "2026-01-01T00:00:00Z",
  rawScore: 1,
  questionCount: 2,
  elapsedSeconds: 300,
  answers: [
    { questionId: "q1", selectedAnswer: "C", isCorrect: true },
    { questionId: "q2", selectedAnswer: "B", isCorrect: false },
  ],
}

describe("LessonContentRenderer active_drill", () => {
  it("shows intro card when drill not attempted", () => {
    render(<LessonContentRenderer lesson={baseLesson} linkedQuestionRefs={[linked]} activeDrillAttempt={null} />)
    expect(screen.getByText("Try this question.")).toBeInTheDocument()
    expect(screen.queryByText("Hidden until complete.")).not.toBeInTheDocument()
  })

  it("shows result and full content after drill", () => {
    render(
      <LessonContentRenderer
        lesson={baseLesson}
        linkedQuestionRefs={[linked]}
        activeDrillAttempt={attempt}
      />,
    )
    expect(screen.getByText("Drill Result")).toBeInTheDocument()
    expect(screen.getByText("Hidden until complete.")).toBeInTheDocument()
    expect(screen.getByText(/PT LSAC133/)).toBeInTheDocument()
    expect(screen.getByText("Answer Popularity")).toBeInTheDocument()
  })
})

describe("LessonContentRenderer adaptive_drill", () => {
  it("shows intro card when drill not attempted", () => {
    render(
      <LessonContentRenderer
        lesson={adaptiveLesson}
        linkedQuestionRefs={[linked, { ...linked, question_id: "q2", question_number: 6 }]}
        activeDrillAttempt={null}
      />,
    )
    expect(screen.getByText(/Mixed practice keeps your thinking flexible/)).toBeInTheDocument()
    expect(screen.queryByText("Lesson notes after drill.")).not.toBeInTheDocument()
  })

  it("shows results panel after drill", () => {
    render(
      <LessonContentRenderer
        lesson={adaptiveLesson}
        linkedQuestionRefs={[linked, { ...linked, question_id: "q2", question_number: 6 }]}
        activeDrillAttempt={adaptiveAttempt}
      />,
    )
    expect(screen.getByText("Drill Result")).toBeInTheDocument()
    expect(screen.getByText(/1\/2 Correct/)).toBeInTheDocument()
    expect(screen.getByText("Lesson notes after drill.")).toBeInTheDocument()
    expect(screen.getAllByText(/PT LSAC133/).length).toBeGreaterThanOrEqual(1)
  })
})
