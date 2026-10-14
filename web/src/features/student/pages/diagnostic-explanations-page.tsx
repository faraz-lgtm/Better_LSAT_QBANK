import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { BarChart3, ChevronDown, ChevronRight, Lock, PlayCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StudentMain } from "@/features/student/components/student-main"
import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"
import { canShowDiagnosticExplanationForQuestionId } from "@/features/guest/diagnostic/diagnostic-explanation-access"
import { useDiagnosticSubscription } from "@/features/guest/diagnostic/use-diagnostic-subscription"
import { useGuestPricingModal } from "@/features/guest/pricing/guest-pricing-modal-provider"
import {
  buildDiagnosticExplanationListItems,
  buildDiagnosticExplanationTrees,
  countDiagnosticExplanationStatus,
  getDiagnosticExplanationTree,
} from "@/features/student/diagnostic/build-diagnostic-explanation-catalog"
import { collectMiniDiagnosticVideoUrls } from "@/features/student/diagnostic/mini-diagnostic-video-urls"
import { readDiagnosticExplanationProgressMap } from "@/features/student/diagnostic/diagnostic-explanation-progress"
import { diagnosticExplanationQuestionDetailHref } from "@/features/student/diagnostic/diagnostic-explanations-routes"
import { createDiagnosticApi } from "@/lib/api/diagnostic"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { explanationListQuestionLabel } from "@/features/student/explanation-detail/explanation-list-question-label"
import type {
  ExplanationPrepTestNode,
  ExplanationQuestionNode,
  ExplanationQuestionStatus,
  ExplanationSectionNode,
} from "@/features/student/explanation-detail/explanation-tree-types"
import { EXPLANATION_TREE_PL_CLASS } from "@/features/student/pages/explanations-tree-indent"
import {
  difficultyLabelFromLevel,
  type PracticeDifficultyLabel,
} from "@/features/student/practice-session/practice-results-ui"
import { cn } from "@/lib/utils"

const S = {
  heading: "var(--color-student-heading)",
  border: "var(--greyscale-100)",
  surface: "var(--greyscale-0)",
  prepTestCardRadius: "var(--explanation-prep-test-card-radius)",
} as const

const PREP_TEST_BADGE_SIZE = {
  width: "64px",
  height: "64px",
  borderRadius: "14px",
} as const

function StatusStat({ dot, count, label }: { dot: string; count: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: dot }} aria-hidden />
      <span className="text-sm leading-[1.5] tracking-[0.28px] tabular-nums text-[var(--color-student-heading)]">
        <span className="font-semibold">{count}</span>
        <span className="font-normal"> {label}</span>
      </span>
    </div>
  )
}

function statusLabel(status: ExplanationQuestionStatus): string {
  switch (status) {
    case "in_process":
      return "In Process"
    case "not_started":
      return "Not Started"
    case "answered":
      return "Answered"
    case "fresh":
      return "Fresh"
    case "seen":
      return "Seen"
    default:
      return status
  }
}

function statusBadgeStyle(status: ExplanationQuestionStatus): {
  backgroundColor: string
  color: string
  dotColor: string
} {
  switch (status) {
    case "in_process":
      return {
        backgroundColor: "var(--explanation-in-process-bg)",
        color: "var(--explanation-in-process)",
        dotColor: "var(--explanation-in-process)",
      }
    case "answered":
      return {
        backgroundColor: "var(--explanation-answered-bg)",
        color: "var(--explanation-answered)",
        dotColor: "var(--explanation-answered)",
      }
    case "seen":
      return {
        backgroundColor: "var(--explanation-seen-bg)",
        color: "var(--explanation-seen)",
        dotColor: "var(--explanation-seen)",
      }
    case "fresh":
    default:
      return {
        backgroundColor: "var(--explanation-fresh-bg)",
        color: "var(--primary)",
        dotColor: "var(--primary)",
      }
  }
}

function StatusBadge({ status }: { status: ExplanationQuestionStatus }) {
  const style = statusBadgeStyle(status)
  return (
    <span
      className="inline-flex h-5 shrink-0 items-center gap-1 rounded-[8px] px-1.5 text-[10px] font-semibold leading-[1.5] tracking-[0.2px] whitespace-nowrap sm:h-7 sm:gap-2 sm:rounded-[10px] sm:px-4 sm:text-xs sm:tracking-[0.24px]"
      style={{ backgroundColor: style.backgroundColor, color: style.color }}
    >
      <span className="size-1.5 shrink-0 rounded-full sm:size-2" style={{ backgroundColor: style.dotColor }} aria-hidden />
      {statusLabel(status)}
    </span>
  )
}

