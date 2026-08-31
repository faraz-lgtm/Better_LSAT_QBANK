import type {
  PracticePassageQuestionGroup,
  PracticeQuestionResultMeta,
} from "@/features/student/practice-session/build-practice-results-section-groups"

export function practiceResultQuestionBookmarkId(meta: PracticeQuestionResultMeta): string {
  return meta.detail?.questionId ?? meta.question.id
}

export function filterPracticeResultQuestions(
  questions: readonly PracticeQuestionResultMeta[],
  options: {
    incorrectOnly: boolean
    bookmarkedOnly: boolean
    bookmarkedIds: ReadonlySet<string>
  },
): PracticeQuestionResultMeta[] {
  return questions.filter((question) => {
    if (options.incorrectOnly && question.isCorrect) return false
    if (
      options.bookmarkedOnly &&
      !options.bookmarkedIds.has(practiceResultQuestionBookmarkId(question))
    ) {
      return false
    }
    return true
  })
}

export function filterPracticeResultPassages(
  passages: readonly PracticePassageQuestionGroup[],
  options: {
    incorrectOnly: boolean
    bookmarkedOnly: boolean
    bookmarkedIds: ReadonlySet<string>
  },
): PracticePassageQuestionGroup[] {
  return passages
    .map((group) => ({
      ...group,
      questions: filterPracticeResultQuestions(group.questions, options),
    }))
    .filter((group) => group.questions.length > 0)
}
