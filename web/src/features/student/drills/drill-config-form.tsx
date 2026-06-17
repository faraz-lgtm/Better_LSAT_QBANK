import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { X } from "lucide-react"

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

const sectionCopy: Record<DrillSectionType, { title: string }> = {
  LR: { title: "Logical Reasoning" },
  RC: { title: "Reading Comprehension" },
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
    <div className="flex w-full flex-col gap-5">
      {bannerOpen ? (
        <div className="flex items-start gap-3  px-4 py-3 text-[#666D80] md:items-center md:px-5">
          <p className="min-w-0 flex-1 text-sm leading-snug">
            We&apos;ll target your weaknesses with adaptive drills powered by our smart analytics.{" "}
            <strong className="font-semibold text-[#062357]">On/Off the settings to customize.</strong>
          </p>
          <button
            type="button"
            className="shrink-0 rounded-md p-1 text-[#666d80] transition hover:bg-white/80 hover:text-[#062357]"
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
              <h1 className="!m-0 !text-[24px] !font-bold !leading-[1.3] text-[#062357]">{copy.title}</h1>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4 md:flex-col md:items-end lg:flex-row lg:items-center">
            <div className="text-right text-xs leading-snug sm:text-left md:text-left">
              <p className="text-[20px] font-bold leading-[1.35] text-[#062357]">Customize</p>
              <p className="text-[#666d80]">
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

        <div className="mt-8 flex justify-end border-t border-[#dfe1e7] pt-6">
          <div className="flex flex-wrap items-center justify-end gap-4">
            <Link
              to="/app/practice/drills"
              className="text-sm font-semibold text-[#0d47a1] transition-colors hover:underline"
            >
              Back
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0d47a1] transition-opacity hover:opacity-80"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="size-5 shrink-0"
                aria-hidden
              >
                <path
                  d="M10.0007 9.99967L16.6673 3.33301M16.6673 7.49967V3.33301H12.5007M16.6157 10.833C16.2057 14.1216 13.4003 16.6663 10.0007 16.6663C6.31875 16.6663 3.33398 13.6816 3.33398 9.99967C3.33398 6.59999 5.87872 3.79467 9.16732 3.38459"
                  stroke="currentColor"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Share
            </button>
            <Button type="button" variant="outline" size="default" className="gap-2 !rounded-3xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="19"
                viewBox="0 0 19 19"
                fill="none"
                className="size-[19px] shrink-0"
                aria-hidden
              >
                <path
                  d="M4.82468 1.82317L7.04494 0.903503C7.50933 0.711144 8.04174 0.931673 8.2341 1.39607C8.38705 1.76533 8.77009 1.98522 9.16977 1.98552C9.56966 1.98581 9.94741 1.76559 10.1004 1.39614C10.2928 0.931707 10.8253 0.711158 11.2897 0.903534L13.5098 1.82315C13.9743 2.01552 14.1948 2.54795 14.0024 3.01237C13.8494 3.38181 13.9609 3.80468 14.2438 4.08723C14.5267 4.36964 14.953 4.48506 15.3223 4.3321C15.7867 4.13974 16.3191 4.36027 16.5115 4.82467L17.4311 7.04493C17.6235 7.50933 17.403 8.04173 16.9386 8.23409C16.5693 8.38704 16.3494 8.77012 16.3491 9.1698C16.3488 9.56968 16.569 9.94746 16.9385 10.1005C17.4029 10.2929 17.6234 10.8253 17.4311 11.2897L16.5114 13.5099C16.3191 13.9743 15.7866 14.1949 15.3222 14.0025C14.9528 13.8495 14.5299 13.9609 14.2474 14.2438C13.965 14.5267 13.8496 14.953 14.0025 15.3223C14.1949 15.7867 13.9744 16.3191 13.51 16.5115L11.2897 17.4311C10.8253 17.6235 10.2929 17.403 10.1005 16.9386C9.94759 16.5693 9.56449 16.3494 9.16481 16.3491C8.76491 16.3488 8.38709 16.569 8.23406 16.9385C8.04168 17.4029 7.50923 17.6235 7.04479 17.4311L4.82471 16.5115C4.36025 16.3191 4.1397 15.7867 4.33208 15.3222C4.48512 14.9527 4.37373 14.5299 4.09075 14.2473C3.80792 13.9649 3.38159 13.8496 3.01233 14.0025C2.54794 14.1949 2.01553 13.9744 1.82317 13.51L0.90351 11.2897C0.711151 10.8253 0.93168 10.2929 1.39608 10.1005C1.76534 9.94758 1.98523 9.56452 1.98552 9.16484C1.98582 8.76493 1.7656 8.38714 1.39614 8.23411C0.931685 8.04173 0.71113 7.50926 0.903511 7.04481L1.82309 4.82474C2.01547 4.36029 2.54794 4.13974 3.01239 4.33212C3.38186 4.48516 3.80471 4.37375 4.08728 4.09076C4.36969 3.80793 4.48506 3.38159 4.33211 3.01233C4.13975 2.54793 4.36028 2.01553 4.82468 1.82317Z"
                  stroke="currentColor"
                  strokeWidth="1.66667"
                  strokeLinejoin="round"
                />
              </svg>
              Save Setting
            </Button>
            <Button
              type="button"
              variant="default"
              size="default"
              disabled={starting || poolStats.selectedCount === 0}
              className="gap-2 !rounded-3xl text-white"
              onClick={() => void handleStart()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="size-5 shrink-0 text-white"
                aria-hidden
              >
                <path
                  d="M10 3.33333H5C3.61929 3.33333 2.5 4.45262 2.5 5.83333V15C2.5 16.3807 3.61929 17.5 5 17.5H14.1667C15.5474 17.5 16.6667 16.3807 16.6667 15V10M5.83333 14.1667H10M5.83333 10.8333H12.5M17.5 4.58333C17.5 5.73393 16.5673 6.66667 15.4167 6.66667C14.2661 6.66667 13.3333 5.73393 13.3333 4.58333C13.3333 3.43274 14.2661 2.5 15.4167 2.5C16.5673 2.5 17.5 3.43274 17.5 4.58333Z"
                  stroke="currentColor"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                />
              </svg>
              {starting ? "Starting…" : "Start a Drill"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export { DrillConfigForm }
