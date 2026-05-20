import type { PrepTestSessionDetail } from "@/lib/api/analytics"
import type { PrepTestResultsDetail } from "@/features/student/lib/mock-analytics-prep-test-results"

export function mapPrepTestDetailToResults(api: PrepTestSessionDetail): PrepTestResultsDetail {
  const incorrect = api.incorrect
  const correct = api.correct
  return {
    totalQuestions: api.totalQuestions,
    scaledScore: api.scaledScore,
    correct,
    incorrect,
    correctSummary: `${correct}/${api.totalQuestions} CORRECT (${incorrect > 0 ? "-" : ""}${incorrect})`,
    percentile: api.percentile ?? 0,
    prediction: api.scaledScore,
    blindReview: api.blindReviewScore,
    sections: [],
    passages: [],
    questions: api.questions.map((q) => ({
      id: q.id,
      number: q.number,
      title: q.title,
      tags: q.tags,
      targetTime: "—",
      yourTime: "—",
      yourTimeNote: "",
      difficulty: q.difficulty,
      difficultyDots: q.difficultyDots,
      actualCorrect: q.actualCorrect,
      blindReviewCorrect: q.blindReviewCorrect,
      answerPopularity: [20, 20, 20, 20, 20] as [number, number, number, number, number],
      correctLetter: (q.correctLetter.length === 1 ? q.correctLetter : "A") as "A" | "B" | "C" | "D" | "E",
    })),
    about: {
      questionCount: String(api.totalQuestions),
      timing: "—",
      timeUsed: "—",
      take: "1",
      format: "—",
      source: api.prepTestTitle,
    },
    rcSection: {
      sectionTitle: "Reading Comprehension",
      scoreDisplay: String(api.scaledScore),
      blindReviewDisplay: String(api.blindReviewScore),
      questions: api.questions
        .filter((q) => q.sectionType === "RC")
        .map((q) => ({
          id: q.id,
          number: q.number,
          title: q.title,
          tags: q.tags,
          targetTime: "—",
          yourTime: "—",
          yourTimeNote: "",
          difficulty: q.difficulty,
          difficultyDots: q.difficultyDots,
          actualCorrect: q.actualCorrect,
          blindReviewCorrect: q.blindReviewCorrect,
          answerPopularity: [20, 20, 20, 20, 20] as [number, number, number, number, number],
          correctLetter: (q.correctLetter.length === 1 ? q.correctLetter : "A") as "A" | "B" | "C" | "D" | "E",
        })),
    },
  }
}
