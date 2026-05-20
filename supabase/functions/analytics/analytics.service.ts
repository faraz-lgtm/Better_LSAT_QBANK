import type {
  AnalyticsRepository,
  CompletedPreptestRow,
  PracticeSessionListRow,
  QuestionExplanationMetaRow,
} from './analytics.repository.ts'
import type { PracticeSessionKind } from '../practice/practice.repository.ts'

const PREPTEST_EXPLANATION_CATALOG_LIMIT = 8000

export type ExplanationsSummaryRow = {
  questionId: string
  prepTestTitle: string
  sectionType: 'LR' | 'RC' | 'LG' | null
  questionNumber: number | null
  topicName: string
  hasWrittenExplanation: boolean
  hasVideo: boolean
  lastAttemptedAt: string
}

export type ExplanationDetailPayload = {
  questionId: string
  prepTestTitle: string
  sectionType: 'LR' | 'RC' | 'LG' | null
  questionNumber: number | null
  topicName: string
  explanationHtml: string | null
  videoUrl: string | null
}

function relOne<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function latestByQuestion(
  events: {
    practice_session_id: string
    question_id: string
    is_correct: boolean
    section_type: 'LR' | 'RC' | 'LG' | null
  }[],
): Map<string, Map<string, { is_correct: boolean; section_type: 'LR' | 'RC' | 'LG' | null }>> {
  const bySession = new Map<
    string,
    Map<string, { is_correct: boolean; section_type: 'LR' | 'RC' | 'LG' | null }>
  >()
  for (const e of events) {
    let m = bySession.get(e.practice_session_id)
    if (!m) {
      m = new Map()
      bySession.set(e.practice_session_id, m)
    }
    m.set(e.question_id, { is_correct: e.is_correct, section_type: e.section_type })
  }
  return bySession
}

function priorityLevel(gap: number, attempts: number): 'high' | 'medium' | 'low' {
  if (attempts < 3) return 'low'
  if (gap >= 15) return 'high'
  if (gap >= 8) return 'medium'
  return 'low'
}

function difficultyLabel(n: number | null): 'Easiest' | 'Easy' | 'Medium' | 'Hard' | 'Hardest' {
  if (n == null || n <= 1) return 'Easiest'
  if (n === 2) return 'Easy'
  if (n === 3) return 'Medium'
  if (n === 4) return 'Hard'
  return 'Hardest'
}

function latestEventsByQuestion(
  events: {
    question_id: string
    is_correct: boolean
    selected_answer: string
    practice_session_id: string
    created_at: string
  }[],
): Map<string, { is_correct: boolean; selected_answer: string }> {
  const sorted = [...events].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const map = new Map<string, { is_correct: boolean; selected_answer: string }>()
  for (const e of sorted) {
    map.set(e.question_id, { is_correct: e.is_correct, selected_answer: e.selected_answer })
  }
  return map
}

function eventsAtCompletion(
  events: {
    question_id: string
    is_correct: boolean
    selected_answer: string
    practice_session_id: string
    created_at: string
  }[],
  completedAt: string,
): Map<string, { is_correct: boolean; selected_answer: string }> {
  const cutoff = new Date(completedAt).getTime()
  const before = events.filter((e) => new Date(e.created_at).getTime() <= cutoff)
  return latestEventsByQuestion(before)
}

function headlineFromQuestionMeta(row: QuestionExplanationMetaRow): {
  prepTestTitle: string
  sectionType: 'LR' | 'RC' | 'LG' | null
  questionNumber: number | null
  topicName: string
} {
  const qt = relOne(row.question_types)
  const sec = relOne(row.admin_sections)
  const pt = sec ? relOne(sec.admin_prep_tests) : null
  return {
    prepTestTitle: pt?.title?.trim() || 'PrepTest',
    sectionType: sec?.section_type ?? null,
    questionNumber: row.question_number,
    topicName: qt?.name?.trim() || '—',
  }
}

