import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import {
  Bookmark,
  Pencil,
  Trash2,
} from "lucide-react"

import { FigmaIcon } from "@/components/icons/figma-icons"
import { FIGMA_DROPDOWN_CARD_OPEN_CLASS, FigmaDropdown } from "@/components/ui/figma-dropdown"
import { Switch } from "@/components/ui/switch"
import {
  PT_RESULTS_ACTION_BUTTON_CLASS,
  PT_RESULTS_BY_SECTION_PANEL_CLASS,
  PT_RESULTS_CARD_CLASS,
  PT_RESULTS_HERO_CARD_CLASS,
  PT_RESULTS_PAGE_BG_CLASS,
  PT_RESULTS_PAGE_GAP_CLASS,
  PT_RESULTS_PASSAGE_BADGE_CLASS,
  PT_RESULTS_PASSAGE_HEADER_CLASS,
  PT_RESULTS_QUESTION_BADGE_CORRECT_CLASS,
  PT_RESULTS_QUESTION_BADGE_INCORRECT_CLASS,
  PT_RESULTS_QUESTION_BADGE_UNANSWERED_CLASS,
  PT_RESULTS_QUESTION_ROW_BORDER_CLASS,
  PT_RESULTS_QUESTION_ROW_PAD_CLASS,
  PT_RESULTS_SUMMARY_ROW_CLASS,
  PT_RESULTS_SECTION_BLOCK_CLASS,
  PT_RESULTS_SECTION_HEADER_CLASS,
  PT_RESULTS_SURFACE_CARD_CLASS,
  PT_RESULTS_TAG_CLASS,
} from "@/features/student/analytics/prep-test-results-section-styles"
import { cn } from "@/lib/utils"
import { StudentMain } from "@/features/student/components/student-main"
import { PracticeResultOutcomeIcon } from "@/features/student/practice-session/practice-result-outcome-icon"
import { PrepTestSectionResultCard } from "@/features/student/practice-session/prep-test-section-result-card"
import {
  PracticeDifficultyMeter,
  PracticeQuestionResultStatsRow,
} from "@/features/student/practice-session/practice-results-ui"
import {
  type PrepTestAboutMeta,
  type PrepTestPassageSummary,
  type PrepTestQuestionResultRow,
  type PrepTestRcSectionBlock,
  type PrepTestResultsDetail,
  type PrepTestSectionKind,
} from "@/features/student/lib/prep-test-results-types"
import {
  formatPrepTestResultsTitle,
  mapPrepTestDetailToResults,
} from "@/features/student/analytics/map-prep-test-results"
import { useAnalyticsApi, usePracticeApi } from "@/features/student/analytics/hooks/use-analytics-api"

const QUESTION_FILTER_OPTIONS = ["Question", "Passage", "Incorrect only"] as const

/** Figma results list — 24px gaps between white cards */
const RESULTS_STACK_CLASS = "flex flex-col gap-6"

const SECTION_BADGE: Record<
  PrepTestSectionKind,
  { bg: string; text: string; border: string; short: string }
> = {
  LR: { bg: "#eafff4", text: "#00bc54", border: "#00bc54", short: "LR" },
  RC: { bg: "#e5fdff", text: "#0bbcc9", border: "#0bbcc9", short: "RC" },
}

