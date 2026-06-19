import type { ReactNode } from "react"

import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type DrillConfigFieldProps = {
  label: string
  description: string
  className?: string
  children: ReactNode
}

function DrillConfigField({ label, description, className, children }: DrillConfigFieldProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-[24px] border border-[#dfe1e7] bg-[#f6f8fa] p-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]",
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        <p className="m-0 text-xl font-bold leading-[1.35] text-[#062357]">{label}</p>
        <p className="m-0 text-sm font-normal tracking-[0.02em] text-[#666d80]">{description}</p>
      </div>
      {children}
    </div>
  )
}

type DrillConfigSelectFieldProps = Omit<DrillConfigFieldProps, "children"> & {
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
  placeholder?: string
}

function DrillConfigSelectField({
  label,
  description,
  className,
  value,
  onChange,
  options,
  placeholder,
}: DrillConfigSelectFieldProps) {
  return (
    <DrillConfigField label={label} description={description} className={className}>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={options}
        placeholder={placeholder}
        className="h-[52px] rounded-[16px] border-[#dfe1e7] bg-[#f5f9ff] px-3 text-base tracking-[0.02em] text-[#062357] shadow-none"
      />
    </DrillConfigField>
  )
}

export { DrillConfigField, DrillConfigSelectField }
