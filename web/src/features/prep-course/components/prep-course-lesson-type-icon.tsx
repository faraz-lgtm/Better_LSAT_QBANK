import type { ReactElement, SVGProps } from "react"

import type { PrepLesson } from "@/lib/api/prep-course"
import { cn } from "@/lib/utils"

type IconProps = SVGProps<SVGSVGElement>

function LessonTextIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M20 16H7C5.34315 16 4 17.3431 4 19M20 16V19C20 20.6569 18.6569 22 17 22H7C5.34315 22 4 20.6569 4 19M20 16V5C20 3.34315 18.6569 2 17 2H7C5.34315 2 4 3.34315 4 5V19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 7h6M9 11h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LessonActiveDrillIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M20 16H7C5.34315 16 4 17.3431 4 19M20 16V19C20 20.6569 18.6569 22 17 22H7C5.34315 22 4 20.6569 4 19M20 16V5C20 3.34315 18.6569 2 17 2H7C5.34315 2 4 3.34315 4 5V19M9 2V9L12 6.8L15 9V2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LessonAdaptiveDrillIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M4 19V5C4 3.34315 5.34315 2 7 2H17C18.6569 2 20 3.34315 20 5V16M4 19C4 20.6569 5.34315 22 7 22H17C18.6569 22 20 20.6569 20 19V16M4 19C4 17.3431 5.34315 16 7 16H20"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M7 6.5H9.77778M15.8889 6.5H17M15.8889 6.5C15.8889 7.32843 15.1427 8 14.2222 8H13.1111C12.1906 8 11.4444 7.32843 11.4444 6.5C11.4444 5.67157 12.1906 5 13.1111 5L14.2222 5C15.1427 5 15.8889 5.67157 15.8889 6.5ZM14.2222 11.5H17M7 11.5H8.11111M8.11111 11.5C8.11111 12.3284 8.8573 13 9.77778 13H10.8889C11.8094 13 12.5556 12.3284 12.5556 11.5C12.5556 10.6716 11.8094 10 10.8889 10H9.77778C8.8573 10 8.11111 10.6716 8.11111 11.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Figma `18624:72625` — `huge-icon/education/outline/pencil-book` */
function LessonRepWorkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M22 15V6C22 4.34315 20.6569 3 19 3H11C9.34315 3 8 4.34315 8 6V18M22 15H11C9.34315 15 8 16.3431 8 18M22 15V18C22 19.6569 20.6569 21 19 21H11C9.34315 21 8 19.6569 8 18M12 7H18M12 11H15M2 7H5M3.5 21L4.2 20.0667C4.71929 19.3743 5 18.5321 5 17.6667V4.5C5 3.67157 4.32843 3 3.5 3C2.67157 3 2 3.67157 2 4.5V17.6667C2 18.5321 2.28071 19.3743 2.8 20.0667L3.5 21Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const LESSON_TYPE_ICON: Partial<
  Record<PrepLesson["lesson_type"], { icon: (props: IconProps) => ReactElement; className: string }>
> = {
  text: { icon: LessonTextIcon, className: "text-[#0d47a1]" },
  video: { icon: LessonTextIcon, className: "text-[#0d47a1]" },
  video_text: { icon: LessonTextIcon, className: "text-[#0d47a1]" },
  adaptive_drill: { icon: LessonAdaptiveDrillIcon, className: "text-[#0bbcc9]" },
  active_drill: { icon: LessonActiveDrillIcon, className: "text-[#00bc54]" },
  rep_work: { icon: LessonRepWorkIcon, className: "text-[#3374ff]" },
}

type PrepCourseLessonTypeIconProps = {
  lessonType: PrepLesson["lesson_type"]
  className?: string
}

function PrepCourseLessonTypeIcon({ lessonType, className }: PrepCourseLessonTypeIconProps) {
  const config = LESSON_TYPE_ICON[lessonType]
  if (!config) return null

  const Icon = config.icon

  return (
    <span className={cn("flex size-6 shrink-0 items-center justify-center", config.className, className)} aria-hidden>
      <Icon className="size-6" />
    </span>
  )
}

export { LessonAdaptiveDrillIcon, PrepCourseLessonTypeIcon }
