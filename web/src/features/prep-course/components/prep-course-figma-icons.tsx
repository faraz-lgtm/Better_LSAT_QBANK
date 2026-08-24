const PREP_COURSE_FIGMA = "/figma/prep-course"

function PrepCourseFigmaIcon({
  src,
  className = "size-4",
  alt = "",
}: {
  src: string
  className?: string
  alt?: string
}) {
  return (
    <span className={`relative inline-flex shrink-0 overflow-hidden ${className}`} aria-hidden={alt ? undefined : true}>
      <img src={src} alt={alt} className="size-full max-w-none object-contain" width={16} height={16} />
    </span>
  )
}

function PrepCourseStatClockIcon() {
  return (
    <span className="relative inline-flex size-4 shrink-0 overflow-hidden" aria-hidden>
      <img
        src={`${PREP_COURSE_FIGMA}/stat-clock-ring.svg`}
        alt=""
        className="absolute inset-[8.33%] size-[83.34%] max-w-none"
      />
      <img
        src={`${PREP_COURSE_FIGMA}/stat-clock-dot.svg`}
        alt=""
        className="absolute inset-[43.75%] size-[12.5%] max-w-none"
      />
      <img
        src={`${PREP_COURSE_FIGMA}/stat-clock-hand.svg`}
        alt=""
        className="absolute top-[25%] left-1/2 h-[18.75%] w-px max-w-none -translate-x-1/2"
      />
    </span>
  )
}

export { PREP_COURSE_FIGMA, PrepCourseFigmaIcon, PrepCourseStatClockIcon }
