import type { ReactNode } from "react"

import { StudentOptionMenu } from "@/features/student/components/student-option-menu"
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
        "flex h-full min-w-0 flex-col gap-4 rounded-xl border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] p-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="m-0 text-xl font-bold leading-[1.35] text-[var(--color-student-heading)]">{label}</p>
        <p className="m-0 text-sm font-normal tracking-[0.02em] text-[var(--greyscale-500)]">{description}</p>
      </div>
      <div className="mt-auto min-w-0">{children}</div>
    </div>
  )
}

type DrillConfigSelectFieldProps = Omit<DrillConfigFieldProps, "children"> & {
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
  menuTriggerClassName?: string
  menuVariant?: "default" | "surface"
}

function DrillConfigSelectField({
  label,
  description,
  className,
  value,
  onChange,
  options,
  menuTriggerClassName,
  menuVariant = "default",
}: DrillConfigSelectFieldProps) {
  return (
    <DrillConfigField label={label} description={description} className={className}>
      <StudentOptionMenu
        value={value}
        onChange={onChange}
        options={options}
        ariaLabel={label}
        size="lg"
        variant={menuVariant}
        triggerClassName={menuTriggerClassName}
      />
    </DrillConfigField>
  )
}

export { DrillConfigField, DrillConfigSelectField }
