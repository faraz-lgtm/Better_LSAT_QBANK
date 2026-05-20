import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BookOpen, LineChart, ListChecks, Timer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentSubnavStrip } from "@/features/student/components/student-subnav-strip"
import type { SectionPoolItem } from "@/features/student/sections/section-types"
import { createAnalyticsApi, type PracticeSessionSummary } from "@/lib/api/analytics"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type SectionFilter = "all" | "lr" | "rc"

type ContinueSection = {
  id: string
  section: "LR" | "RC"
  title: string
  progressPct: number
  questions: string
  timeLabel: string
  lastAttempt: string
  progressColor: string
}

function filterPill(active: boolean): string {
  if (active) return "border-[#0b4e6e] bg-[#0d47a1] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
  return "border-[#dfe1e7] bg-white text-[#0d47a1] shadow-[0px_1px_2px_rgba(13,13,18,0.06)]"
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffMs = Math.max(0, now - then)
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return hours === 1 ? "1 hour ago" : `${hours} hours ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? "1 day ago" : `${days} days ago`
}

function sectionCardTone(sectionType: SectionPoolItem["sectionType"]) {
  return sectionType === "LR"
    ? { border: "border-[#efd2be]", bg: "bg-[#f2e6dc]", badge: "text-[#f7994a]" }
    : { border: "border-[#b4ddd3]", bg: "bg-[#d7ebe7]", badge: "text-[#45bda4]" }
}

function sectionLabel(item: SectionPoolItem): string {
  const pt = item.prepTestTitle ?? item.moduleId ?? "PrepTest"
  const section = item.title ?? (item.sectionId ? `Section ${item.sectionId}` : "Section")
  return `${pt} — ${section}`
}

function sessionSectionType(session: PracticeSessionSummary): "LR" | "RC" | null {
  const meta = session.metadata
  if (meta.sectionType === "LR" || meta.sectionType === "RC") return meta.sectionType
  if (session.sectionType === "LR" || session.sectionType === "RC") return session.sectionType
  return null
}

function mapSessionToContinueSection(session: PracticeSessionSummary): ContinueSection | null {
  const section = sessionSectionType(session)
  if (!section) return null

  const meta = session.metadata
  const questionIds = Array.isArray(meta.questionIds) ? meta.questionIds.length : 0
  const answeredIds = Array.isArray(meta.answeredQuestionIds) ? meta.answeredQuestionIds.length : 0
  const progressPct = questionIds > 0 ? Math.round((100 * answeredIds) / questionIds) : 0

  const title =
    [typeof meta.prepTestTitle === "string" ? meta.prepTestTitle : null, typeof meta.sectionTitle === "string" ? meta.sectionTitle : null]
      .filter(Boolean)
      .join(" — ") || `${section} section`

  return {
    id: session.id,
    section,
    title,
    progressPct,
    questions: `${answeredIds}/${questionIds || "—"}`,
    timeLabel: typeof meta.timing === "string" ? meta.timing : "35",
    lastAttempt: formatRelativeTime(session.startedAt),
    progressColor: section === "LR" ? "#9d1be8" : "#ff9d51",
  }
}

function PoolSectionCard({
  item,
  starting,
  onStart,
}: {
  item: SectionPoolItem
  starting: boolean
  onStart: () => void
}) {
  const tone = sectionCardTone(item.sectionType)
  const subtitle = item.moduleId ?? item.prepTestTitle ?? "Official PrepTest"

  return (
    <article className={`flex flex-col rounded-2xl border p-4 shadow-sm ${tone.border} ${tone.bg}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${tone.badge}`}>{item.sectionType}</p>
          <h3 className="mt-2 text-lg font-semibold text-[#082c6b]">{sectionLabel(item)}</h3>
          <p className="mt-1 text-sm text-[#666d80]">{subtitle}</p>
        </div>
        <BookOpen className="size-6 shrink-0 text-[#082c6b]/40" />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-[#666d80]">Questions</dt>
          <dd className="font-semibold text-[#082c6b]">{item.questionCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-[#666d80]">Time</dt>
          <dd className="font-semibold text-[#082c6b]">{item.timeMinutes} min</dd>
        </div>
      </dl>
      <Button
        type="button"
        disabled={starting}
        className="mt-4 w-full rounded-2xl bg-[#0d47a1] text-white hover:bg-[#0d47a1]/90"
        onClick={onStart}
      >
        {starting ? "Starting…" : "Start section"}
      </Button>
    </article>
  )
}

function ContinueSectionCard({ section, onContinue }: { section: ContinueSection; onContinue: () => void }) {
  const ringFill = `conic-gradient(from 270deg, ${section.progressColor} ${section.progressPct}%, #dfe1e7 ${section.progressPct}% 100%)`
  const badgeCls =
    section.section === "LR"
      ? "flex h-16 w-12 items-center justify-center rounded-2xl bg-[#fffbeb] text-xl font-bold text-[#ae8b00]"
      : "flex h-16 w-12 items-center justify-center rounded-2xl bg-[#fff3ea] text-xl font-bold text-[#ff9d51]"

  return (
    <article className="rounded-3xl bg-[#f6f8fa] p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex gap-4">
          <div className="w-12 shrink-0">
            <div className={badgeCls}>{section.section}</div>
            <div className="relative mt-3 flex size-11 items-center justify-center rounded-full" style={{ background: ringFill }}>
              <div className="absolute inset-[4px] rounded-full bg-[#f6f8fa]" />
              <span className="relative text-xs font-semibold text-[#4b5565]">{section.progressPct}%</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold leading-snug text-[#062357] md:text-2xl">{section.title}</h3>
            <div className="mt-3 flex flex-wrap items-center gap-5">
              <Stat icon={LineChart} label="Progress" value={`${section.progressPct}%`} />
              <Stat icon={ListChecks} label="Questions" value={section.questions} />
              <Stat icon={Timer} label="Timing" value={section.timeLabel} />
              <p className="ml-auto text-xs text-[#6a7282]">Started {section.lastAttempt}</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eceff3]">
              <div className="h-full rounded-full" style={{ width: `${section.progressPct}%`, backgroundColor: section.progressColor }} />
            </div>
          </div>
        </div>
        <div className="lg:ml-auto">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex h-12 items-center gap-2 rounded-2xl border border-[#0b4e6e] bg-[#0d47a1] px-4 text-base font-semibold tracking-[0.32px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] hover:bg-[#0d47a1]/90"
          >
            Continue
            <span aria-hidden>›</span>
          </button>
        </div>
      </div>
    </article>
  )
}

function Stat({ icon: Icon, label, value }: { icon: typeof LineChart; label: string; value: string }) {
  return (
    <div className="flex min-w-[140px] items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-[#eceff3] text-[#9ca3af]">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-xs text-[#666d80]">{label}</p>
        <p className="text-sm font-semibold text-[#1a1b25]">{value}</p>
      </div>
    </div>
  )
}

function PracticeSectionsPage() {
  const navigate = useNavigate()
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])
  const analyticsApi = useMemo(() => createAnalyticsApi(getSupabaseBrowserClient()), [])

  const [sectionFilter, setSectionFilter] = useState<SectionFilter>("all")
  const [sections, setSections] = useState<SectionPoolItem[]>([])
  const [continueSections, setContinueSections] = useState<ContinueSection[]>([])
  const [loading, setLoading] = useState(true)
  const [startingId, setStartingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const sectionType =
          sectionFilter === "lr" ? ("LR" as const) : sectionFilter === "rc" ? ("RC" as const) : undefined
        const [poolResult, sessionsResult] = await Promise.all([
          practiceApi.listSectionPool(sectionType ? { sectionType } : {}),
          analyticsApi.getSessions({ kind: "SECTION", limit: 50 }),
        ])
        if (cancelled) return
        setSections(poolResult.sections)
        setContinueSections(
          sessionsResult.sessions
            .filter((s) => !s.completedAt)
            .map(mapSessionToContinueSection)
            .filter((s): s is ContinueSection => s != null),
        )
      } catch (e) {
        if (!cancelled) {
          setSections([])
          setContinueSections([])
          setError(e instanceof Error ? e.message : "Failed to load sections")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [practiceApi, analyticsApi, sectionFilter])

  async function handleStart(sectionId: string) {
    setStartingId(sectionId)
    setError(null)
    try {
      const out = await practiceApi.startSection({ sectionId, timing: "35", showAnswers: "end" })
      navigate(`/app/practice/sections/session/${out.session.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start section")
    } finally {
      setStartingId(null)
    }
  }

  const filteredContinue = continueSections.filter((s) => {
    if (sectionFilter === "all") return true
    return sectionFilter === "lr" ? s.section === "LR" : s.section === "RC"
  })

  return (
    <>
      <StudentSubnavStrip crumbs={[{ label: "Practice", href: "/app/practice/drills" }, { label: "Sections" }]} />
      <StudentMain>
        <section className="rounded-2xl border border-[#dfe1e7] bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm text-[#666d80]">Take a complete section from an official PrepTest.</p>
              <h1 className="mt-2 text-2xl font-semibold text-[#082c6b] md:text-3xl">Sections</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-xl" disabled>
                Practice pool
              </Button>
              <span className="rounded-lg border border-[#dfe1e7] px-2 py-1 text-xs font-semibold text-[#666d80]">
                {sections.length}
              </span>
            </div>
          </div>

          <SectionFilters sectionFilter={sectionFilter} setSectionFilter={setSectionFilter} />

          {error ? (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="mt-8 text-sm text-[#666d80]">Loading sections…</p>
          ) : sections.length === 0 ? (
            <p className="mt-8 text-sm text-[#666d80]">No practice sections available yet.</p>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sections.map((item) => (
                <PoolSectionCard
                  key={item.id}
                  item={item}
                  starting={startingId === item.id}
                  onStart={() => void handleStart(item.id)}
                />
              ))}
            </div>
          )}

          <div className="mt-10 border-t border-[#dfe1e7] pt-8">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-[#082c6b]">In Process</h2>
              <span className="inline-flex size-6 items-center justify-center rounded-lg bg-[#eceff3] text-xs font-semibold text-[#0d47a1]">
                {continueSections.length}
              </span>
            </div>
            {loading ? (
              <p className="mt-4 text-sm text-[#666d80]">Loading sessions…</p>
            ) : filteredContinue.length === 0 ? (
              <p className="mt-4 text-sm text-[#666d80]">No sections in progress. Start a section above.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {filteredContinue.map((s) => (
                  <ContinueSectionCard
                    key={s.id}
                    section={s}
                    onContinue={() => navigate(`/app/practice/sections/session/${s.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </StudentMain>
    </>
  )
}

function SectionFilters({
  sectionFilter,
  setSectionFilter,
}: {
  sectionFilter: SectionFilter
  setSectionFilter: (f: SectionFilter) => void
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setSectionFilter("all")}
        className={`h-10 rounded-2xl border px-4 text-sm font-semibold ${filterPill(sectionFilter === "all")}`}
      >
        All
      </button>
      <button
        type="button"
        onClick={() => setSectionFilter("lr")}
        className={`h-10 rounded-xl border px-4 text-sm font-semibold ${filterPill(sectionFilter === "lr")}`}
      >
        Logical Reasoning
      </button>
      <button
        type="button"
        onClick={() => setSectionFilter("rc")}
        className={`h-10 rounded-xl border px-4 text-sm font-semibold ${filterPill(sectionFilter === "rc")}`}
      >
        Reading Comprehension
      </button>
    </div>
  )
}

export { PracticeSectionsPage }
