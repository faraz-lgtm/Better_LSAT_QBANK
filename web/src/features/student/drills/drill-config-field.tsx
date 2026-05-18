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
        "flex min-h-[120px] flex-col gap-2 rounded-xl border border-solid bg-background p-4",
        className,
      )}
      style={{ borderColor: "var(--greyscale-100)" }}
    >
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--color-student-heading)" }}>
          {label}
        </p>
        <p className="text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>
          {description}
        </p>
      </div>
      <div className="mt-auto">{children}</div>
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
      />
    </DrillConfigField>
  )
}

export { DrillConfigField, DrillConfigSelectField }