const TREE_ROW_CLASS =
  "explanations-tree-row flex h-14 w-full flex-nowrap items-center justify-between gap-3 border-b pr-3 text-left sm:h-20 sm:gap-6 sm:pr-6"

const QUESTION_ROW_CLASS =
  "explanations-tree-row flex h-14 w-full flex-nowrap items-center justify-between gap-3 border-b bg-[var(--greyscale-0)] pr-3 sm:h-20 sm:gap-6 sm:pr-6"

const PREP_TEST_ROW_CLASS =
  "explanations-tree-row flex h-[72px] w-full flex-nowrap items-center justify-between gap-3 border-b bg-[var(--greyscale-0)] pr-3 text-left transition-colors hover:bg-[var(--primary-0)] sm:h-[88px] sm:gap-6 sm:pr-6"

function prepTestBadgeColors(): { backgroundColor: string; borderColor: string; color: string } {
  return { backgroundColor: "var(--primary-0)", borderColor: "var(--primary)", color: "var(--primary)" }
}

function SectionKindBadge({ kind }: { kind: ExplanationSectionNode["kind"] }) {
  if (kind === "LR" || kind === "RC") {
    return <SectionInitialBadge section={kind} variant="compact" />
  }
  return (
    <span
      aria-label={kind}
      className="inline-flex size-[32px] shrink-0 items-center justify-center rounded-[8px] border-[0.5px] border-[var(--greyscale-100)] bg-[var(--greyscale-25)] p-[5px] text-[14px] font-black leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]"
    >
      {kind}
    </span>
  )
}

function QuestionIndexBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className="flex size-6 shrink-0 items-center justify-center rounded-[8px] border text-[11px] font-semibold leading-[1.5] tracking-[0.2px] sm:size-8 sm:rounded-[10px] sm:text-sm sm:tracking-[0.28px]"
      style={{
        borderColor: "var(--color-student-accent)",
        backgroundColor: "var(--primary-0)",
        color: "var(--color-student-accent)",
      }}
    >
      {children}
    </span>
  )
}

const DIFFICULTY_METER_COLORS: Record<PracticeDifficultyLabel, string> = {
  Easiest: "var(--explanation-teal)",
  Easy: "#ffbd4c",
  Medium: "#ff6f00",
  Hard: "#df1c41",
  Hardest: "#df1c41",
}

function DifficultyMeter({ level }: { level: ExplanationQuestionNode["difficulty"] }) {
  const label = difficultyLabelFromLevel(level)
  const activeColor = DIFFICULTY_METER_COLORS[label]
  return (
    <div className="flex h-7 w-fit shrink-0 items-center gap-1 overflow-visible rounded-[8px] bg-[var(--primary-0)] px-1.5 sm:h-10 sm:gap-2.5 sm:rounded-[10px] sm:px-3">
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className="block h-3 w-1 shrink-0 rounded-full sm:h-4 sm:w-1.5"
            style={{ backgroundColor: i < level ? activeColor : "var(--primary-50)" }}
          />
        ))}
      </div>
      <span
        className="flex h-3 items-center whitespace-nowrap text-[10px] font-semibold leading-none tracking-[0.02em] sm:h-4 sm:text-xs"
        style={{ color: activeColor }}
      >
        {label}
      </span>
    </div>
  )
}