function ResultsSummaryPanel({ detail }: { detail: PrepTestResultsDetail }) {
  return (
    <section className={PT_RESULTS_SUMMARY_ROW_CLASS}>
      <div className="flex w-full shrink-0 flex-col gap-[24px] lg:w-[290px]">
        <div className="flex w-full flex-col gap-[5px] rounded-[16px] bg-[#0d47a1] p-[24px]">
          <p className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#edf3ff]">YOUR SCORE</p>
          <p className="text-[48px] font-extrabold leading-[1.2] text-white">{detail.scaledScore}</p>
          <p className="text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#edf3ff]">
            {detail.correctSummary}
          </p>
          <p className="text-base font-semibold leading-[1.5] tracking-[0.32px] text-[#edf3ff]">
            PERCENTILE: {detail.percentile % 1 === 0 ? detail.percentile : detail.percentile.toFixed(1)}
          </p>
        </div>
        <div className="w-full rounded-[16px] bg-[#f6f8fa] p-[24px]">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col gap-[5px] font-bold text-[#062357]">
              <p className="text-xs font-bold leading-[1.5] tracking-[0.24px]">YOUR PREDICTION</p>
              <p className="text-2xl font-bold leading-[1.3]">{detail.prediction}</p>
            </div>
            {detail.blindReviewCompleted ? (
              <>
                <div className="h-[32px] w-[2px] shrink-0 bg-[#dfe1e7]" aria-hidden />
                <div className="flex flex-col gap-[5px] font-bold text-[#df1c41]">
                  <p className="text-xs font-bold leading-[1.5] tracking-[0.24px]">BLIND REVIEW</p>
                  <p className="text-2xl font-bold leading-[1.3]">{detail.blindReview}</p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className={PT_RESULTS_BY_SECTION_PANEL_CLASS}>
        <h2 className="text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#062357]">RESULTS BY SECTION</h2>
        <div className="flex min-w-0 gap-[7px] overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {detail.sections.map((section) => (
            <PrepTestSectionResultCard
              key={section.id}
              kind={section.kind}
              longName={section.longName}
              sectionLabel={section.sectionLabel}
              scoreDelta={section.scoreDelta}
              questionRows={section.questionRows}
              accuracyPct={section.accuracyPct}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function TotalQuestionsBar({
  total,
  filter,
  onFilterChange,
}: {
  total: number
  filter: (typeof QUESTION_FILTER_OPTIONS)[number]
  onFilterChange: (next: (typeof QUESTION_FILTER_OPTIONS)[number]) => void
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <section
      className={cn(
        PT_RESULTS_SURFACE_CARD_CLASS,
        "px-[24px] py-4",
        dropdownOpen && FIGMA_DROPDOWN_CARD_OPEN_CLASS,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-2xl font-bold leading-[1.3] text-[#062357]">Total Questions: {total}</p>
        <FigmaDropdown
          variant="pill"
          value={filter}
          onChange={(next) => onFilterChange(next as (typeof QUESTION_FILTER_OPTIONS)[number])}
          onOpenChange={setDropdownOpen}
          options={QUESTION_FILTER_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
          className="w-full min-w-[160px] max-w-[160px] sm:w-[160px]"
        />
      </div>
    </section>
  )
}

function buildPassageQuestionGroups(
  passages: PrepTestPassageSummary[],
  questions: PrepTestQuestionResultRow[],
): Array<{ passage: PrepTestPassageSummary | null; questions: PrepTestQuestionResultRow[] }> {
  if (questions.length === 0) return []
  if (passages.length === 0) return [{ passage: null, questions }]
  if (passages.length === 1) return [{ passage: passages[0], questions }]

  const perPassage = Math.ceil(questions.length / passages.length)
  return passages
    .map((passage, i) => ({
      passage,
      questions: questions.slice(i * perPassage, (i + 1) * perPassage),
    }))
    .filter((group) => group.questions.length > 0)
}

function PassageSummaryHeader({ passage }: { passage: PrepTestPassageSummary }) {
  return (
    <div className={PT_RESULTS_PASSAGE_HEADER_CLASS}>
      <div className="flex items-start gap-5">
        <div className={PT_RESULTS_PASSAGE_BADGE_CLASS}>
          <span className="text-2xl font-bold leading-[1.3] text-[#0d47a1]">{passage.passageLabel}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-x-6 gap-y-4 lg:flex-nowrap">
          <div className="w-full min-w-[200px] shrink-0 lg:w-[305px]">
            <h3 className="m-0 text-xl font-bold leading-[1.35] text-[#062357]">{passage.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2.5">
              {passage.tags.map((t) => (
                <span key={t} className={PT_RESULTS_TAG_CLASS}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="w-full shrink-0 sm:w-[256px] lg:w-[257px]">
            <p className="m-0 text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">Difficulty</p>
            <div className="mt-3">
              <PracticeDifficultyMeter difficulty={passage.difficulty} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">Time:</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <div className="flex gap-1">
                <span className="text-xs font-normal leading-[1.5] tracking-[0.02em] text-[#666d80]">
                  Target time:
                </span>
                <span className="font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">
                  {passage.targetTime}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="text-xs font-normal leading-[1.5] tracking-[0.02em] text-[#666d80]">
                  Your time:
                </span>
                <span className="font-semibold leading-[1.5] tracking-[0.02em] text-[#0d47a1]">{passage.yourTime}</span>
                <span className="text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">
                  {passage.yourTimeNote}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className={cn(PT_RESULTS_ACTION_BUTTON_CLASS, "ml-auto shrink-0")}
            aria-label="Edit passage notes"
          >
            <Pencil className="size-[18px]" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

function QuestionResultActionButtons() {
  return (
    <div className="flex shrink-0 gap-4">
      <button type="button" className={PT_RESULTS_ACTION_BUTTON_CLASS} aria-label="Edit question">
        <Pencil className="size-[18px]" aria-hidden />
      </button>
      <button type="button" className={PT_RESULTS_ACTION_BUTTON_CLASS} aria-label="Bookmark question">
        <Bookmark className="size-[18px]" aria-hidden />
      </button>
    </div>
  )
}

function QuestionResultRow({
  row,
  showBlindReview = false,
  className,
  bordered = true,
}: {
  row: PrepTestQuestionResultRow
  showBlindReview?: boolean
  className?: string
  bordered?: boolean
}) {
  const popularityRows = (["A", "B", "C", "D", "E"] as const).map((letter, i) => ({
    letter,
    count: row.answerPopularity[i],
    pct: row.answerPopularity[i],
  }))
  const badgeClass = row.isUnanswered
    ? PT_RESULTS_QUESTION_BADGE_UNANSWERED_CLASS
    : row.actualCorrect
      ? PT_RESULTS_QUESTION_BADGE_CORRECT_CLASS
      : PT_RESULTS_QUESTION_BADGE_INCORRECT_CLASS

  return (
    <div className={cn(PT_RESULTS_QUESTION_ROW_PAD_CLASS, bordered && PT_RESULTS_QUESTION_ROW_BORDER_CLASS, className)}>
      <div className="flex items-start gap-5">
        <div className={badgeClass}>
          <span className="text-2xl font-bold leading-[1.3] text-white">{row.number}</span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex w-full items-start">
            <div className="flex w-[562px] shrink-0 flex-col justify-center gap-2">
              <h3 className="m-0 text-xl font-bold leading-[1.35] text-[#062357]">{row.title}</h3>
              <div className="flex flex-wrap gap-2.5">
                {row.tags.map((t) => (
                  <span key={t} className={PT_RESULTS_TAG_CLASS}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
              <p className="m-0 text-sm font-semibold leading-[1.5] tracking-[0.02em] text-[#666d80]">Result</p>
              <div className="flex flex-nowrap items-center gap-5">
                <div className="flex shrink-0 items-center gap-2.5">
                  <PracticeResultOutcomeIcon
                    correct={row.actualCorrect}
                    unanswered={row.isUnanswered}
                    variant="stroke"
                    className="size-6"
                  />
                  <span className="text-base font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">
                    Actual
                  </span>
                </div>
                {showBlindReview ? (
                  <div className="flex shrink-0 items-center gap-2.5">
                    <PracticeResultOutcomeIcon
                      correct={row.blindReviewCorrect}
                      unanswered={row.blindReviewUnanswered}
                      variant="stroke"
                      className="size-6"
                    />
                    <span className="text-base font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">
                      Blind Review
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="ml-4 shrink-0">
              <QuestionResultActionButtons />
            </div>
          </div>

          <PracticeQuestionResultStatsRow
            targetTime={row.targetTime}
            yourTime={row.yourTime}
            yourTimeNote={row.yourTimeNote}
            difficulty={row.difficulty}
            popularityRows={popularityRows}
            correctLetter={row.correctLetter}
            isUnanswered={row.isUnanswered}
          />
        </div>
      </div>
    </div>
  )
}

function PassageQuestionGroupCard({
  passage,
  questions,
  showBlindReview = false,
}: {
  passage: PrepTestPassageSummary | null
  questions: PrepTestQuestionResultRow[]
  showBlindReview?: boolean
}) {
  if (questions.length === 0) return null

  return (
    <article className={PT_RESULTS_CARD_CLASS}>
      {passage ? <PassageSummaryHeader passage={passage} /> : null}
      {questions.map((q, index) => (
        <QuestionResultRow
          key={q.id}
          row={q}
          showBlindReview={showBlindReview}
          bordered={passage != null || index > 0}
        />
      ))}
    </article>
  )
}

function SectionBlock({
  sectionTitle,
  badgeKind,
  score,
  blind,
  showBlindReview = false,
  children,
  className,
}: {
  sectionTitle: string
  badgeKind: PrepTestSectionKind
  score: string
  blind: string
  showBlindReview?: boolean
  children: ReactNode
  className?: string
}) {
  const badge = SECTION_BADGE[badgeKind]
  return (
    <section className={cn(PT_RESULTS_SECTION_BLOCK_CLASS, className)}>
      <div className={PT_RESULTS_SECTION_HEADER_CLASS}>
        <div className="flex flex-nowrap items-center justify-between gap-4">
          <div className="flex min-w-0 shrink-0 items-center gap-2.5">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-[12px] border text-xl font-black leading-[1.5] tracking-[0.02em]"
              style={{ backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }}
            >
              {badge.short}
            </div>
            <h2 className="whitespace-nowrap text-2xl font-bold leading-[1.3] text-[#062357]">{sectionTitle}</h2>
          </div>
          <div className="flex w-[258px] shrink-0 items-center justify-between">
            <div className="flex flex-col gap-[5px] font-bold text-[#062357]">
              <p className="text-xs font-bold leading-[1.5] tracking-[0.24px]">SCORE</p>
              <p className="text-2xl font-bold leading-[1.3]">{score}</p>
            </div>
            {showBlindReview ? (
              <>
                <div className="h-[32px] w-[2px] shrink-0 bg-[#dfe1e7]" aria-hidden />
                <div className="flex flex-col gap-[5px] font-bold text-[#062357]">
                  <p className="text-xs font-bold leading-[1.5] tracking-[0.24px]">BLIND REVIEW</p>
                  <p className="text-2xl font-bold leading-[1.3]">{blind}</p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-[24px]">{children}</div>
    </section>
  )
}

/** Figma `18942:44492` — RC section uses same grouped card layout as LR */
function RcSectionPanel({
  block,
  passages,
  questionFilter,
  showBlindReview = false,
}: {
  block: PrepTestRcSectionBlock
  passages: PrepTestPassageSummary[]
  questionFilter: (typeof QUESTION_FILTER_OPTIONS)[number]
  showBlindReview?: boolean
}) {
  const questions =
    questionFilter === "Incorrect only" ? block.questions.filter((q) => !q.actualCorrect) : block.questions

  const groups = buildPassageQuestionGroups(passages, questions)

  return (
    <SectionBlock
      sectionTitle={block.sectionTitle}
      badgeKind="RC"
      score={block.scoreDisplay}
      blind={block.blindReviewDisplay}
      showBlindReview={showBlindReview}
    >
      {groups.map((group) => (
        <PassageQuestionGroupCard
          key={group.passage?.id ?? "rc-questions"}
          passage={group.passage}
          questions={group.questions}
          showBlindReview={showBlindReview}
        />
      ))}
    </SectionBlock>
  )
}

function AboutMetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-b border-[#f1f5f9] py-3">
      <span className="text-base font-medium leading-[1.5] tracking-[0.02em] text-[#45556c]">{label}</span>
      <span className="text-right text-base font-semibold leading-[1.5] tracking-[0.02em] text-[#062357]">
        {value}
      </span>
    </div>
  )
}

/** Figma `18617:36795` — About this PrepTest */
function AboutPrepTestCard({
  meta,
  excludeFromAnalytics,
  onExcludeFromAnalyticsChange,
}: {
  meta: PrepTestAboutMeta
  excludeFromAnalytics: boolean
  onExcludeFromAnalyticsChange: (next: boolean) => void
}) {
  const rows: Array<[string, string, string, string]> = [
    ["Questions", meta.questionCount, "Timing", meta.timing],
    ["Time used", meta.timeUsed, "Take", meta.take],
    ["Format", meta.format, "Source", meta.source],
  ]

  return (
    <section
      className={cn(
        PT_RESULTS_SURFACE_CARD_CLASS,
        "flex flex-col gap-6 px-6 py-4 shadow-[0px_1px_2px_rgba(16,24,40,0.06),0px_1px_3px_rgba(16,24,40,0.1)]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="!m-0 !text-[24px] font-bold leading-[1.3] text-[#062357]">About this PrepTest</p>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-center gap-3">
            <span className="!text-[20px] font-bold leading-[1.35] text-[#062357]">Insights</span>
            <Switch
              checked={excludeFromAnalytics}
              onChange={(event) => onExcludeFromAnalyticsChange(event.target.checked)}
              aria-label="Exclude this PrepTest from insights"
              size="sm"
            />
          </div>
          <p className="text-xs font-normal leading-[1.5] tracking-[0.02em] text-[#666d80]">
            Exclude from Insights
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-12 md:grid-cols-2">
        {rows.map(([leftLabel, leftValue, rightLabel, rightValue]) => (
          <Fragment key={leftLabel}>
            <AboutMetricRow label={leftLabel} value={leftValue} />
            <AboutMetricRow label={rightLabel} value={rightValue} />
          </Fragment>
        ))}
      </div>

      <button
        type="button"
        className="flex items-center gap-2.5 self-start text-lg font-semibold leading-[1.4] tracking-[0.02em] text-[#df1c41] transition-opacity hover:opacity-80"
      >
        <Trash2 className="size-5 shrink-0" aria-hidden />
        Delete PrepTest
      </button>
    </section>
  )
}

function AnalyticsPrepTestResultsPage() {
  const { testId = "" } = useParams<{ testId: string }>()
  const navigate = useNavigate()
  const analyticsApi = useAnalyticsApi()
  const practiceApi = usePracticeApi()
  const [questionFilter, setQuestionFilter] = useState<(typeof QUESTION_FILTER_OPTIONS)[number]>("Question")
  const [excludeFromAnalytics, setExcludeFromAnalytics] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<PrepTestResultsDetail | null>(null)
  const [completedAt, setCompletedAt] = useState<string>("")
  const [prepTestId, setPrepTestId] = useState<string>("")
  const [prepTestTitle, setPrepTestTitle] = useState<string>("")
  const [moduleId, setModuleId] = useState<string | null>(null)

  useEffect(() => {
    if (!testId) {
      setLoading(false)
      setError("Missing session id")
      return
    }

    if (!analyticsApi) {
      setLoading(false)
      setError("Supabase env is missing.")
      return
    }

    setLoading(true)
    void analyticsApi
      .getPrepTestSessionDetail(testId)
      .then((api) => {
        setDetail(mapPrepTestDetailToResults(api))
        setCompletedAt(api.completedAt)
        setPrepTestId(api.prepTestId)
        setPrepTestTitle(api.prepTestTitle)
        setModuleId(api.moduleId)
        setExcludeFromAnalytics(api.excluded)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load")
      })
      .finally(() => setLoading(false))
  }, [analyticsApi, testId])

  const pageTitle = useMemo(() => {
    if (!completedAt) return prepTestTitle || "PrepTest results"
    return formatPrepTestResultsTitle(prepTestTitle, moduleId, completedAt)
  }, [completedAt, moduleId, prepTestTitle])

  const handleExcludeFromInsightsChange = useCallback(
    (next: boolean) => {
      setExcludeFromAnalytics(next)
      if (!practiceApi || !testId) return
      void practiceApi.updateSession({ sessionId: testId, excluded: next }).catch(() => {
        setExcludeFromAnalytics((current) => (current === next ? !next : current))
      })
    },
    [practiceApi, testId],
  )

  if (loading) {
    return (
      <StudentMain contentClassName="flex min-h-0 flex-1 flex-col">
        <StudentPageLoader centered className="min-h-0 flex-1" label="Loading results…" />
      </StudentMain>
    )
  }
  if (error || !detail) {
    return (
      <StudentMain>
        <p className="text-sm text-red-600">{error ?? "Results not found"}</p>
      </StudentMain>
    )
  }

  return (
    <StudentMain
      className={cn("min-h-full w-full max-w-none", PT_RESULTS_PAGE_BG_CLASS)}
      contentClassName={cn("min-h-full max-w-none", PT_RESULTS_PAGE_BG_CLASS)}
    >
      <div className={PT_RESULTS_PAGE_GAP_CLASS}>
        <section className={PT_RESULTS_HERO_CARD_CLASS}>
          <div className="flex flex-col gap-[24px] sm:flex-row sm:items-center sm:justify-between">
            <h1 className="!m-0 !text-[24px] font-bold leading-[1.3] text-[#062357]">{pageTitle}</h1>
            <div className="flex flex-wrap items-center gap-[24px]">
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-[#dfe1e7] bg-white px-4 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[#0d47a1] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#f3f7ff]"
              >
                <FigmaIcon name="share-square" className="size-4 shrink-0" aria-hidden />
                Share
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = prepTestId || testId
                  navigate(`/app/practice/blind-review/${encodeURIComponent(targetId)}`)
                }}
                className="inline-flex h-10 items-center gap-2 rounded-[16px] bg-[#df1c41] px-4 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition-colors hover:bg-[#df1c41]/90"
              >
                <FigmaIcon name="folder" className="size-4 shrink-0 text-white" aria-hidden />
                Review
              </button>
            </div>
          </div>

          <ResultsSummaryPanel detail={detail} />
        </section>

      <div className={RESULTS_STACK_CLASS}>
        <TotalQuestionsBar total={detail.totalQuestions} filter={questionFilter} onFilterChange={setQuestionFilter} />

        {detail.lrSections.map((lrSection) => {
          const questions =
            questionFilter === "Incorrect only"
              ? lrSection.questions.filter((q) => !q.actualCorrect)
              : lrSection.questions
          const groups = buildPassageQuestionGroups(lrSection.passages, questions)

          return (
            <SectionBlock
              key={lrSection.sectionTitle}
              sectionTitle={lrSection.sectionTitle}
              badgeKind="LR"
              score={lrSection.scoreDisplay}
              blind={lrSection.blindReviewDisplay}
              showBlindReview={detail.blindReviewCompleted}
            >
              {groups.map((group) => (
                <PassageQuestionGroupCard
                  key={group.passage?.id ?? `${lrSection.sectionTitle}-questions`}
                  passage={group.passage}
                  questions={group.questions}
                  showBlindReview={detail.blindReviewCompleted}
                />
              ))}
            </SectionBlock>
          )
        })}

        {detail.rcSection.questions.length > 0 ? (
          <RcSectionPanel
            block={detail.rcSection}
            passages={detail.passages}
            questionFilter={questionFilter}
            showBlindReview={detail.blindReviewCompleted}
          />
        ) : null}

        <AboutPrepTestCard
          meta={detail.about}
          excludeFromAnalytics={excludeFromAnalytics}
          onExcludeFromAnalyticsChange={handleExcludeFromInsightsChange}
        />
      </div>
      </div>
    </StudentMain>
  )
}

export { AnalyticsPrepTestResultsPage }
