import { Check, Clock, FileText } from "lucide-react"

import type { GuestDiagnosticIntentOption } from "@/features/guest/diagnostic/guest-diagnostic-intent-types"
import { cn } from "@/lib/utils"

type GuestDiagnosticOptionCardProps = {
  option: GuestDiagnosticIntentOption
  selected: boolean
  onSelect: () => void
}

const ACCENT_STYLES = {
  mini: {
    title: "text-[#16a34a]",
    free: "text-[#16a34a]",
    check: "text-[#16a34a]",
  },
  quick: {
    title: "text-[#0d47a1]",
    free: "text-[#0d47a1]",
    check: "text-[#0d47a1]",
  },
  full: {
    title: "text-[#f5880b]",
    free: "text-[#f5880b]",
    check: "text-[#0d47a1]",
  },
} as const

function GuestDiagnosticOptionCard({ option, selected, onSelect }: GuestDiagnosticOptionCardProps) {
  const accent = ACCENT_STYLES[option.id]

  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "guest-intent-card-grid__card flex h-[300px] w-full min-w-0 max-w-[200px] shrink-0 flex-col rounded-[16px] border border-[#dfe1e7] bg-white p-[20.5px] text-left shadow-[0px_1px_1.5px_rgba(13,71,161,0.05),0px_1px_1px_rgba(13,71,161,0.04)] transition justify-self-center",
        option.recommended ? "items-start" : "items-start justify-center",
        selected &&
          "border-[#0d47a1] shadow-[0px_12px_8px_rgba(13,71,161,0.08),0px_4px_3px_rgba(13,71,161,0.03)]",
      )}
      onClick={onSelect}
    >
      {option.recommended ? (
        <span className="mb-1 rounded-[6px] bg-[#f3f7ff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25px] text-[#0d47a1]">
          Recommended
        </span>
      ) : null}

      <span className={cn("text-base font-bold leading-6 tracking-[0.32px]", accent.title)}>{option.title}</span>
      <p className="mt-0.5 text-[11px] font-medium leading-[16.5px] text-[#8a8aaa]">{option.description}</p>

      <div className="mt-3 flex items-center gap-3 text-[11px] font-medium leading-[16.5px] text-[#8a8aaa]">
        <span className="inline-flex items-center gap-1">
          <FileText className="size-[11px] shrink-0" strokeWidth={2} aria-hidden />
          {option.questionCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-[11px] shrink-0" strokeWidth={2} aria-hidden />
          {option.duration}
        </span>
      </div>

      <ul className="mt-3 flex flex-col gap-1.5">
        {option.features.map((feature) => (
          <li key={feature} className="flex items-start gap-1.5 text-[11px] font-medium leading-[16.5px] text-[#062357]">
            <Check className={cn("mt-0.5 size-[11px] shrink-0", accent.check)} strokeWidth={2.5} aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className={cn("w-full border-t border-[#dfe1e7] pt-3", option.recommended ? "mt-auto" : "mt-4")}>
        <span className={cn("text-[13px] font-semibold leading-[19.5px]", accent.free)}>Free</span>
      </div>
    </button>
  )
}

export { GuestDiagnosticOptionCard }