function DiagnosticTreeQuestionRow({
  question,
  indentClass,
  unlocked,
  onLockedClick,
}: {
  question: ExplanationQuestionNode
  indentClass: string
  unlocked: boolean
  onLockedClick: () => void
}) {
  const detailHref = diagnosticExplanationQuestionDetailHref(question.id)
  return (
    <div
      className={cn(QUESTION_ROW_CLASS, indentClass)}
      data-tree-level="question"
      data-explanation-locked={unlocked ? undefined : "true"}
      style={{ borderColor: S.border }}
    >
      <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2.5 overflow-hidden sm:gap-6">
        <QuestionIndexBadge>{question.number}</QuestionIndexBadge>
        {unlocked ? (
          <Link
            to={detailHref}
            className="block min-w-0 truncate rounded-lg text-[11px] font-semibold leading-[1.5] tracking-[0.2px] text-[var(--primary)] outline-offset-2 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--color-student-accent)] sm:shrink-0 sm:whitespace-nowrap sm:text-sm sm:tracking-[0.28px]"
          >
            {explanationListQuestionLabel(question)}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onLockedClick}
            className="inline-flex min-w-0 items-center gap-1 truncate rounded-lg text-[11px] font-semibold leading-[1.5] tracking-[0.2px] text-[var(--greyscale-500)] outline-offset-2 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--color-student-accent)] sm:shrink-0 sm:gap-2 sm:whitespace-nowrap sm:text-sm sm:tracking-[0.28px]"
          >
            <Lock className="size-3 shrink-0 sm:size-3.5" aria-hidden />
            {explanationListQuestionLabel(question)}
          </button>
        )}
        <div className="shrink-0 px-1 sm:px-4">
          {unlocked ? <StatusBadge status={question.status} /> : (
            <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-[8px] bg-[var(--primary-0)] px-1.5 text-[10px] font-semibold leading-[1.5] tracking-[0.2px] text-[var(--primary)] sm:h-7 sm:gap-2 sm:rounded-[10px] sm:px-4 sm:text-xs sm:tracking-[0.24px]">
              <Lock className="size-2.5 shrink-0 sm:size-3" aria-hidden />
              Locked
            </span>
          )}
        </div>
      </div>

      <div className="flex w-auto shrink-0 flex-nowrap items-center justify-end gap-2 sm:w-[412px] sm:gap-6">
        <DifficultyMeter level={question.difficulty} />
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-6">
          {unlocked ? (
            <>
              <Button type="button" variant="ghost" size="icon" className="size-7 rounded-lg text-[var(--greyscale-500)] hover:text-[color:var(--color-student-heading)] sm:size-9 sm:rounded-xl" asChild>
                <Link to={`${detailHref}?tab=analytics`} aria-label="Open analytics tab">
                  <BarChart3 className="size-4 sm:size-6" />
                </Link>
              </Button>
              <Button type="button" variant="ghost" size="icon" className="size-7 rounded-lg text-[var(--greyscale-500)] hover:text-[color:var(--color-student-heading)] sm:size-9 sm:rounded-xl" asChild>
                <Link to={`${detailHref}?tab=explanation`} aria-label="Open video explanation">
                  <PlayCircle className="size-4 sm:size-6" />
                </Link>
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg text-[var(--greyscale-500)] hover:text-[color:var(--color-student-heading)] sm:size-9 sm:rounded-xl"
              aria-label="Unlock explanation"
              onClick={onLockedClick}
            >
              <Lock className="size-4 sm:size-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function DiagnosticExplanationsPage() {
  const { hasActiveCore, loading: subscriptionLoading } = useDiagnosticSubscription()
  const { openPricingModal } = useGuestPricingModal()
  const progress = useMemo(() => readDiagnosticExplanationProgressMap(), [])
  const [videoUrlByQuestionId, setVideoUrlByQuestionId] = useState<Map<string, string>>(() => new Map())
  const showPaidContent = hasActiveCore && !subscriptionLoading

  useEffect(() => {
    let cancelled = false
    const diagnosticApi = createDiagnosticApi(getSupabaseBrowserClient())
    void diagnosticApi
      .getMiniDiagnosticExplanations()
      .then((res) => {
        if (cancelled) return
        setVideoUrlByQuestionId(
          collectMiniDiagnosticVideoUrls(res.explanations ?? [], res.videoUrls ?? []),
        )
      })
      .catch(() => {
        /* catalog still works without video badges */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const listItems = useMemo(
    () => buildDiagnosticExplanationListItems(progress, videoUrlByQuestionId),
    [progress, videoUrlByQuestionId],
  )
  const treesById = useMemo(() => {
    const map = new Map<string, ExplanationPrepTestNode>()
    for (const tree of buildDiagnosticExplanationTrees(progress, videoUrlByQuestionId)) map.set(tree.id, tree)
    return map
  }, [progress, videoUrlByQuestionId])
  const statusCounts = useMemo(() => countDiagnosticExplanationStatus(progress), [progress])
  const [openPt, setOpenPt] = useState<Set<string>>(() => new Set())
  const [openSection, setOpenSection] = useState<Set<string>>(() => new Set())

  const statusStats = [
    { dot: "var(--explanation-in-process)", count: statusCounts.in_process, label: "In Process" },
    { dot: "var(--primary)", count: statusCounts.fresh, label: "Fresh" },
    { dot: "var(--explanation-answered)", count: statusCounts.answered, label: "Answered" },
    { dot: "var(--explanation-seen)", count: statusCounts.seen, label: "Seen" },
  ]

  const togglePrepTest = (ptId: string) => {
    setOpenPt((prev) => {
      const next = new Set(prev)
      if (next.has(ptId)) next.delete(ptId)
      else next.add(ptId)
      return next
    })
  }

  const secKey = (ptId: string, secId: string) => `${ptId}:${secId}`

  const toggleSection = (ptId: string, secId: string) => {
    const key = secKey(ptId, secId)
    setOpenSection((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <StudentMain className="bg-[var(--primary-0)]" contentClassName="flex min-h-0 flex-1 flex-col bg-[var(--primary-0)] pt-6 pb-6">
      <div className="mx-auto flex w-full max-w-[1168px] flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="m-0 text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">
              Diagnostic Explanations
            </h2>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {statusStats.map((s) => (
                <StatusStat key={s.label} dot={s.dot} count={s.count} label={s.label} />
              ))}
            </div>
          </div>
        </div>

        <div
          className="overflow-hidden border border-[var(--greyscale-100)] bg-[var(--greyscale-0)]"
          style={{ borderRadius: S.prepTestCardRadius }}
        >
          {listItems.map((row) => {
            const ptId = row.id
            const tree =
              treesById.get(ptId) ?? getDiagnosticExplanationTree(ptId, progress, videoUrlByQuestionId)
            const ptIsOpen = openPt.has(ptId)
            const badge = prepTestBadgeColors()
            return (
              <div key={ptId}>
                <button
                  type="button"
                  className={cn(PREP_TEST_ROW_CLASS, EXPLANATION_TREE_PL_CLASS.prepTest)}
                  style={{ borderColor: S.border }}
                  onClick={() => togglePrepTest(ptId)}
                  aria-expanded={ptIsOpen}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-6">
                    {ptIsOpen ? (
                      <ChevronDown className="size-5 shrink-0 text-[var(--greyscale-500)]" aria-hidden />
                    ) : (
                      <ChevronRight className="size-5 shrink-0 text-[var(--greyscale-500)]" aria-hidden />
                    )}
                    <span
                      className="flex shrink-0 items-center justify-center text-sm font-bold tracking-[0.02em]"
                      style={{
                        ...PREP_TEST_BADGE_SIZE,
                        backgroundColor: badge.backgroundColor,
                        border: `1px solid ${badge.borderColor}`,
                        color: badge.color,
                      }}
                    >
                      {row.prepTestNumber}
                    </span>
                    <div className="min-w-0 text-left">
                      <p className="m-0 truncate text-base font-semibold text-[var(--color-student-heading)]">{row.title}</p>
                      <p className="m-0 truncate text-sm text-[var(--greyscale-500)]">
                        {row.rowSubtitle} · {row.questionCount} questions
                      </p>
                    </div>
                  </div>
                </button>

                {ptIsOpen && tree
                  ? tree.sections.map((sec) => {
                      const sectionOpen = openSection.has(secKey(ptId, sec.id))
                      const questions = sec.passages.flatMap((pass) => pass.questions)
                      return (
                        <div key={sec.id}>
                          <button
                            type="button"
                            className={cn(TREE_ROW_CLASS, EXPLANATION_TREE_PL_CLASS.section, "bg-[var(--greyscale-0)]")}
                            style={{ borderColor: S.border }}
                            onClick={() => toggleSection(ptId, sec.id)}
                            aria-expanded={sectionOpen}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-6">
                              {sectionOpen ? (
                                <ChevronDown className="size-5 shrink-0 text-[var(--greyscale-500)]" aria-hidden />
                              ) : (
                                <ChevronRight className="size-5 shrink-0 text-[var(--greyscale-500)]" aria-hidden />
                              )}
                              <SectionKindBadge kind={sec.kind} />
                              <span className="truncate text-sm font-semibold text-[var(--color-student-heading)]">
                                Section {sec.sectionNumber} · {sec.sectionTitle}
                              </span>
                            </div>
                          </button>
                          {sectionOpen
                            ? questions.map((q) => (
                                <DiagnosticTreeQuestionRow
                                  key={q.id}
                                  question={q}
                                  indentClass={EXPLANATION_TREE_PL_CLASS.question}
                                  unlocked={canShowDiagnosticExplanationForQuestionId({
                                    questionId: q.id,
                                    hasActiveCore: showPaidContent,
                                  })}
                                  onLockedClick={openPricingModal}
                                />
                              ))
                            : null}
                        </div>
                      )
                    })
                  : null}
              </div>
            )
          })}
        </div>
      </div>
    </StudentMain>
  )
}

export { DiagnosticExplanationsPage }
