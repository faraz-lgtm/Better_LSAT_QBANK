import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { PlusCircle, Share2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { DrillConfigSelectField } from "@/features/student/drills/drill-config-field"
import { drillSurfaceCard } from "@/features/student/drills/drill-surface-style"
import { lrDrillConfigOptions, lrDrillPoolMock } from "@/features/student/drills/lr-drill-mock"
import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"
import { StudentMain } from "@/features/student/components/student-main"

function LrNewDrillPage() {
  const navigate = useNavigate()
  const [bannerOpen, setBannerOpen] = useState(true)
  const [customize, setCustomize] = useState(false)

  const [questionCount, setQuestionCount] = useState("1")
  const [timing, setTiming] = useState("unlimited")
  const [showAnswers, setShowAnswers] = useState("end")
  const [selection, setSelection] = useState("auto")
  const [tags, setTags] = useState("any")
  const [difficulty, setDifficulty] = useState("adaptive")
  const [status, setStatus] = useState("fresh")

  return (
    <StudentMain className="max-w-none bg-[color-mix(in_srgb,var(--color-student-accent)_6%,var(--greyscale-25))] py-6 md:py-8">
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
          <span style={{ color: "var(--color-student-heading)" }}>LR Drills</span>
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
          <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-start md:justify-between" style={{ borderColor: "var(--greyscale-100)" }}>
            <div className="flex min-w-0 items-start gap-3">
              <SectionInitialBadge section="LR" />
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight md:text-2xl" style={{ color: "var(--color-student-heading)" }}>
                  Logical Reasoning
                </h1>
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4 md:flex-col md:items-end lg:flex-row lg:items-center">
              <div className="text-right text-xs leading-snug sm:text-left md:text-right" style={{ color: "var(--muted-foreground)" }}>
                <p className="font-medium" style={{ color: "var(--color-student-heading)" }}>
                  Customize
                </p>
                <p>
                  Selecting from {lrDrillPoolMock.selectedCount} of {lrDrillPoolMock.totalCount} questions in your drill pool
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
              options={[...lrDrillConfigOptions.questionCount]}
            />
            <DrillConfigSelectField
              label="Timing"
              description="Control your practice pace"
              value={timing}
              onChange={setTiming}
              options={[...lrDrillConfigOptions.timing]}
            />
            <DrillConfigSelectField
              label="Show Answers"
              description="When to reveal answers"
              value={showAnswers}
              onChange={setShowAnswers}
              options={[...lrDrillConfigOptions.showAnswers]}
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
                options={[...lrDrillConfigOptions.selection]}
              />
              <DrillConfigSelectField
                label="Tags"
                description="Filter by reasoning tags"
                value={tags}
                onChange={setTags}
                options={[...lrDrillConfigOptions.tags]}
              />
              <DrillConfigSelectField
                label="Difficulty"
                description="Match difficulty to your goals"
                value={difficulty}
                onChange={setDifficulty}
                options={[...lrDrillConfigOptions.difficulty]}
              />
              <DrillConfigSelectField
                label="Status"
                description="Include questions you have seen before"
                value={status}
                onChange={setStatus}
                options={[...lrDrillConfigOptions.status]}
              />
            </div>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--greyscale-100)" }}>
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
                className="gap-2 rounded-xl font-semibold text-white shadow-sm hover:opacity-95"
                style={{ backgroundColor: "var(--color-student-accent)" }}
                onClick={() => navigate("/app/practice/drills/lr/session")}
              >
                <span className="inline-flex size-7 items-center justify-center rounded-md bg-white/15" aria-hidden>
                  <span className="ml-0.5 block size-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-white" />
                </span>
                Start a Drill
              </Button>
            </div>
          </div>
        </section>
      </div>
    </StudentMain>
  )
}

export { LrNewDrillPage }
