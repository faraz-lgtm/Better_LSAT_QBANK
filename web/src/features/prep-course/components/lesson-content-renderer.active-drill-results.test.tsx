import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LessonContentRenderer } from "@/features/prep-course/components/lesson-content-renderer"
import type { PrepLesson, PrepLessonActiveDrillAttempt, PrepLessonLinkedQuestionRef } from "@/lib/api/prep-course"

const getExplanationDetail = vi.fn()

vi.mock("@/lib/api/explanations", () => ({
  createExplanationsApi: () => ({ getExplanationDetail }),
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

const lesson: PrepLesson = {
  id: "l1",
  course_id: "c1",
  slug: "active-drill-1",
  title: "Motivational Posters",
  lesson_type: "active_drill",
  sort_order: 1,
  summary: "Try this question.",
  duration_minutes: 0,
  video_url: null,
  text_content: "<p>Hidden until complete.</p>",
  is_published: true,
  created_at: "",
  updated_at: "",
}

const linked: PrepLessonLinkedQuestionRef = {
  question_id: "q1",
  question_number: 19,
  prep_test_module_id: "129",
  prep_test_title: null,
  section_number: 1,
  section_type: "LR",
  section_title: null,
}

const attempt: PrepLessonActiveDrillAttempt = {
  sessionId: "s1",
  completedAt: "2026-01-01T00:00:00Z",
  rawScore: 0,
  questionCount: 1,
  elapsedSeconds: 4,
  answers: [{ questionId: "q1", selectedAnswer: "E", isCorrect: false }],
  blindReview: null,
}

describe("LessonContentRenderer active drill published explanation", () => {
  beforeEach(() => {
    getExplanationDetail.mockReset()
    getExplanationDetail.mockResolvedValue({
      questionId: "q1",
      prepTestId: "pt-129",
      prepTestTitle: "PT 129",
      prepTestNumber: "129",
      sectionId: "s1",
      sectionType: "LR",
      sectionNumber: 1,
      questionNumber: 19,
      topicName: "Main Point",
      tags: ["Art"],
      explanationHtml: "<p>The form is cookie cutter.</p>",
      videoUrl: null,
      stimulusText: "Raw stimulus should not replace the write-up.",
      stemText: "Which one of the following most accurately states the conclusion of the argument as a whole?",
      choices: [
        {
          id: "A",
          index: 1,
          text: "The claim rests on a fuzzy distinction.",
          explanationHtml: "<p>Correct Answer Choice (A).</p>",
        },
      ],
      correctChoiceId: "A",
      passage: { id: "", displayNumber: 1, title: "", body: "" },
      answerPopularity: [],
      difficulty: 4,
    })
  })

  it("shows the actual question explanation after submit instead of the lesson teaser", async () => {
    render(
      <LessonContentRenderer
        lesson={lesson}
        linkedQuestionRefs={[linked]}
        activeDrillAttempt={attempt}
        onStartDrill={() => {}}
      />,
    )

    expect(screen.getByText("Your Score")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Retake" })).toHaveClass("h-10")

    await waitFor(() => {
      expect(
        screen.getByText(
          "Which one of the following most accurately states the conclusion of the argument as a whole?",
        ),
      ).toBeInTheDocument()
    })

    expect(screen.getByRole("heading", { name: "Question" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Stimulus" })).toBeInTheDocument()
    expect(screen.getByText("The form is cookie cutter.")).toBeInTheDocument()
    expect(screen.getByText("Answer Choice A")).toBeInTheDocument()
    expect(screen.getByText("The claim rests on a fuzzy distinction.")).toBeInTheDocument()
    expect(screen.getByText("Correct Answer Choice (A).")).toBeInTheDocument()
    expect(screen.queryByText("Hidden until complete.")).not.toBeInTheDocument()
    expect(screen.queryByText("Raw stimulus should not replace the write-up.")).not.toBeInTheDocument()
  })
})
