import type { ReactNode } from "react"

import { useState } from "react"

import { FigmaDropdown, FIGMA_DROPDOWN_CARD_OPEN_CLASS } from "@/components/ui/figma-dropdown"
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
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <DrillConfigField
      label={label}
      description={description}
      className={cn(className, menuOpen && FIGMA_DROPDOWN_CARD_OPEN_CLASS)}
    >
      <FigmaDropdown
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        onOpenChange={setMenuOpen}
      />
    </DrillConfigField>
  )
}

export { DrillConfigField, DrillConfigSelectField }
