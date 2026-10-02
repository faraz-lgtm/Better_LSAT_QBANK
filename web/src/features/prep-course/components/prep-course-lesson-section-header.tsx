import { Bookmark } from "lucide-react"

import { cn } from "@/lib/utils"

type PrepCourseLessonSectionHeaderProps = {
  title: string
  moduleLessonLine?: string | null
  subtitle?: string | null
  rightMeta?: string | null
  lessonSequence?: { current: number; total: number } | null
  lessonBookmarked?: boolean
  onToggleLessonBookmark?: (next: boolean) => void
  bookmarkVariant?: "figma" | "lucide"
  contentClassName?: string
}

function PrepCourseLessonSectionHeader({
  title,
  moduleLessonLine = null,
  subtitle = null,
  rightMeta = null,
  lessonSequence = null,
  lessonBookmarked = false,
  onToggleLessonBookmark,
  bookmarkVariant = "lucide",
  contentClassName,
}: PrepCourseLessonSectionHeaderProps) {
  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-5", contentClassName)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {moduleLessonLine ? (
            <p className="m-0 text-[12px] font-bold leading-[1.5] tracking-[0.24px] text-[var(--primary)]">
              {moduleLessonLine}
            </p>
          ) : null}
          <h2 className="m-0 text-[24px] font-bold leading-[1.3] tracking-normal text-[var(--primary-800)]">
            {title}
          </h2>
          {subtitle ? (
            <p className="m-0 text-[14px] font-normal leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3">
          <button
            type="button"
            aria-label={lessonBookmarked ? "Remove lesson bookmark" : "Save lesson"}
            aria-pressed={lessonBookmarked}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full px-[14px] text-[12px] font-medium leading-[1.5] tracking-[0.24px] transition-colors",
              lessonBookmarked ? "text-[var(--primary)]" : "text-[var(--greyscale-500)] hover:text-[var(--primary)]",
            )}
            onClick={() => onToggleLessonBookmark?.(!lessonBookmarked)}
          >
            {bookmarkVariant === "figma" ? (
              <span className="relative size-4 shrink-0 overflow-clip" aria-hidden>
                <span className="absolute inset-[4.15%_12.5%_4.18%_12.5%]">
                  <img
                    src="/figma/active-drill/bookmark.svg"
                    alt=""
                    className="absolute inset-0 block size-full max-w-none"
                  />
                </span>
              </span>
            ) : (
              <Bookmark className={cn("size-4", lessonBookmarked && "fill-current")} strokeWidth={2} />
            )}
            <span>Save lesson</span>
          </button>
          {rightMeta ? (
            <p className="m-0 text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[var(--greyscale-500)]">
              {rightMeta}
            </p>
          ) : null}
        </div>
      </div>
      {lessonSequence ? (
        <div className="flex items-center gap-[14px]">
          <div className="flex min-w-0 flex-1 items-start gap-[3px]">
            {Array.from({ length: lessonSequence.total }).map((_, idx) => (
              <span
                key={idx}
                className={`h-[5px] min-w-0 flex-1 rounded-full ${
                  idx < lessonSequence.current
                    ? "bg-[var(--primary)]"
                    : "bg-[var(--greyscale-100)] dark:bg-[var(--greyscale-50)]"
                }`}
              />
            ))}
          </div>
          <p className="m-0 text-[12px] font-bold leading-[1.5] tracking-[0.24px] text-[var(--primary-800)]">
            {lessonSequence.current} / {lessonSequence.total}
          </p>
        </div>
      ) : null}
    </div>
  )
}

export { PrepCourseLessonSectionHeader }
