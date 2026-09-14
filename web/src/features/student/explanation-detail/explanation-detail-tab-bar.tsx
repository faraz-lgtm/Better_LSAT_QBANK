import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

import type { ExplanationQuestionNavSection } from "@/features/student/explanation-detail/build-explanation-question-nav"
import type { ExplanationDetailTabId } from "@/features/student/explanation-detail/types"
import { cn } from "@/lib/utils"

type ExplanationDetailTabBarProps = {
  headingCode: string
  subtitleTrail: string
  questionId: string
  questionNumber: number
  /** Full PrepTest jump list (all sections / passages). */
  questionNav: ExplanationQuestionNavSection[]
  tab: ExplanationDetailTabId
  onTabChange: (t: ExplanationDetailTabId) => void
  prevHref: string | null
  nextHref: string | null
  showExplanationTab?: boolean
}

const TABS: { id: ExplanationDetailTabId; label: string }[] = [
  { id: "question", label: "Question" },
  { id: "explanation", label: "Video Explanation" },
  { id: "analytics", label: "Insights" },
]

function tabButtonClass(active: boolean): string {
  return cn(
    "inline-flex h-10 items-center justify-center rounded-[14px] px-4 text-sm font-semibold tracking-[0.02em] transition-colors",
    active
      ? "border border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_1px_1px_rgba(13,13,18,0.06)]"
      : "bg-[var(--primary-25)] text-[var(--primary)] hover:bg-[var(--primary-25)]",
  )
}

function navArrowClass(enabled: boolean): string {
  return cn(
    "flex size-6 shrink-0 items-center justify-center rounded-lg shadow-[0_1px_1px_rgba(13,13,18,0.06)] transition-colors",
    enabled ? "text-[var(--color-student-heading)] hover:bg-[var(--primary-25)]" : "cursor-default text-[var(--greyscale-500)] opacity-40",
  )
}

function questionHref(questionId: string, tab: ExplanationDetailTabId): string {
  const q = tab === "question" ? "" : `?tab=${tab}`
  return `/app/learn/explanations/q/${encodeURIComponent(questionId)}${q}`
}

function ExplanationQuestionJumpMenu({
  questionId,
  questionNumber,
  questionNav,
  tab,
  prevControl,
  nextControl,
}: {
  questionId: string
  questionNumber: number
  questionNav: ExplanationQuestionNavSection[]
  tab: ExplanationDetailTabId
  prevControl: ReactNode
  nextControl: ReactNode
}) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const listboxId = useId()
  const activeItemRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return
      if (containerRef.current?.contains(event.target)) return
      setOpen(false)
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => {
      const list = listRef.current
      const el = activeItemRef.current
      if (!list || !el) return
      // Scroll current question to the top — no fake bottom padding (that caused empty space).
      const delta = el.getBoundingClientRect().top - list.getBoundingClientRect().top
      list.scrollTop = Math.max(0, list.scrollTop + delta)
    })
    return () => cancelAnimationFrame(frame)
  }, [open, questionId])

  function handleSelect(id: string) {
    if (!id || id === questionId) {
      setOpen(false)
      return
    }
    setOpen(false)
    void navigate(questionHref(id, tab))
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center gap-2 rounded-2xl bg-[var(--greyscale-0)] p-2"
    >
      {prevControl}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label="Jump to question"
        className="inline-flex h-[30px] min-w-[120px] items-center justify-between gap-1 rounded-lg bg-[var(--primary-25)] px-2 text-[10px] font-semibold tracking-[0.02em] text-[var(--color-student-heading)] outline-none"
        onClick={() => setOpen((current) => !current)}
      >
        <span>Question {questionNumber}</span>
        <ChevronDown
          className={cn("size-3 shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {nextControl}

      {open ? (
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Jump to question"
          className="absolute left-0 right-0 top-full z-40 flex max-h-[min(22rem,calc(100vh-8rem))] w-full flex-col overflow-y-auto rounded-b-[16px] border border-t-0 border-[var(--greyscale-100)] bg-[var(--greyscale-0)] py-2 shadow-[0px_12px_24px_rgba(13,13,18,0.12)]"
        >
          {questionNav.map((section) => (
            <div key={section.key} className="flex flex-col">
              <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--greyscale-500)]">
                {section.heading}
              </div>
              {section.passages.map((passage) => (
                <div key={passage.key} className="flex flex-col">
                  {passage.heading ? (
                    <div className="px-3 pb-0.5 pt-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--greyscale-400)]">
                      {passage.heading}
                    </div>
                  ) : null}
                  {passage.questions.map((q) => {
                    const active = q.id === questionId
                    const answered = q.status === "answered"
                    return (
                      <button
                        key={q.id}
                        ref={active ? activeItemRef : undefined}
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs font-medium tracking-[0.02em] transition-colors",
                          active
                            ? "bg-[var(--primary-25)] text-[var(--color-student-heading)]"
                            : "text-[var(--color-student-heading)] hover:bg-[color:var(--primary-25)]/60",
                        )}
                        onClick={() => handleSelect(q.id)}
                      >
                        <span>Question {q.number}</span>
                        {answered || active ? (
                          <Check
                            className={cn(
                              "size-3.5 shrink-0",
                              active ? "text-[var(--greyscale-400)]" : "text-[var(--primary)]",
                            )}
                            aria-hidden
                          />
                        ) : (
                          <span className="size-3.5 shrink-0" aria-hidden />
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ExplanationDetailTabBar({
  headingCode,
  subtitleTrail,
  questionId,
  questionNumber,
  questionNav,
  tab,
  onTabChange,
  prevHref,
  nextHref,
  showExplanationTab = true,
}: ExplanationDetailTabBarProps) {
  const visibleTabs = TABS.filter((t) => t.id !== "explanation" || showExplanationTab)

  const prevControl = prevHref ? (
    <Link to={prevHref} aria-label="Previous question" className={navArrowClass(true)}>
      <ChevronLeft className="size-3.5" aria-hidden />
    </Link>
  ) : (
    <span aria-label="Previous question" className={navArrowClass(false)}>
      <ChevronLeft className="size-3.5" aria-hidden />
    </span>
  )

  const nextControl = nextHref ? (
    <Link to={nextHref} aria-label="Next question" className={navArrowClass(true)}>
      <ChevronRight className="size-3.5" aria-hidden />
    </Link>
  ) : (
    <span aria-label="Next question" className={navArrowClass(false)}>
      <ChevronRight className="size-3.5" aria-hidden />
    </span>
  )

  return (
    <header className="flex shrink-0 flex-col gap-6 rounded-2xl bg-[var(--primary-25)] p-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-4">
        <div className="min-w-0">
          <h1 className="student-page-heading">{headingCode}</h1>
          <p className="m-0 mt-0 text-xs font-normal leading-normal tracking-[0.02em] text-[var(--greyscale-500)]">
            {subtitleTrail}
          </p>
        </div>

        <ExplanationQuestionJumpMenu
          questionId={questionId}
          questionNumber={questionNumber}
          questionNav={questionNav}
          tab={tab}
          prevControl={prevControl}
          nextControl={nextControl}
        />
      </div>

      <div
        className="inline-flex items-center gap-2 self-start rounded-2xl bg-[var(--greyscale-0)] p-2"
        role="tablist"
        aria-label="Question detail"
      >
        {visibleTabs.map(({ id, label }) => {
          const active = tab === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(id)}
              className={tabButtonClass(active)}
            >
              {label}
            </button>
          )
        })}
      </div>
    </header>
  )
}

export { ExplanationDetailTabBar }
