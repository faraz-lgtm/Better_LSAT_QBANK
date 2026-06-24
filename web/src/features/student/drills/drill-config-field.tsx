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
        "flex min-w-0 flex-col gap-4 rounded-xl border border-[#dfe1e7] bg-white p-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
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
}

function DrillConfigSelectField({
  label,
  description,
  className,
  value,
  onChange,
  options,
}: DrillConfigSelectFieldProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <DrillConfigField label={label} description={description} className={className}>
      <StudentOptionMenu
        value={value}
        onChange={onChange}
        options={options}
        ariaLabel={label}
        size="lg"
      />
    </DrillConfigField>
  )
}

export { DrillConfigField, DrillConfigSelectField }
