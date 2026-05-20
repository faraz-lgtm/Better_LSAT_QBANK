import { ChevronDown, ChevronRight, Plus, SquarePlay } from "lucide-react"

import { normalizeLessonStatus } from "@/features/admin/lib/prep-lesson-status"
import { PrepCourseLessonTypeBadge } from "@/features/prep-course/components/prep-course-lesson-type-badge"
import type { PrepCourseCurriculum, PrepCourseLessonRow } from "@/lib/api/admin"
import type { BuilderSelection } from "@/features/admin/lib/course-builder-utils"

type AdminCurriculumTreeProps = {
  curriculum: PrepCourseCurriculum
  selection: BuilderSelection | null
  expandedModules: Set<string>
  expandedSections: Set<string>
  onToggleModule: (moduleId: string) => void
  onToggleSection: (sectionId: string) => void
  onSelect: (selection: BuilderSelection) => void
  onAddModule: () => void
  onAddSection: (moduleId: string) => void
  onAddLesson: (sectionId: string) => void
}

function AdminCurriculumTree({
  curriculum,
  selection,
  expandedModules,
  expandedSections,
  onToggleModule,
  onToggleSection,
  onSelect,
  onAddModule,
  onAddSection,
  onAddLesson,
}: AdminCurriculumTreeProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {curriculum.modules.map((mod) => {
        const modExpanded = expandedModules.has(mod.id)
        return (
          <div
            key={mod.id}
            className="overflow-hidden rounded-[14px] border border-[#dfe1e7] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
          >
            <button
              type="button"
              className={`flex w-full items-center gap-2 px-6 py-3 text-left ${selection?.kind === "module" && selection.id === mod.id ? "bg-[#f3f7ff]" : ""}`}
              onClick={() => {
                onToggleModule(mod.id)
                onSelect({ kind: "module", id: mod.id })
              }}
            >
              {modExpanded ? (
                <ChevronDown className="size-4 shrink-0 text-[#666d80]" aria-hidden />
              ) : (
                <ChevronRight className="size-4 shrink-0 text-[#666d80]" aria-hidden />
              )}
              <span className="text-sm font-semibold tracking-[0.02em] text-[#1a1b25]">
                Module {mod.sort_order}: {mod.title}
              </span>
            </button>
            {modExpanded && (
              <div className="border-t border-[#dfe1e7] pb-2">
                {mod.sections.map((section) => (
                  <SectionBlock
                    key={section.id}
                    section={section}
                    selection={selection}
                    secExpanded={expandedSections.has(section.id)}
                    onToggleSection={onToggleSection}
                    onSelect={onSelect}
                    onAddLesson={onAddLesson}
                  />
                ))}
                <div className="px-4 py-2">
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-[#dfe1e7] py-2 text-xs font-medium text-[#666d80]"
                    onClick={() => onAddSection(mod.id)}
                  >
                    <Plus className="size-3" aria-hidden />
                    Add Section
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
      <button
        type="button"
        className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-[#dfe1e7] text-sm font-medium text-[#666d80]"
        onClick={onAddModule}
      >
        <Plus className="size-4" aria-hidden />
        Add Module
      </button>
    </div>
  )
}

function SectionBlock({
  section,
  selection,
  secExpanded,
  onToggleSection,
  onSelect,
  onAddLesson,
}: {
  section: PrepCourseCurriculum["modules"][0]["sections"][0]
  selection: BuilderSelection | null
  secExpanded: boolean
  onToggleSection: (sectionId: string) => void
  onSelect: (selection: BuilderSelection) => void
  onAddLesson: (sectionId: string) => void
}) {
  return (
    <div className="border-b border-[#dfe1e7]/60 last:border-b-0">
      <button
        type="button"
        className={`flex w-full items-center gap-2 py-2.5 pl-9 pr-4 text-left ${selection?.kind === "section" && selection.id === section.id ? "bg-[#f6f8fa]" : ""}`}
        onClick={() => {
          onToggleSection(section.id)
          onSelect({ kind: "section", id: section.id })
        }}
      >
        {secExpanded ? (
          <ChevronDown className="size-4 shrink-0 text-[#666d80]" aria-hidden />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-[#666d80]" aria-hidden />
        )}
        <span className="text-sm font-medium tracking-[0.02em] text-[#1a1b25]">{section.title}</span>
      </button>
      {secExpanded && (
        <div className="flex flex-col gap-2 px-9 pb-2">
          {section.lessons.map((lesson) => (
            <LessonRowButton
              key={lesson.id}
              lesson={lesson}
              selected={selection?.kind === "lesson" && selection.id === lesson.id}
              onSelect={() => onSelect({ kind: "lesson", id: lesson.id })}
            />
          ))}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-[#dfe1e7] py-2 text-xs font-medium text-[#666d80]"
            onClick={() => onAddLesson(section.id)}
          >
            <Plus className="size-3" aria-hidden />
            Add Lesson
          </button>
        </div>
      )}
    </div>
  )
}

function LessonRowButton({
  lesson,
  selected,
  onSelect,
}: {
  lesson: PrepCourseLessonRow
  selected: boolean
  onSelect: () => void
}) {
  const lessonType = normalizeLessonStatus(lesson.lesson_type)
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 rounded-[10px] border p-2 text-left ${
        selected ? "border-[#0d47a1] bg-[#f3f7ff]" : "border-[#dfe1e7] bg-white"
      }`}
      onClick={onSelect}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded bg-[#f6f8fa]">
        <SquarePlay className="size-3.5 text-[#666d80]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-[#666d80]">{lesson.title || "Untitled lesson"}</span>
      <PrepCourseLessonTypeBadge lessonType={lessonType} />
    </button>
  )
}

export { AdminCurriculumTree }
