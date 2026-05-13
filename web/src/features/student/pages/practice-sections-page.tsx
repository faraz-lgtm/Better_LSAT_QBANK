import { type CSSProperties } from "react"
import { Link, useNavigate } from "react-router-dom"
import { RefreshCw } from "lucide-react"

import { drillSurfaceCard } from "@/features/student/drills/drill-surface-style"
import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"
import { StudentMain } from "@/features/student/components/student-main"
import { mockSectionModeCards } from "@/features/student/lib/mock-sections"

const sectionCardSurface: CSSProperties = {
  ...drillSurfaceCard,
  backgroundColor: "color-mix(in srgb, var(--color-student-accent) 5%, var(--background))",
}

function PracticeSectionsPage() {
  const navigate = useNavigate()

  return (
    <StudentMain className="max-w-none bg-[color-mix(in_srgb,var(--color-student-accent)_6%,var(--greyscale-25))] py-6 md:py-8">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl" style={{ color: "var(--color-student-heading)" }}>
            Sections
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
              <li className="font-semibold" style={{ color: "var(--color-student-heading)" }}>
                Section
              </li>
            </ol>
          </nav>
        </div>

        <section className="rounded-2xl border border-solid p-6 md:p-8" style={{ ...drillSurfaceCard, backgroundColor: "var(--background)" }}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm font-medium md:text-base" style={{ color: "var(--color-student-cta)" }}>
              Take a complete section from an official PrepTest.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 transition hover:opacity-80"
                style={{ color: "var(--color-student-cta)" }}
              >
                Sections History
                <RefreshCw className="size-4 shrink-0" strokeWidth={2} />
              </button>
              <span className="mx-1 hidden h-3 w-px bg-[color:var(--greyscale-100)] sm:inline" aria-hidden />
              <span style={{ color: "var(--color-student-cta)" }}>In Process</span>
              <span
                className="inline-flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
                style={{ backgroundColor: "var(--color-student-cta)" }}
              >
                0
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {mockSectionModeCards.map((card) => {
              const isLr = card.section === "LR"
              return (
                <article
                  key={card.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-solid p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  style={sectionCardSurface}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <SectionInitialBadge section={card.section} />
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold leading-tight md:text-xl" style={{ color: "var(--color-student-heading)" }}>
                        {card.title}
                      </h2>
                      <p className="mt-1 text-xs leading-snug md:text-sm" style={{ color: "var(--muted-foreground)" }}>
                        {card.subtitle}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="h-10 shrink-0 rounded-lg border border-solid bg-background px-4 text-sm font-semibold transition hover:bg-[color-mix(in_srgb,var(--color-student-accent)_4%,var(--background))]"
                    style={
                      isLr
                        ? { borderColor: "var(--lr-outline-purple)", color: "var(--lr-badge-text)" }
                        : { borderColor: "var(--rc-outline-mint)", color: "var(--rc-progress)" }
                    }
                    onClick={() => {
                      if (isLr) navigate("/app/practice/drills/lr/new")
                      else navigate("/app/practice/sections/rc")
                    }}
                  >
                    {card.ctaLabel}
                  </button>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </StudentMain>
  )
}

export { PracticeSectionsPage }
