import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { StudentMain } from "@/features/student/components/student-main"
import {
  PrepTestExamTrajectoryPanel,
  PrepTestFullTestLog,
  PrepTestInsightStatsRow,
  usePrepTestInsightLogRows,
  type InsightHistorySort,
  type TrajectoryTab,
} from "@/features/student/analytics/components/prep-test-insights-ui"
import {
  AnalyticsChartSkeleton,
  AnalyticsHistorySkeleton,
  AnalyticsStatsSkeleton,
} from "@/features/student/analytics/components/analytics-insights-skeletons"
import {
  TimeRangeSegmented,
  type TimeRangeValue,
} from "@/features/student/components/time-range-filter"
import {
  filterPrepTestsByTimeRange,
  getPrepTestProgressPoints,
  type PrepTestRecord,
} from "@/features/student/lib/mock-analytics-preptests"
import { mapSessionToPrepTestRecord } from "@/features/student/analytics/map-analytics"
import {
  persistSessionBookmark,
  sessionBookmarkState,
  withSessionBookmark,
} from "@/features/student/analytics/session-bookmarks"
import {
  useAnalyticsApi,
  usePracticeApi,
} from "@/features/student/analytics/hooks/use-analytics-api"
import { ensureStudyContext } from "@/features/student-session/ensure-student-session"
import { computePrepTestInsightStats } from "@/features/student/analytics/prep-test-insights"
import { DEFAULT_PREPTEST_SCORE_TAB } from "@/features/student/analytics/score-chart-defaults"
import { peekCachedAnalyticsSessions } from "@/lib/api/analytics"

function seedPrepRecords(): PrepTestRecord[] {
  const preps = peekCachedAnalyticsSessions("PREPTEST", { completedOnly: true }) ?? []
  const sections = peekCachedAnalyticsSessions("SECTION", { completedOnly: true }) ?? []
  return preps
    .map((s) => mapSessionToPrepTestRecord(s, sections))
    .filter((r): r is PrepTestRecord => r != null)
}

function AnalyticsPrepTestsPage() {
  const navigate = useNavigate()
  const analyticsApi = useAnalyticsApi()
  const practiceApi = usePracticeApi()
  const [seededRecords] = useState(seedPrepRecords)
  const [ready, setReady] = useState(() => seededRecords.length > 0)
  const [prepRecords, setPrepRecords] = useState<PrepTestRecord[]>(seededRecords)
  const [goalScore, setGoalScore] = useState<number | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRangeValue>("all")
  const [trajectoryTab, setTrajectoryTab] = useState<TrajectoryTab>(DEFAULT_PREPTEST_SCORE_TAB)
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false)
  const [historySort, setHistorySort] = useState<InsightHistorySort>("recent")

  useEffect(() => {
    if (!analyticsApi) {
      setReady(true)
      return
    }
    let cancelled = false
    void ensureStudyContext()
      .then((studyContext) => {
        if (!cancelled) setGoalScore(studyContext?.preferences?.goalScore ?? null)
      })
      .catch(() => {
        /* goal score stays null; page still usable */
      })
    void Promise.all([
      analyticsApi.getSessions({ kind: "PREPTEST", completedOnly: true, limit: 500, skipCount: true }),
      analyticsApi.getSessions({ kind: "SECTION", completedOnly: true, limit: 500, skipCount: true }),
    ])
      .then(([prepTests, sections]) => {
        if (cancelled) return
        setPrepRecords(
          prepTests.sessions
            .map((s) => mapSessionToPrepTestRecord(s, sections.sessions))
            .filter((r): r is PrepTestRecord => r != null),
        )
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [analyticsApi])

  const rangedRecords = useMemo(
    () => filterPrepTestsByTimeRange(prepRecords, timeRange),
    [prepRecords, timeRange],
  )
  const stats = useMemo(
    () => computePrepTestInsightStats(rangedRecords, goalScore),
    [goalScore, rangedRecords],
  )
  const progressPoints = useMemo(() => getPrepTestProgressPoints(rangedRecords), [rangedRecords])
  const logRows = usePrepTestInsightLogRows(rangedRecords, historySort, bookmarkedOnly)

  const handleToggleBookmark = useCallback(
    (id: string) => {
      const previous = sessionBookmarkState(prepRecords, id)
      const next = !previous
      setPrepRecords((current) => withSessionBookmark(current, id, next))
      void persistSessionBookmark({
        sessionId: id,
        bookmarked: next,
        practiceApi,
        onFailure: () => setPrepRecords((current) => withSessionBookmark(current, id, previous)),
      })
    },
    [practiceApi, prepRecords],
  )

  const handleSelectEntry = useCallback(
    (id: string) => {
      navigate(`/app/analytics/preptests/results/${encodeURIComponent(id)}`)
    },
    [navigate],
  )

  return (
    <StudentMain>
      <div className="flex flex-col gap-[24px]">
        <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-3 border-b border-[var(--greyscale-100)] pb-3">
          <h1 className="!m-0 !text-lg !font-bold !leading-[1.3] text-[var(--color-student-heading)]">
            PrepTest Insights
          </h1>
          <TimeRangeSegmented value={timeRange} onChange={setTimeRange} className="shrink-0" />
        </div>

        {!ready && prepRecords.length === 0 ? (
          <>
            <AnalyticsStatsSkeleton headlineCount={0} secondaryCount={4} label="Loading PrepTest stats" />
            <AnalyticsChartSkeleton label="Loading PrepTest chart" />
            <AnalyticsHistorySkeleton label="Loading PrepTest history" />
          </>
        ) : (
          <>
            {stats ? (
              <>
                <PrepTestInsightStatsRow stats={stats} />
                <PrepTestExamTrajectoryPanel
                  points={progressPoints}
                  tab={trajectoryTab}
                  onTabChange={setTrajectoryTab}
                  goalScore={goalScore}
                />
              </>
            ) : (
              <p className="rounded-2xl border border-dashed border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-6 py-8 text-center text-sm text-[var(--greyscale-500)]">
                No PrepTests recorded in this range. Try widening the time range.
              </p>
            )}
            <PrepTestFullTestLog
              rows={logRows}
              bookmarkedOnly={bookmarkedOnly}
              onBookmarkedOnlyChange={setBookmarkedOnly}
              sort={historySort}
              onSortChange={setHistorySort}
              onSelectEntry={handleSelectEntry}
              onToggleBookmark={handleToggleBookmark}
            />
          </>
        )}
      </div>
    </StudentMain>
  )
}

export { AnalyticsPrepTestsPage }
