import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Input, type InputProps } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type PasswordInputProps = Omit<InputProps, "type">

function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative w-full">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-12", className)}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        className="absolute top-1/2 right-4 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#666d80] transition-colors hover:text-[#062357] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d47a1]/30"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
      </button>
    </div>
  )
}

export { PasswordInput }
