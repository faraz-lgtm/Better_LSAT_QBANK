import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

type SelectOption = {
  label: string
  value: string
}

type SelectProps = Omit<React.ComponentProps<"select">, "children"> & {
  options: SelectOption[]
  placeholder?: string
}

function Select({ className, options, placeholder = "Select option", ...props }: SelectProps) {
  return (
    <div className="relative w-full">
      <select
        data-slot="select"
        className={cn(
          "h-11 w-full appearance-none rounded-xl border border-input bg-[#F6F8FA] px-3 pr-10 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {!props.value ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export { Select }
