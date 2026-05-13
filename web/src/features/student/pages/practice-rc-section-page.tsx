import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { drillSurfaceCard } from "@/features/student/drills/drill-surface-style"
import { StudentMain } from "@/features/student/components/student-main"

function PracticeRcSectionPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState("fresh")
  const [passageSection, setPassageSection] = useState("pt123-s1")
  const [timing, setTiming] = useState("unlimited")

  function startSection() {
    const q = new URLSearchParams({ status, passage: passageSection, timing })
    navigate(`/app/practice/sections/rc/session?${q.toString()}`)
  }

  return (
    <StudentMain className="max-w-none bg-[color-mix(in_srgb,var(--color-student-accent)_6%,var(--greyscale-25))] py-6 md:py-8">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl" style={{ color: "var(--color-student-heading)" }}>
            RC Section
          </h1>
          <nav className="text-sm" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-[color:var(--muted-foreground)]">
              <li>
                <Link to="/app/practice/drills" className="font-medium hover:underline" style={{ color: "var(--color-student-accent)" }}>
                  Practice
                </Link>
              </li>
              <li aria-hidden className="text-[color:var(--border)]">
                /
              </li>
              <li>
                <Link to="/app/practice/sections" className="font-medium hover:underline" style={{ color: "var(--color-student-accent)" }}>
                  Sections
                </Link>
              </li>
              <li aria-hidden className="text-[color:var(--border)]">
                /
              </li>
              <li className="font-semibold" style={{ color: "var(--color-student-heading)" }}>
                Reading Comprehension
              </li>
            </ol>
          </nav>
        </div>

        <section
          className="rounded-2xl border border-solid p-6 md:p-8"
          style={{ ...drillSurfaceCard, backgroundColor: "var(--background)" }}
          aria-labelledby="rc-section-page-title"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--greyscale-100)] pb-6">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white"
                style={{ backgroundColor: "var(--rc-badge-bg)" }}
              >
                RC
              </span>
              <div className="min-w-0">
                <h2
                  id="rc-section-page-title"
                  className="text-xl font-bold tracking-tight md:text-2xl"
                  style={{ color: "var(--color-student-heading)" }}
                >
                  Reading Comprehension
                </h2>
                <p className="mt-2 text-sm leading-snug" style={{ color: "var(--muted-foreground)" }}>
                  <Link to="/app/practice/drills" className="font-semibold hover:underline" style={{ color: "var(--color-student-accent)" }}>
                    Go to your practice pool settings
                  </Link>{" "}
                  to change what sections are available.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                Select status
              </label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: "fresh", label: "Fresh" },
                  { value: "review", label: "Review" },
                ]}
                placeholder="Select status"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                Select passage section
              </label>
              <Select
                value={passageSection}
                onChange={(e) => setPassageSection(e.target.value)}
                options={[
                  { value: "pt123-s1", label: "PT123 S1" },
                  { value: "pt124-s2", label: "PT124 S2" },
                ]}
                placeholder="Select passage section"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                Control your practice pace
              </label>
              <Select
                value={timing}
                onChange={(e) => setTiming(e.target.value)}
                options={[
                  { value: "unlimited", label: "Unlimited" },
                  { value: "standard", label: "Standard" },
                ]}
                placeholder="Timing"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[color:var(--greyscale-100)] pt-6 sm:flex-row sm:items-center">
            <Button type="button" variant="outline" className="rounded-xl border-[color:var(--greyscale-100)]" asChild>
              <Link to="/app/practice/sections">Back</Link>
            </Button>
            <Button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 text-white hover:opacity-95"
              style={{ backgroundColor: "var(--color-student-accent)" }}
              onClick={startSection}
            >
              <Play className="size-4" aria-hidden />
              Start Section
            </Button>
          </div>
        </section>
      </div>
    </StudentMain>
  )
}

export { PracticeRcSectionPage }
