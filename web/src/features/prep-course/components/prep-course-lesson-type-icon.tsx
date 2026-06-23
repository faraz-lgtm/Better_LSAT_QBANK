import type { ReactElement, SVGProps } from "react"

import type { PrepLesson } from "@/lib/api/prep-course"
import { cn } from "@/lib/utils"

type IconProps = SVGProps<SVGSVGElement>

function LessonTextIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <g transform="translate(4 4) scale(1.8258)">
        <path
          d="M2.9213 2.14533C2.69442 2.14533 2.51049 2.32925 2.51049 2.55614C2.51049 2.78302 2.69442 2.96694 2.9213 2.96694V2.55614V2.14533ZM5.8426 2.96694C6.06948 2.96694 6.25341 2.78302 6.25341 2.55614C6.25341 2.32925 6.06948 2.14533 5.8426 2.14533V2.55614V2.96694ZM2.9213 3.60598C2.69442 3.60598 2.51049 3.7899 2.51049 4.01679C2.51049 4.24367 2.69442 4.42759 2.9213 4.42759V4.01679V3.60598ZM4.38195 4.42759C4.60883 4.42759 4.79276 4.24367 4.79276 4.01679C4.79276 3.7899 4.60883 3.60598 4.38195 3.60598V4.01679V4.42759ZM2.55614 5.8426V6.25341H7.30325V5.8426V5.43179H2.55614V5.8426ZM6.20776 8.03357V7.62276H2.55614V8.03357V8.44438H6.20776V8.03357ZM2.55614 8.03357V7.62276C2.178 7.62276 1.87146 7.31622 1.87146 6.93809H1.46065H1.04984C1.04984 7.76999 1.72423 8.44438 2.55614 8.44438V8.03357ZM6.20776 8.03357V8.44438C7.03966 8.44438 7.71406 7.76999 7.71406 6.93809H7.30325H6.89244C6.89244 7.31622 6.5859 7.62276 6.20776 7.62276V8.03357ZM2.55614 5.8426V5.43179C1.72423 5.43179 1.04984 6.10618 1.04984 6.93809H1.46065H1.87146C1.87146 6.55995 2.178 6.25341 2.55614 6.25341V5.8426ZM2.55614 0.730325V1.14113H6.20776V0.730325V0.319517H2.55614V0.730325ZM7.30325 1.82581H6.89244V6.93809H7.30325H7.71406V1.82581H7.30325ZM1.46065 6.93809H1.87146V1.82581H1.46065H1.04984V6.93809H1.46065ZM6.20776 0.730325V1.14113C6.5859 1.14113 6.89244 1.44767 6.89244 1.82581H7.30325H7.71406C7.71406 0.993908 7.03966 0.319517 6.20776 0.319517V0.730325ZM2.55614 0.730325V0.319517C1.72423 0.319517 1.04984 0.993908 1.04984 1.82581H1.46065H1.87146C1.87146 1.44767 2.178 1.14113 2.55614 1.14113V0.730325ZM2.9213 2.55614V2.96694H5.8426V2.55614V2.14533H2.9213V2.55614ZM2.9213 4.01679V4.42759H4.38195V4.01679V3.60598H2.9213V4.01679Z"
          fill="currentColor"
        />
      </g>
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

function LessonRepWorkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <g transform="translate(2 2)">
        <path
          d="M11.6667 17.5H10C8.15905 17.5 6.66667 16.0076 6.66667 14.1667V5.83333C6.66667 3.99238 8.15905 2.5 10 2.5H15C16.8409 2.5 18.3333 3.99238 18.3333 5.83333V11.6667M1.66667 5.83333H4.16667M10 5.83333H15M10 9.16667H15M10 12.5H12.5M13.3333 15.8333L14.794 17.0019C15.1422 17.2805 15.6481 17.2355 15.9417 16.8999L18.3333 14.1667M2.91667 17.5L3.5 16.7222C3.93274 16.1452 4.16667 15.4435 4.16667 14.7222V3.75C4.16667 3.05964 3.60702 2.5 2.91667 2.5C2.22631 2.5 1.66667 3.05964 1.66667 3.75V14.7222C1.66667 15.4435 1.90059 16.1452 2.33333 16.7222L2.91667 17.5Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
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
  rep_work: { icon: LessonRepWorkIcon, className: "text-[#0d47a1]" },
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