export function createAnalyticsService(deps: { repository: AnalyticsRepository }) {
  return {
    async getOverview(userId: string) {
      const [totalQuestionsAnswered, drillStats, completedPreptests] = await Promise.all([
        deps.repository.countAnswerEvents(userId),
        deps.repository.countDrillAnswerEvents(userId),
        deps.repository.listCompletedPreptests(userId),
      ])

      const scaledScores = completedPreptests
        .map((r) => r.scaled_score)
        .filter((s): s is number => s !== null && s !== undefined)
      const bestScaledScore = scaledScores.length ? Math.max(...scaledScores) : null
      const averageScaledScore = scaledScores.length
        ? round1(scaledScores.reduce((a, b) => a + b, 0) / scaledScores.length)
        : null

      const percentiles = completedPreptests
        .map((r) => r.percentile)
        .filter((p): p is number => p !== null && p !== undefined)
      const bestPercentile = percentiles.length ? Math.max(...percentiles) : null
      const averagePercentile = percentiles.length
        ? round1(percentiles.reduce((a, b) => a + b, 0) / percentiles.length)
        : null

      const drillAccuracyPct =
        drillStats.total > 0 ? round1((100 * drillStats.correct) / drillStats.total) : null

      const ptIds = completedPreptests.map((r) => r.id)
      const ptEvents = ptIds.length ? await deps.repository.listAnswerEventsForSessions(ptIds, userId) : []
      const bySession = latestByQuestion(ptEvents)

      let lrSum = 0
      let rcSum = 0
      let ptWithLr = 0
      let ptWithRc = 0
      for (const row of completedPreptests) {
        const m = bySession.get(row.id)
        if (!m) continue
        let lrMiss = 0
        let rcMiss = 0
        let hadLr = false
        let hadRc = false
        for (const v of m.values()) {
          if (v.section_type === 'LR') {
            hadLr = true
            if (!v.is_correct) lrMiss += 1
          }
          if (v.section_type === 'RC') {
            hadRc = true
            if (!v.is_correct) rcMiss += 1
          }
        }
        if (hadLr) {
          lrSum += lrMiss
          ptWithLr += 1
        }
        if (hadRc) {
          rcSum += rcMiss
          ptWithRc += 1
        }
      }

      const averageLrMissedPerPrepTest = ptWithLr > 0 ? round1(lrSum / ptWithLr) : null
      const averageRcMissedPerPrepTest = ptWithRc > 0 ? round1(rcSum / ptWithRc) : null

      return {
        bestScaledScore,
        averageScaledScore,
        bestPercentile,
        averagePercentile,
        completedPrepTestCount: completedPreptests.length,
        totalQuestionsAnswered,
        drillAccuracyPct,
        totalDrillQuestionsAnswered: drillStats.total,
        averageLrMissedPerPrepTest,
        averageRcMissedPerPrepTest,
      }
    },

    async getTrajectory(userId: string) {
      const rows = await deps.repository.listCompletedPreptests(userId)
      return rows.map((r: CompletedPreptestRow) => {
        const apt = relOne(r.admin_prep_tests)
        return {
          sessionId: r.id,
          prepTestTitle: apt?.title ?? 'PrepTest',
          moduleId: apt?.module_id ?? null,
          rawScore: r.raw_score,
          scaledScore: r.scaled_score,
          percentile: r.percentile,
          regularRawScore: r.raw_score,
          regularScaledScore: r.scaled_score,
          blindReviewRawScore: r.blind_review_raw_score,
          blindReviewScaledScore: r.blind_review_scaled_score,
          blindReviewPercentile: r.blind_review_percentile,
          completedAt: r.completed_at,
        }
      })
    },

    async getPriorities(userId: string) {
      const events = await deps.repository.listAnswerEventsWithTypes(userId)
      const diffEvents = await deps.repository.listAnswerEventsWithTypeDifficulty(userId)
      const byType = new Map<string, { correct: number; total: number }>()
      const difficultyByType = new Map<string, number[]>()
      for (const e of events) {
        const cur = byType.get(e.question_type_id) ?? { correct: 0, total: 0 }
        cur.total += 1
        if (e.is_correct) cur.correct += 1
        byType.set(e.question_type_id, cur)
      }
      for (const e of diffEvents) {
        if (!e.question_type_id || e.difficulty == null) continue
        const arr = difficultyByType.get(e.question_type_id) ?? []
        arr.push(e.difficulty)
        difficultyByType.set(e.question_type_id, arr)
      }
      const ids = [...byType.keys()]
      const types = await deps.repository.listQuestionTypesByIds(ids)
      const typeById = new Map(types.map((t) => [t.id, t]))

      const items = [...byType.entries()].map(([questionTypeId, { correct, total }]) => {
        const meta = typeById.get(questionTypeId)
        const accuracyPct = total > 0 ? round1((100 * correct) / total) : 0
        const goal = meta?.goal_accuracy != null ? Number(meta.goal_accuracy) : null
        const gap = goal != null ? round1(goal - accuracyPct) : null
        const pl = gap != null ? priorityLevel(gap, total) : priorityLevel(0, total)
        const diffs = difficultyByType.get(questionTypeId) ?? []
        const difficulty =
          diffs.length > 0 ? Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length) : null
        const avgPerTest =
          meta?.avg_per_test != null ? Number(meta.avg_per_test) : null
        return {
          questionTypeId,
          name: meta?.name ?? 'Unknown type',
          sectionType: meta?.section_type ?? null,
          attemptCount: total,
          correctCount: correct,
          accuracyPct,
          goalAccuracy: goal,
          gap,
          priorityLevel: pl,
          difficulty,
          averagePerTest: avgPerTest,
          reviewCount: total,
        }
      })

      items.sort((a, b) => {
        const ga = a.gap ?? -999
        const gb = b.gap ?? -999
        if (gb !== ga) return gb - ga
        return b.attemptCount - a.attemptCount
      })
      return { priorities: items }
    },

    async getSessions(
      userId: string,
      query: { kind?: PracticeSessionKind; bookmarked?: boolean; limit: number; offset: number },
    ) {
      const [sessions, total] = await Promise.all([
        deps.repository.listSessions({
          userId,
          kind: query.kind,
          bookmarked: query.bookmarked,
          limit: query.limit,
          offset: query.offset,
        }),
        deps.repository.countSessions({
          userId,
          kind: query.kind,
          bookmarked: query.bookmarked,
        }),
      ])

      return {
        sessions: sessions.map((s: PracticeSessionListRow) => {
          const apt = relOne(s.admin_prep_tests)
          const sec = relOne(s.admin_sections)
          return {
            id: s.id,
            kind: s.kind,
            prepTestId: s.prep_test_id,
            startedAt: s.started_at,
            completedAt: s.completed_at,
            rawScore: s.raw_score,
            scaledScore: s.scaled_score,
            percentile: s.percentile,
            blindReviewRawScore: s.blind_review_raw_score,
            blindReviewScaledScore: s.blind_review_scaled_score,
            blindReviewPercentile: s.blind_review_percentile,
            bookmarked: s.bookmarked,
            excluded: s.excluded,
            metadata: s.metadata,
            prepTestTitle: apt?.title ?? null,
            sectionTitle: sec?.title ?? null,
            sectionType: sec?.section_type ?? null,
          }
        }),
        total,
        limit: query.limit,
        offset: query.offset,
      }
    },

    async getKindBreakdown(userId: string, sessionKind: PracticeSessionKind) {
      const rows = await deps.repository.fetchKindSectionAccuracy(userId, sessionKind)
      const bySection = new Map<'LR' | 'RC' | 'LG', { correct: number; total: number }>()
      for (const r of rows) {
        const st = r.section_type
        if (!st) continue
        const cur = bySection.get(st) ?? { correct: 0, total: 0 }
        cur.total += 1
        if (r.is_correct) cur.correct += 1
        bySection.set(st, cur)
      }
      const sections = (['LR', 'RC', 'LG'] as const)
        .map((key) => {
          const v = bySection.get(key)
          if (!v || v.total === 0) return null
          return {
            sectionType: key,
            accuracyPct: round1((100 * v.correct) / v.total),
            correct: v.correct,
            total: v.total,
          }
        })
        .filter(Boolean)

      const totalCount = await deps.repository.countAnswerEventsByKind(userId, sessionKind)
      return { sessionKind, totalAnswered: totalCount, sections }
    },

    /** Catalog of PrepTest questions with admin-authored explanation or video (not tied to practice history). */
    async listExplanations(_userId: string): Promise<{ explanations: ExplanationsSummaryRow[] }> {
      const metas = await deps.repository.listAdminQuestionsWithExplanationContent(PREPTEST_EXPLANATION_CATALOG_LIMIT)
      const explanations: ExplanationsSummaryRow[] = []
      for (const meta of metas) {
        const head = headlineFromQuestionMeta(meta)
        const expl = meta.explanation?.trim() ?? ''
        const vid = meta.video_url?.trim() ?? ''
        const sec = relOne(meta.admin_sections)
        explanations.push({
          questionId: meta.id,
          prepTestTitle: head.prepTestTitle,
          sectionType: head.sectionType ?? sec?.section_type ?? null,
          questionNumber: head.questionNumber,
          topicName: head.topicName,
          hasWrittenExplanation: expl.length > 0,
          hasVideo: vid.length > 0,
          lastAttemptedAt: meta.updated_at ?? new Date().toISOString(),
        })
      }
      explanations.sort((a, b) => {
        const byPt = a.prepTestTitle.localeCompare(b.prepTestTitle)
        if (byPt !== 0) return byPt
        const st = (a.sectionType ?? '').localeCompare(b.sectionType ?? '')
        if (st !== 0) return st
        return (a.questionNumber ?? 0) - (b.questionNumber ?? 0)
      })
      return { explanations }
    },

    async getPrepTestSessionDetail(userId: string, sessionId: string) {
      const session = await deps.repository.getPracticeSession(sessionId, userId)
      if (!session || session.kind !== 'PREPTEST' || !session.completed_at) {
        throw new Error('PrepTest session not found or not completed')
      }
      const prepTestId = session.prep_test_id
      if (!prepTestId) throw new Error('PrepTest session missing prep_test_id')

      const apt = relOne(session.admin_prep_tests)
      const sectionSessions = await deps.repository.listSectionSessionsForPrepTest(userId, prepTestId)
      const sectionIds = sectionSessions.map((s) => s.id)
      const events = await deps.repository.listAnswerEventsForSessions(sectionIds, userId)
      const latest = latestEventsByQuestion(events)

      const completedAt = session.completed_at
      const atCompletion = eventsAtCompletion(events, completedAt)

      const questionsRaw = await deps.repository.listPrepTestQuestionsWithMeta(prepTestId)
      let correct = 0
      let total = 0
      const questionRows: Array<{
        id: string
        number: number
        title: string
        tags: string[]
        difficulty: ReturnType<typeof difficultyLabel>
        difficultyDots: number
        actualCorrect: boolean
        blindReviewCorrect: boolean
        correctLetter: string
        selectedLetter: string | null
        sectionType: 'LR' | 'RC' | 'LG' | null
        sectionNumber: number | null
      }> = []

      for (const row of questionsRaw) {
        const qid = String(row.id)
        const sec = relOne(
          row.admin_sections as
            | { section_type: 'LR' | 'RC' | 'LG' | null; section_number: number | null }
            | { section_type: 'LR' | 'RC' | 'LG' | null; section_number: number | null }[]
            | null,
        )
        const qt = relOne(row.question_types as { name: string } | { name: string }[] | null)
        const diff = typeof row.difficulty === 'number' ? row.difficulty : null
        const initial = atCompletion.get(qid)
        const final = latest.get(qid)
        total += 1
        if (initial?.is_correct) correct += 1
        const stem = typeof row.stem_text === 'string' ? row.stem_text.trim() : ''
        const title =
          qt?.name?.trim() ||
          (stem.length > 60 ? `${stem.slice(0, 60)}…` : stem) ||
          `Question ${row.question_number ?? total}`
        questionRows.push({
          id: qid,
          number: typeof row.question_number === 'number' ? row.question_number : total,
          title,
          tags: qt?.name ? [qt.name] : [],
          difficulty: difficultyLabel(diff),
          difficultyDots: diff ?? 3,
          actualCorrect: initial?.is_correct ?? false,
          blindReviewCorrect: final?.is_correct ?? false,
          correctLetter: typeof row.correct_answer === 'string' ? row.correct_answer.trim().toUpperCase().slice(0, 1) : 'A',
          selectedLetter: final?.selected_answer ?? initial?.selected_answer ?? null,
          sectionType: sec?.section_type ?? null,
          sectionNumber: sec?.section_number ?? null,
        })
      }

      const incorrect = total - correct
      const scaled = session.scaled_score ?? session.raw_score ?? 0
      const blindScaled = session.blind_review_scaled_score ?? session.blind_review_raw_score ?? scaled

      return {
        sessionId: session.id,
        prepTestId,
        prepTestTitle: apt?.title ?? 'PrepTest',
        moduleId: apt?.module_id ?? null,
        completedAt: session.completed_at,
        startedAt: session.started_at,
        excluded: session.excluded,
        totalQuestions: total,
        scaledScore: scaled,
        blindReviewScore: blindScaled,
        correct,
        incorrect,
        percentile: session.percentile,
        blindReviewPercentile: session.blind_review_percentile,
        questions: questionRows,
      }
    },

    async getExplanationDetail(_userId: string, questionId: string): Promise<ExplanationDetailPayload> {
      const row = await deps.repository.getQuestionExplanationPayload(questionId)
      if (!row) throw new Error('Question not found')

      const head = headlineFromQuestionMeta(row)
      const expl = row.explanation?.trim() ?? ''
      const vid = row.video_url?.trim() ?? ''
      return {
        questionId: row.id,
        prepTestTitle: head.prepTestTitle,
        sectionType: head.sectionType,
        questionNumber: head.questionNumber,
        topicName: head.topicName,
        explanationHtml: expl.length > 0 ? (row.explanation ?? null) : null,
        videoUrl: vid.length > 0 ? (row.video_url ?? null) : null,
      }
    },
  }
}

export type AnalyticsService = ReturnType<typeof createAnalyticsService>
