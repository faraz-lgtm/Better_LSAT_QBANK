import { useState, type ReactNode } from "react"
import { Clock, Moon, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useAccommodations,
  type ExtraTimeSetting,
} from "@/features/student/accommodations/accommodations-context"
import { ThemeToggleSwitch } from "@/features/theme/theme-toggle"
import { cn } from "@/lib/utils"

const SETTINGS_EDIT_BTN_CLASS =
  "h-[30px] rounded-lg border border-[rgba(44,49,67,0.12)] !bg-transparent px-3 text-xs font-medium tracking-[0.24px] text-[var(--greyscale-500)] !shadow-none hover:!border-[var(--primary)] hover:!bg-[var(--primary)] hover:!text-white"

const SETTINGS_CANCEL_BTN_CLASS =
  "h-[30px] rounded-lg !bg-[var(--greyscale-25)] px-3 text-xs font-medium tracking-[0.24px] text-[var(--greyscale-500)] hover:!bg-[var(--greyscale-50)] hover:!text-[var(--color-student-heading)]"

const EXTRA_TIME_PRESETS: {
  value: ExtraTimeSetting
  label: string
  detail: string
  minutesLabel: string | null
}[] = [
  { value: "none", label: "Standard", detail: "Official LSAT timing", minutesLabel: "35 min" },
  { value: "1.5x", label: "Time and a half", detail: "50% more time per section", minutesLabel: "53 min" },
  { value: "2x", label: "Double time", detail: "Twice the standard time", minutesLabel: "70 min" },
  { value: "custom", label: "Custom", detail: "Set your own section length", minutesLabel: null },
]

function formatAccommodationsDisplay(setting: ExtraTimeSetting, customMinutes: number | null): string {
  switch (setting) {
    case "1.5x":
      return "Time and a half (53 min)"
    case "2x":
      return "Double time (70 min)"
    case "custom":
      return customMinutes != null ? `Custom (${customMinutes} min)` : "Custom"
    default:
      return "Standard (35 min)"
  }
}

function SettingsCardSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: LucideIcon
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)]">
      <div className="flex items-center gap-2 border-b border-[var(--greyscale-100)] px-6 py-4">
        <Icon className="size-4 text-[var(--greyscale-500)]" strokeWidth={1.75} />
        <h2 className="text-sm font-semibold tracking-[0.28px] text-[var(--color-student-heading)]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function AppearanceSettingsSection() {
  return (
    <SettingsCardSection title="Appearance" icon={Moon}>
      <div className="flex items-center justify-between gap-4 px-6 py-[18px]">
        <div className="min-w-0 space-y-1">
          <label
            htmlFor="settings-dark-mode"
            className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]"
          >
            Dark mode
          </label>
          <p className="text-sm font-medium tracking-[0.28px] text-[var(--color-student-heading)]">
            Switch between light and dark theme
          </p>
        </div>
        <ThemeToggleSwitch id="settings-dark-mode" />
      </div>
    </SettingsCardSection>
  )
}

