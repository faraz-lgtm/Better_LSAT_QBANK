import { cn } from "@/lib/utils"

/** Figma `20268:105580` — exam header glyphs */
const EXAM_HEADER_FIGMA = "/figma/exam-header"

function ExamHeaderFigmaIcon({
  src,
  size,
  className,
}: {
  src: string
  size: number
  className?: string
}) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 overflow-clip", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="size-full max-w-none object-contain"
        draggable={false}
      />
    </span>
  )
}

function ExamHeaderCloseIcon({ className }: { className?: string }) {
  return <ExamHeaderFigmaIcon src={`${EXAM_HEADER_FIGMA}/block.svg`} size={36} className={className} />
}

function OfficialHeaderCloseIcon({ className }: { className?: string }) {
  return <ExamHeaderFigmaIcon src="/figma/exam-official/close.svg" size={22} className={className} />
}

function OfficialHeaderSearchIcon({ className }: { className?: string }) {
  return <ExamHeaderFigmaIcon src="/figma/exam-official/search.svg" size={12} className={className} />
}

function OfficialHeaderTimerIcon({ className }: { className?: string }) {
  return <ExamHeaderFigmaIcon src="/figma/exam-official/timer.svg" size={14} className={className} />
}

function ExamHeaderTimerIcon({ className }: { className?: string }) {
  return <ExamHeaderFigmaIcon src={`${EXAM_HEADER_FIGMA}/timer.svg`} size={16} className={className} />
}

function ExamHeaderPauseIcon({ className }: { className?: string }) {
  return <ExamHeaderFigmaIcon src={`${EXAM_HEADER_FIGMA}/pause.svg`} size={24} className={className} />
}

function ExamHeaderMoreIcon({ className }: { className?: string }) {
  return (
    <ExamHeaderFigmaIcon src={`${EXAM_HEADER_FIGMA}/dots-circle.svg`} size={24} className={className} />
  )
}

export {
  ExamHeaderCloseIcon,
  ExamHeaderMoreIcon,
  ExamHeaderPauseIcon,
  ExamHeaderTimerIcon,
  OfficialHeaderCloseIcon,
  OfficialHeaderSearchIcon,
  OfficialHeaderTimerIcon,
}
