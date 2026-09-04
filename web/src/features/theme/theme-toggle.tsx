import { Moon, Sun } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/features/theme/theme-provider"
import { cn } from "@/lib/utils"

type ThemeToggleButtonProps = {
  className?: string
}

/** Compact icon toggle for the student header. */
function ThemeToggleButton({ className }: ThemeToggleButtonProps) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--greyscale-100)] bg-[var(--primary-25)] text-[color:var(--primary)] transition-colors hover:bg-[color:var(--primary-25)]",
        className,
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      onClick={toggleTheme}
    >
      {isDark ? <Sun className="size-5" strokeWidth={1.75} /> : <Moon className="size-5" strokeWidth={1.75} />}
    </button>
  )
}

type ThemeToggleSwitchProps = {
  className?: string
  id?: string
}

/** Row-style switch for account / settings. */
function ThemeToggleSwitch({ className, id = "account-dark-mode" }: ThemeToggleSwitchProps) {
  const { isDark, setTheme } = useTheme()

  return (
    <Switch
      id={id}
      size="md"
      checked={isDark}
      className={className}
      aria-label="Dark mode"
      onChange={(event) => setTheme(event.target.checked ? "dark" : "light")}
    />
  )
}

export { ThemeToggleButton, ThemeToggleSwitch }