function AccommodationsSettingsSection({
  onStatus,
  onError,
}: {
  onStatus?: (message: string | null) => void
  onError?: (message: string | null) => void
}) {
  const {
    extraTimeSetting,
    extraTimeCustomMinutes,
    updateAccommodations,
  } = useAccommodations()
  const [editing, setEditing] = useState(false)
  const [draftSetting, setDraftSetting] = useState<ExtraTimeSetting>("none")
  const [draftCustomMinutes, setDraftCustomMinutes] = useState("")
  const [saving, setSaving] = useState(false)

  function startEdit() {
    setDraftSetting(extraTimeSetting)
    setDraftCustomMinutes(extraTimeCustomMinutes != null ? String(extraTimeCustomMinutes) : "")
    setEditing(true)
    onError?.(null)
  }

  function cancelEdit() {
    setEditing(false)
  }

  async function saveEdit() {
    const setting = draftSetting
    let customMinutes: number | null = null
    if (setting === "custom") {
      const parsed = parseInt(draftCustomMinutes.trim(), 10)
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 999) {
        onError?.("Custom minutes must be a number between 1 and 999.")
        return
      }
      customMinutes = parsed
    }
    setSaving(true)
    onError?.(null)
    try {
      await updateAccommodations(setting, customMinutes)
      onStatus?.("Accommodations updated.")
      setEditing(false)
    } catch (saveError) {
      onError?.(saveError instanceof Error ? saveError.message : "Failed to update accommodations.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsCardSection title="Accommodations" icon={Clock}>
      {!editing ? (
        <div className="flex items-center justify-between gap-4 px-6 py-[18px]">
          <div className="min-w-0 space-y-1">
            <p className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">Extra Time</p>
            <p className="truncate text-sm font-medium tracking-[0.28px] text-[var(--color-student-heading)]">
              {formatAccommodationsDisplay(extraTimeSetting, extraTimeCustomMinutes)}
            </p>
          </div>
          <Button
            type="button"
            size="xs"
            variant="outline"
            className={cn(SETTINGS_EDIT_BTN_CLASS, "shrink-0")}
            onClick={startEdit}
          >
            Edit
          </Button>
        </div>
      ) : (
        <div className="space-y-4 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold tracking-[0.28px] text-[var(--color-student-heading)]">
                Extra Time
              </p>
              <p className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">
                Applies to PrepTests, sections, and timed drills
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" size="xs" disabled={saving} onClick={() => void saveEdit()}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                disabled={saving}
                className={SETTINGS_CANCEL_BTN_CLASS}
                onClick={cancelEdit}
              >
                Cancel
              </Button>
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {EXTRA_TIME_PRESETS.map((preset) => {
              const selected = draftSetting === preset.value
              return (
                <label
                  key={preset.value}
                  className={cn(
                    "relative flex cursor-pointer flex-col gap-3 rounded-[10px] border p-3.5 transition-colors",
                    selected
                      ? "border-[var(--primary)] bg-[var(--primary-25)] shadow-[0px_1px_2px_0px_rgba(13,71,161,0.12)]"
                      : "border-[rgba(44,49,67,0.08)] bg-[var(--greyscale-0)] hover:border-[rgba(13,71,161,0.28)] hover:bg-[var(--greyscale-25)]",
                    saving && "pointer-events-none opacity-60",
                  )}
                >
                  <input
                    type="radio"
                    name="settings-extra-time"
                    value={preset.value}
                    checked={selected}
                    disabled={saving}
                    onChange={() => setDraftSetting(preset.value)}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-semibold tracking-[0.28px] text-[var(--color-student-heading)]">
                        {preset.label}
                      </p>
                      <p className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">{preset.detail}</p>
                    </div>
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                        selected
                          ? "border-[var(--primary)] bg-[var(--primary)]"
                          : "border-[#c5cad3] bg-[var(--greyscale-0)]",
                      )}
                      aria-hidden
                    >
                      {selected ? <span className="size-1.5 rounded-full bg-white" /> : null}
                    </span>
                  </div>
                  {preset.minutesLabel ? (
                    <span
                      className={cn(
                        "inline-flex w-fit rounded-md px-2 py-1 text-xs font-semibold tracking-[0.24px]",
                        selected
                          ? "bg-[var(--greyscale-0)] text-[var(--primary)]"
                          : "bg-[var(--greyscale-50)] text-[var(--greyscale-500)]",
                      )}
                    >
                      {preset.minutesLabel}
                    </span>
                  ) : null}
                  {preset.value === "custom" && selected ? (
                    <div className="flex items-center gap-2 border-t border-[rgba(13,71,161,0.12)] pt-3">
                      <Input
                        type="number"
                        min={1}
                        max={999}
                        value={draftCustomMinutes}
                        placeholder="e.g. 45"
                        disabled={saving}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setDraftCustomMinutes(e.target.value)}
                        className="h-9 w-[88px] rounded-lg border border-[rgba(44,49,67,0.12)] bg-[var(--greyscale-0)] px-2.5 text-sm font-medium tracking-[0.28px] text-[var(--color-student-heading)] shadow-none focus-visible:ring-1 focus-visible:ring-[var(--primary)]/30"
                      />
                      <span className="text-xs tracking-[0.24px] text-[var(--greyscale-500)]">
                        minutes / section
                      </span>
                    </div>
                  ) : null}
                </label>
              )
            })}
          </div>
        </div>
      )}
    </SettingsCardSection>
  )
}

export { AppearanceSettingsSection, AccommodationsSettingsSection }
