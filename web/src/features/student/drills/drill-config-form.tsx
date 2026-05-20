import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { PlusCircle, Share2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { DrillConfigSelectField } from "@/features/student/drills/drill-config-field"
import { drillSurfaceCard } from "@/features/student/drills/drill-surface-style"
import {
  drillConfigOptions,
  type DrillDifficulty,
  type DrillSectionType,
  type DrillShowAnswers,
  type DrillStatus,
  type DrillTiming,
} from "@/features/student/drills/drill-types"
import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type DrillConfigFormProps = {
  sectionType: DrillSectionType
  initialQuestionTypeId?: string | null
  initialTagLabel?: string | null
  tagOptions?: { label: string; value: string }[]
}

const sectionCopy: Record<
  DrillSectionType,
  { title: string; crumb: string; subtitle?: string }
> = {
  LR: { title: "Logical Reasoning", crumb: "LR Drills" },
  RC: { title: "Reading Comprehension", crumb: "RC Drills" },
}

function DrillConfigForm({
  sectionType,
  initialQuestionTypeId = null,
  initialTagLabel = null,
  tagOptions = [],
}: DrillConfigFormProps) {
  const navigate = useNavigate()
  const practiceApi = useMemo(() => createPracticeApi(getSupabaseBrowserClient()), [])

  const [bannerOpen, setBannerOpen] = useState(true)
  const [customize, setCustomize] = useState(Boolean(initialQuestionTypeId))
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [poolStats, setPoolStats] = useState({ selectedCount: 0, totalCount: 0 })

  const [questionCount, setQuestionCount] = useState("5")
  const [timing, setTiming] = useState<DrillTiming>("unlimited")
  const [showAnswers, setShowAnswers] = useState<DrillShowAnswers>("end")
  const [selection, setSelection] = useState("auto")
  const [tags, setTags] = useState(initialQuestionTypeId ?? "any")
  const [difficulty, setDifficulty] = useState<DrillDifficulty>("adaptive")
  const [status, setStatus] = useState<DrillStatus>("fresh")

  const copy = sectionCopy[sectionType]

  const tagSelectOptions = useMemo(() => {
    const base = [{ label: "Any", value: "any" }, ...tagOptions]
    if (initialQuestionTypeId && !tagOptions.some((t) => t.value === initialQuestionTypeId)) {
      return [{ label: initialTagLabel ?? "Selected tag", value: initialQuestionTypeId }, ...base]
    }
    return base
  }, [tagOptions, initialQuestionTypeId, initialTagLabel])

  const resolvedQuestionTypeId = tags === "any" ? null : tags

  const loadPoolStats = useCallback(async () => {
    try {
      const stats = await practiceApi.getDrillPoolStats({
        sectionType,
        questionTypeId: resolvedQuestionTypeId,
        difficulty,
        status,
      })
      setPoolStats(stats)
    } catch {
      setPoolStats({ selectedCount: 0, totalCount: 0 })
    }
  }, [practiceApi, sectionType, resolvedQuestionTypeId, difficulty, status])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPoolStats()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadPoolStats])

  async function handleStart() {
    setStarting(true)
    setError(null)
    try {
      const count = Number.parseInt(questionCount, 10)
      const out = await practiceApi.startDrill({
        sectionType,
        questionCount: Number.isFinite(count) ? count : 5,
        timing,
        showAnswers,
        selection: selection as "auto" | "manual",
        questionTypeId: resolvedQuestionTypeId,
        tagLabel: initialTagLabel,
        difficulty,
        status,
        title: initialTagLabel ?? undefined,
      })
      navigate(`/app/practice/drills/session/${out.session.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start drill")
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5">
      <nav className="flex flex-wrap items-center gap-1 text-sm font-semibold">
        <Link to="/app/practice/drills" className="hover:underline" style={{ color: "var(--color-student-cta)" }}>
          Practice
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link to="/app/practice/drills" className="hover:underline" style={{ color: "var(--color-student-cta)" }}>
          Drills
        </Link>
        <span className="text-muted-foreground">/</span>
        <span style={{ color: "var(--color-student-heading)" }}>{copy.crumb}</span>
      </nav>

      {bannerOpen ? (
        <div
          className="flex items-start gap-3 rounded-xl border border-solid px-4 py-3 md:items-center md:px-5"
          style={{
            backgroundColor: "var(--student-expanded-row)",
            borderColor: "var(--greyscale-100)",
            color: "var(--color-student-cta)",
          }}
        >
          <p className="min-w-0 flex-1 text-sm leading-snug">
            We&apos;ll target your weaknesses with adaptive drills powered by our smart analytics.{" "}
            <strong className="font-semibold" style={{ color: "var(--color-student-heading)" }}>
              On/Off the settings to customize.
            </strong>
          </p>
          <button
            type="button"
            className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-background/80 hover:text-foreground"
            aria-label="Dismiss banner"
            onClick={() => setBannerOpen(false)}
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>
      ) : null}

      <section className="rounded-2xl border border-solid p-5 md:p-8" style={{ ...drillSurfaceCard, backgroundColor: "#fff" }}>
        <div
          className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-start md:justify-between"
          style={{ borderColor: "var(--greyscale-100)" }}
        >
          <div className="flex min-w-0 items-start gap-3">
            <SectionInitialBadge section={sectionType} />
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight md:text-2xl" style={{ color: "var(--color-student-heading)" }}>
                {copy.title}
              </h1>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4 md:flex-col md:items-end lg:flex-row lg:items-center">
            <div className="text-right text-xs leading-snug sm:text-left md:text-right" style={{ color: "var(--muted-foreground)" }}>
              <p className="font-medium" style={{ color: "var(--color-student-heading)" }}>
                Customize
              </p>
              <p>
                Selecting from {poolStats.selectedCount} of {poolStats.totalCount} questions in your drill pool
              </p>
            </div>
            <Switch
              checked={customize}
              onChange={(e) => setCustomize(e.target.checked)}
              className={customize ? "!bg-[var(--color-student-cta)]" : undefined}
              aria-label="Customize drill settings"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DrillConfigSelectField
            label="Number of Questions"
            description="Select as many questions you can"
            value={questionCount}
            onChange={setQuestionCount}
            options={[...drillConfigOptions.questionCount]}
          />
          <DrillConfigSelectField
            label="Timing"
            description="Control your practice pace"
            value={timing}
            onChange={(v) => setTiming(v as DrillTiming)}
            options={[...drillConfigOptions.timing]}
          />
          <DrillConfigSelectField
            label="Show Answers"
            description="When to reveal answers"
            value={showAnswers}
            onChange={(v) => setShowAnswers(v as DrillShowAnswers)}
            options={[...drillConfigOptions.showAnswers]}
            className="sm:col-span-2 lg:col-span-1"
          />
        </div>

        {customize ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DrillConfigSelectField
              label="Selection"
              description="How questions are chosen for this drill"
              value={selection}
              onChange={setSelection}
              options={[...drillConfigOptions.selection]}
            />
            <DrillConfigSelectField
              label="Tags"
              description="Filter by reasoning tags"
              value={tags}
              onChange={setTags}
              options={tagSelectOptions}
            />
            <DrillConfigSelectField
              label="Difficulty"
              description="Match difficulty to your goals"
              value={difficulty}
              onChange={(v) => setDifficulty(v as DrillDifficulty)}
              options={[...drillConfigOptions.difficulty]}
            />
            <DrillConfigSelectField
              label="Status"
              description="Include questions you have seen before"
              value={status}
              onChange={(v) => setStatus(v as DrillStatus)}
              options={[...drillConfigOptions.status]}
            />
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div
          className="mt-8 flex flex-col-reverse gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: "var(--greyscale-100)" }}
        >
          <Link
            to="/app/practice/drills"
            className="text-sm font-semibold hover:underline"
            style={{ color: "var(--color-student-cta)" }}
          >
            Back
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-80"
              style={{ color: "var(--color-student-cta)" }}
            >
              <Share2 className="size-4" strokeWidth={2} />
              Share
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-80"
              style={{ color: "var(--color-student-cta)" }}
            >
              <PlusCircle className="size-4" strokeWidth={2} />
              Save Setting
            </button>
            <Button
              type="button"
              disabled={starting || poolStats.selectedCount === 0}
              className="gap-2 rounded-xl font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
              style={{ backgroundColor: "var(--color-student-accent)" }}
              onClick={() => void handleStart()}
            >
              <span className="inline-flex size-7 items-center justify-center rounded-md bg-white/15" aria-hidden>
                <span className="ml-0.5 block size-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-white" />
              </span>
              {starting ? "Starting…" : "Start a Drill"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export { DrillConfigForm }
