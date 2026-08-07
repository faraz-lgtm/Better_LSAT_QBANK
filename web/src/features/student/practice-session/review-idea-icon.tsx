import { cn } from "@/lib/utils"

/** Figma `Huge-icon/education/outline/idea` — 20×20 outer, 13×18 leaf */
function ReviewIdeaIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-5 shrink-0", className)}
      viewBox="0 0 13 18"
      fill="none"
      aria-hidden
    >
      <path
        d="M3.125 13.9583H9.79167M3.125 13.9583C3.125 15.7993 4.61738 17.2917 6.45833 17.2917C8.29928 17.2917 9.79167 15.7993 9.79167 13.9583M3.125 13.9583V12.1156C3.125 11.5708 2.84716 11.0719 2.45128 10.6976C1.32668 9.63424 0.625 8.12823 0.625 6.45833C0.625 3.23667 3.23667 0.625 6.45833 0.625C9.67999 0.625 12.2917 3.23667 12.2917 6.45833C12.2917 8.12823 11.59 9.63424 10.4654 10.6976C10.0695 11.0719 9.79167 11.5708 9.79167 12.1156V13.9583M4.79167 6.45833L6.45833 8.125M6.45833 8.125L8.125 6.45833M6.45833 8.125V13.9583"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export { ReviewIdeaIcon }
