import { useState } from "react"

import { drillFilterPillClass } from "@/features/student/components/drill-filter-pill"
import { SectionInitialBadge } from "@/features/student/drills/section-initial-badge"
import type { SectionType } from "@/features/student/sections/section-types"

const SECTIONS_FIGMA = "/figma/sections" as const

type SectionFilter = "all" | "lr" | "rc"

type PracticeSectionsFreePreviewProps = {
  onLockedAction: () => void
}

/** Figma `21587:36568` — free-plan Sections lock badge. */
function SectionsLockedStatusBadge({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      data-sections-locked-status
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--primary-0)]"
      aria-label="Locked — unlock sections"
      onClick={onClick}
    >
      <img
        src={`${SECTIONS_FIGMA}/lock-sm.svg`}
        alt=""
        width={16}
        height={16}
        className="size-4 max-w-none shrink-0 object-contain"
        draggable={false}
      />
    </button>
  )
}

const freeSelectCardClassName =
  "flex w-full min-w-0 flex-1 flex-col gap-[12px] rounded-[18px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-[24px] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"

function FreeLockedSelectField({
  label,
  description,
  displayValue,
  onActivate,
}: {
  label: string
  description: string
  displayValue: string
  onActivate: () => void
}) {
  return (
    <div className={freeSelectCardClassName}>
      <p className="m-0 text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[var(--color-student-heading)]">
        {label}
      </p>
      <p className="m-0 text-[14px] font-normal leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]">
        {description}
      </p>
      <button
        type="button"
        aria-label={label}
        className="flex h-[52px] w-full items-center gap-2 overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-3 py-2 text-left text-base font-normal leading-[1.5] tracking-[0.32px] text-[var(--color-student-heading)] transition-colors hover:border-[color:var(--primary-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]/30"
        onClick={onActivate}
      >
        <span className="min-w-0 flex-1 truncate">{displayValue}</span>
        <img
          src={`${SECTIONS_FIGMA}/chevron-down.svg`}
          alt=""
          width={20}
          height={20}
          className="size-5 max-w-none shrink-0"
          draggable={false}
        />
      </button>
    </div>
  )
}

const sectionCopy: Record<
  SectionType,
  { title: string; countLabel: string; sectionDescription: string; startLabel: string; sectionValue: string }
> = {
  LR: {
    title: "Logical Reasoning",
    countLabel: "16-20 Questions",
    sectionDescription: "Select passage section",
    startLabel: "Start LR Section",
    sectionValue: "PT123.S1",
  },
  RC: {
    title: "Reading Comprehension",
    countLabel: "4 Passages",
    sectionDescription: "Select passage section",
    startLabel: "Start RC Section",
    sectionValue: "PT123.S1",
  },
}

/** Figma `21587:35373` / `21587:35386` — free-plan section start cards with upgrade gates. */
function FreeSectionStartCard({
  sectionType,
  onLockedAction,
}: {
  sectionType: SectionType
  onLockedAction: () => void
}) {
  const copy = sectionCopy[sectionType]

  return (
    <section className="flex w-full flex-col gap-[24px] rounded-[20px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-[24px]">
      <div className="flex items-center justify-between gap-[12px]">
        <div className="flex min-w-0 items-center gap-[12px]">
          <SectionInitialBadge section={sectionType} variant="compact" />
          <h2 className="m-0 text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-[var(--color-student-heading)]">
            {copy.title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-[16px]">
          <p className="m-0 text-[14px] font-semibold leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]">
            {copy.countLabel}
          </p>
          <SectionsLockedStatusBadge onClick={onLockedAction} />
        </div>
      </div>

      <div className="flex w-full flex-col gap-[24px] lg:flex-row">
        <FreeLockedSelectField
          label="Section"
          description={copy.sectionDescription}
          displayValue={copy.sectionValue}
          onActivate={onLockedAction}
        />
        <FreeLockedSelectField
          label="Timing"
          description="Control your Prep pace"
          displayValue="Unlimited"
          onActivate={onLockedAction}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex h-[48px] w-[172px] items-center justify-center rounded-[14px] border border-[#0b4e6e] bg-[var(--primary)] px-[16px] text-[16px] font-semibold leading-[1.5] tracking-[0.32px] text-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)]"
          onClick={onLockedAction}
        >
          {copy.startLabel}
        </button>
      </div>
    </section>
  )
}

/** Figma `21587:35363` — free-plan Sections browse with in-page upgrade gates. */
function PracticeSectionsFreePreview({ onLockedAction }: PracticeSectionsFreePreviewProps) {
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>("all")

  const showLr = sectionFilter === "all" || sectionFilter === "lr"
  const showRc = sectionFilter === "all" || sectionFilter === "rc"

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div className="flex flex-wrap items-center gap-[8px]">
          <button
            type="button"
            onClick={() => setSectionFilter("all")}
            className={drillFilterPillClass(sectionFilter === "all")}
          >
            All Section
          </button>
          <button
            type="button"
            onClick={() => setSectionFilter("lr")}
            className={drillFilterPillClass(sectionFilter === "lr")}
          >
            Logical Reasoning
          </button>
          <button
            type="button"
            onClick={() => setSectionFilter("rc")}
            className={drillFilterPillClass(sectionFilter === "rc")}
          >
            Reading Comprehension
          </button>
        </div>
        <button
          type="button"
          className="inline-flex h-[32px] items-center gap-[8px] pr-[16px] text-[12px] font-semibold leading-[1.5] tracking-[0.24px] text-[var(--primary)] hover:underline"
          onClick={onLockedAction}
        >
          Sections Insight
          <img
            src={`${SECTIONS_FIGMA}/share-circle.svg`}
            alt=""
            width={16}
            height={16}
            className="size-4 max-w-none shrink-0"
            draggable={false}
          />
        </button>
      </div>

      {showLr ? <FreeSectionStartCard sectionType="LR" onLockedAction={onLockedAction} /> : null}
      {showRc ? <FreeSectionStartCard sectionType="RC" onLockedAction={onLockedAction} /> : null}
    </>
  )
}

export { PracticeSectionsFreePreview }
