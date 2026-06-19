import { useEffect, useState } from "react"

import { PracticeQuestionResultCard } from "@/features/student/practice-session/practice-question-result-card"
import type { ExplanationDetailPayload } from "@/features/student/explanation-detail/explanation-tree-types"
import type { PrepLessonActiveDrillAttempt, PrepLessonLinkedQuestionRef } from "@/lib/api/prep-course"
import { createExplanationsApi } from "@/lib/api/explanations"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function formatPtLabel(linked: PrepLessonLinkedQuestionRef): string {
  const pt = linked.prep_test_module_id ?? linked.prep_test_title ?? "PrepTest"
  const section = linked.section_number != null ? `S${linked.section_number}` : "S—"
  const q = linked.question_number != null ? `Q${linked.question_number}` : "Q—"
  return `PT ${pt} . ${section} . ${q}`
}

type ActiveDrillQuestionResultDetailProps = {
  linked: PrepLessonLinkedQuestionRef
  attempt: PrepLessonActiveDrillAttempt
  sequenceNumber: number
}

function ActiveDrillQuestionResultDetail({
  linked,
  attempt,
  sequenceNumber,
}: ActiveDrillQuestionResultDetailProps) {
  const [detail, setDetail] = useState<ExplanationDetailPayload | null>(null)

  useEffect(() => {
    let alive = true
    const api = createExplanationsApi(getSupabaseBrowserClient())
    void api
      .getExplanationDetail(linked.question_id)
      .then((d) => {
        if (alive) setDetail(d)
      })
      .catch(() => {
        if (alive) setDetail(null)
      })
    return () => {
      alive = false
    }
  }, [linked.question_id])

  const answer = attempt.answers.find((a) => a.questionId === linked.question_id) ?? attempt.answers[0]
  const isCorrect = answer?.isCorrect ?? false
  const blindReviewAnswer = attempt.blindReview?.answers.find((a) => a.questionId === linked.question_id)
  const blindReviewCorrect = attempt.blindReview
    ? (blindReviewAnswer?.isCorrect ?? false)
    : undefined
  const perQuestionSeconds =
    attempt.questionCount > 0 ? Math.max(1, Math.round(attempt.elapsedSeconds / attempt.questionCount)) : attempt.elapsedSeconds

  const fallbackDetail: ExplanationDetailPayload | null = detail
    ? null
    : {
        questionId: linked.question_id,
        prepTestId: "",
        prepTestTitle: linked.prep_test_title ?? "PrepTest",
        prepTestNumber: linked.prep_test_module_id,
        sectionId: "",
        sectionType: null,
        sectionNumber: linked.section_number,
        questionNumber: linked.question_number,
        topicName: "—",
        explanationHtml: null,
        videoUrl: null,
        stimulusText: null,
        stemText: null,
        choices: [],
        correctChoiceId: null,
        passage: { id: "", displayNumber: 1, title: "", body: "" },
        answerPopularity: [],
        difficulty: 3,
      }

  return (
    <PracticeQuestionResultCard
      number={sequenceNumber}
      detail={detail ?? fallbackDetail}
      titleOverride={detail ? undefined : formatPtLabel(linked)}
      isCorrect={isCorrect}
      blindReviewCorrect={blindReviewCorrect}
      yourTimeSeconds={perQuestionSeconds}
      variant="active-drill"
    />
  )
}

export { ActiveDrillQuestionResultDetail }
