import { Switch } from "@/components/ui/switch"
import { DrillConfigSelectField } from "@/features/student/drills/drill-config-field"
import { drillConfigOptions, type DrillDifficulty } from "@/features/student/drills/drill-types"
import type { SectionShowAnswers } from "@/features/student/sections/section-types"

const sectionShowAnswersOptions: { label: string; value: SectionShowAnswers }[] = [
  { label: "After the section", value: "end" },
  { label: "After each question", value: "each" },
]

type SectionBuildMyOwnHeaderProps = {
  customize: boolean
  onCustomizeChange: (next: boolean) => void
  readyCount: number
}

function SectionBuildMyOwnHeader({ customize, onCustomizeChange, readyCount }: SectionBuildMyOwnHeaderProps) {
  return (
    <div className="flex w-full flex-col gap-0.5 lg:w-auto lg:shrink-0 lg:items-end">
      <div className="flex w-full items-start justify-between gap-4">
        <p className="m-0 text-xl font-bold leading-[1.35] text-[#062357]">Build My Own</p>
        <Switch
          checked={customize}
          onChange={(e) => onCustomizeChange(e.target.checked)}
          className={customize ? "!bg-[#0d47a1]" : "!bg-[#dfe1e6]"}
          aria-label="Build My Own"
        />
      </div>
      <p className="m-0 whitespace-nowrap text-xs font-normal leading-normal tracking-[0.02em] text-[#666d80] lg:text-right">
        {readyCount} new {readyCount === 1 ? "question" : "questions"} ready
      </p>
    </div>
  )
}

type SectionBuildMyOwnFieldsProps = {
  showAnswers: SectionShowAnswers
  onShowAnswersChange: (value: SectionShowAnswers) => void
  difficulty: DrillDifficulty
  onDifficultyChange: (value: DrillDifficulty) => void
  fieldClassName?: string
}

function SectionBuildMyOwnFields({
  showAnswers,
  onShowAnswersChange,
  difficulty,
  onDifficultyChange,
  fieldClassName,
}: SectionBuildMyOwnFieldsProps) {
  return (
    <div className="grid gap-6 overflow-visible sm:grid-cols-2">
      <DrillConfigSelectField
        className={fieldClassName}
        label="Answer Check"
        description="Choose when to check your work."
        value={showAnswers}
        onChange={(value) => onShowAnswersChange(value as SectionShowAnswers)}
        options={sectionShowAnswersOptions}
        menuVariant="surface"
      />
      <DrillConfigSelectField
        className={fieldClassName}
        label="Challenge"
        description="Choose your level."
        value={difficulty}
        onChange={(value) => onDifficultyChange(value as DrillDifficulty)}
        options={[...drillConfigOptions.difficulty]}
        menuVariant="surface"
      />
    </div>
  )
}

export { SectionBuildMyOwnFields, SectionBuildMyOwnHeader, sectionShowAnswersOptions }
