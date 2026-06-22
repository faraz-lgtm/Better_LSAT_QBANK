import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { LessonContentRenderer } from "@/features/prep-course/components/lesson-content-renderer"
import type { PrepLesson, PrepLessonActiveDrillAttempt, PrepLessonLinkedQuestionRef } from "@/lib/api/prep-course"
import { serializeRepWorkContent } from "@/lib/rep-work-content"

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
  blindReview: null,
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
  blindReview: null,
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
    expect(screen.getByText("Your Score")).toBeInTheDocument()
    expect(screen.getByText("Hidden until complete.")).toBeInTheDocument()
    expect(screen.getByText(/PT LSAC133/)).toBeInTheDocument()
    expect(screen.getByText("Answer Popularity")).toBeInTheDocument()
    expect(screen.getByText("Timing")).toBeInTheDocument()
    expect(screen.getByText("Difficulty")).toBeInTheDocument()
  })

  it("shows blind review score and per-question result after blind review", () => {
    const attemptWithBlindReview: PrepLessonActiveDrillAttempt = {
      ...attempt,
      rawScore: 0,
      answers: [{ questionId: "q1", selectedAnswer: "A", isCorrect: false }],
      blindReview: {
        rawScore: 1,
        completedAt: "2026-01-02T00:00:00Z",
        answers: [{ questionId: "q1", selectedAnswer: "C", isCorrect: true }],
      },
    }
    render(
      <LessonContentRenderer
        lesson={baseLesson}
        linkedQuestionRefs={[linked]}
        activeDrillAttempt={attemptWithBlindReview}
      />,
    )
    expect(screen.queryByText("Your prediction")).not.toBeInTheDocument()
    expect(screen.queryByText("Blind review")).not.toBeInTheDocument()
    expect(screen.getByText("Result")).toBeInTheDocument()
    expect(screen.getByText("Actual")).toBeInTheDocument()
    expect(screen.getByText("Blind Review")).toBeInTheDocument()
  })

  it("shows question result card from attempt when lesson has no linked refs", () => {
    render(
      <LessonContentRenderer lesson={baseLesson} linkedQuestionRefs={[]} activeDrillAttempt={attempt} />,
    )
    expect(screen.getByText("Your Score")).toBeInTheDocument()
    expect(screen.getByText("Answer Popularity")).toBeInTheDocument()
    expect(screen.getByText("Timing")).toBeInTheDocument()
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

  it("shows intro card with Start for Full Drill title stored as video_text", () => {
    render(
      <LessonContentRenderer
        lesson={{
          ...adaptiveLesson,
          lesson_type: "video_text",
          title: "Full Drill: Main Conclusion Questions",
        }}
        linkedQuestionRefs={[linked, { ...linked, question_id: "q2", question_number: 6 }]}
        activeDrillAttempt={null}
        sectionSubtitle="The Anatomy of an Argument • 30 mins"
        onStartDrill={() => {}}
      />,
    )
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument()
    expect(screen.getByText("The Anatomy of an Argument • 30 mins")).toBeInTheDocument()
    expect(screen.getByText(/Mixed practice keeps your thinking flexible/i)).toBeInTheDocument()
  })

  it("shows results panel after drill", () => {
    render(
      <LessonContentRenderer
        lesson={adaptiveLesson}
        linkedQuestionRefs={[linked, { ...linked, question_id: "q2", question_number: 6 }]}
        activeDrillAttempt={adaptiveAttempt}
      />,
    )
    expect(screen.getByText("Your Score")).toBeInTheDocument()
    expect(screen.getByText(/1\/2/)).toBeInTheDocument()
    expect(screen.getByText("Lesson notes after drill.")).toBeInTheDocument()
    expect(screen.getAllByText(/PT LSAC133/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Answer Popularity").length).toBeGreaterThanOrEqual(1)
  })
})

const repWorkLesson: PrepLesson = {
  ...baseLesson,
  slug: "rep-work-arguments",
  title: "Rep Work - Arguments",
  lesson_type: "rep_work",
  text_content: serializeRepWorkContent("<p>Instructions here.</p>", [
    {
      question: "<p>All surgeons enjoy the sight of blood.</p>",
      answer: "<p>surgeon → enjoy sight of blood</p>",
    },
  ]),
}

const legacyRepWorkLesson: PrepLesson = {
  ...baseLesson,
  slug: "rep-work-following-the-signs",
  title: "Rep Work: Following the Signs",
  lesson_type: "rep_work",
  text_content:
    "<p>Welcome to your first set of rep work.</p><p>Therefore</p><p>Answer: Conclusion Indicator.</p>",
}

describe("LessonContentRenderer rep_work", () => {
  it("renders legacy HTML rep work without interactive cards", () => {
    render(<LessonContentRenderer lesson={legacyRepWorkLesson} />)

    expect(screen.getByText(/Welcome to your first set of rep work/)).toBeInTheDocument()
    expect(screen.getByText(/Therefore/)).toBeInTheDocument()
    expect(screen.getByText(/Answer: Conclusion Indicator/)).toBeInTheDocument()
    expect(screen.queryByRole("switch")).not.toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("toggles answer on and off without losing question text", async () => {
    const user = userEvent.setup()
    render(<LessonContentRenderer lesson={repWorkLesson} />)

    const box = screen.getByRole("textbox", { name: "Question 1 text" })
    expect(box).toHaveValue("All surgeons enjoy the sight of blood.")

    await user.click(screen.getByRole("switch", { name: "Show or hide answer for question 1" }))
    expect(screen.getByText("surgeon → enjoy sight of blood")).toBeVisible()
    expect(box).toHaveValue("All surgeons enjoy the sight of blood.")

    await user.click(screen.getByRole("switch", { name: "Show or hide answer for question 1" }))
    expect(screen.queryByText("surgeon → enjoy sight of blood")).not.toBeInTheDocument()
    expect(box).toHaveValue("All surgeons enjoy the sight of blood.")
  })

  it("resets editable question text", async () => {
    const user = userEvent.setup()
    render(<LessonContentRenderer lesson={repWorkLesson} />)

    const box = screen.getByRole("textbox", { name: "Question 1 text" })
    await user.click(screen.getByRole("switch", { name: "Show or hide answer for question 1" }))
    await user.clear(box)
    await user.type(box, "Edited text")
    expect(box).toHaveValue("Edited text")

    await user.click(screen.getByRole("button", { name: "Reset" }))
    expect(box).toHaveValue("All surgeons enjoy the sight of blood.")
  })
})
