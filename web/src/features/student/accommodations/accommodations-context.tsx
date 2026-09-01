import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { createUsersApi, type ExtraTimeSetting } from "@/lib/api/users"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type { ExtraTimeSetting }

/** Standard LSAT section length in seconds (no accommodations). */
export const BASE_SECTION_TIMER_SECONDS = 35 * 60

/** Standard per-question budget in seconds for timed drills (no accommodations). */
export const BASE_PER_QUESTION_SECONDS = 80

/**
 * Derive a numeric scale factor from the user's accommodation setting.
 * The factor is applied uniformly to all timed contexts (sections, drills).
 */
export function resolveTimerScaleFactor(
  setting: ExtraTimeSetting | null | undefined,
  customMinutes: number | null | undefined,
): number {
  switch (setting) {
    case "1.5x":
      return 1.5
    case "2x":
      return 2.0
    case "custom": {
      const mins = typeof customMinutes === "number" && customMinutes > 0 ? customMinutes : 35
      return mins / 35
    }
    default:
      return 1.0
  }
}

/** Scale a base timer seconds value by the accommodation factor (rounded to whole seconds). */
export function applyTimerScale(baseSeconds: number, scaleFactor: number): number {
  return Math.round(baseSeconds * scaleFactor)
}

/** Display minutes for a standard 35-min section after accommodation scale. */
export function resolveAccommodatedSectionMinutes(scaleFactor: number): number {
  return Math.max(1, Math.round(35 * scaleFactor))
}

/** Display seconds for per-question drill pacing after accommodation scale. */
export function resolveAccommodatedPerQuestionSeconds(scaleFactor: number): number {
  return Math.max(1, Math.round(BASE_PER_QUESTION_SECONDS * scaleFactor))
}

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

/** Drill config timing dropdown options with accommodation-aware labels. */
export function buildDrillTimingOptions(scaleFactor: number): { label: string; value: string }[] {
  const sectionMins = resolveAccommodatedSectionMinutes(scaleFactor)
  const perQ = resolveAccommodatedPerQuestionSeconds(scaleFactor)
  return [
    { label: "Unlimited", value: "unlimited" },
    { label: `${sectionMins} minutes`, value: "35" },
    { label: `Per question (${formatMmSs(perQ)})`, value: "per-q" },
  ]
}

/** Section config timing dropdown options with accommodation-aware labels. */
export function buildSectionTimingOptions(scaleFactor: number): { label: string; value: string }[] {
  const sectionMins = resolveAccommodatedSectionMinutes(scaleFactor)
  return [
    { label: "Unlimited", value: "unlimited" },
    { label: `${sectionMins} minutes`, value: "35" },
    { label: "Standard", value: "standard" },
  ]
}

type AccommodationsState = {
  extraTimeSetting: ExtraTimeSetting
  extraTimeCustomMinutes: number | null
  /** Multiplicative scale derived from the setting (1.0 for none, 1.5, 2.0, or custom/35). */
  scaleFactor: number
  /** Scaled section timer in seconds (what to use as the initial countdown for sections). */
  sectionTimerSeconds: number
  /** Scaled per-question budget in seconds (for per-q timed drills). */
  perQuestionSeconds: number
  /** Update the accommodation setting and persist it. */
  updateAccommodations: (
    setting: ExtraTimeSetting,
    customMinutes: number | null,
  ) => Promise<void>
}

const defaultState: AccommodationsState = {
  extraTimeSetting: "none",
  extraTimeCustomMinutes: null,
  scaleFactor: 1.0,
  sectionTimerSeconds: BASE_SECTION_TIMER_SECONDS,
  perQuestionSeconds: BASE_PER_QUESTION_SECONDS,
  updateAccommodations: async () => {},
}

const AccommodationsContext = createContext<AccommodationsState>(defaultState)

export function AccommodationsProvider({ children }: { children: ReactNode }) {
  const [extraTimeSetting, setExtraTimeSetting] = useState<ExtraTimeSetting>("none")
  const [extraTimeCustomMinutes, setExtraTimeCustomMinutes] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const api = createUsersApi(getSupabaseBrowserClient())
        const ctx = await api.getStudyContext()
        if (!alive || !ctx.preferences) return
        setExtraTimeSetting(ctx.preferences.extraTimeSetting ?? "none")
        setExtraTimeCustomMinutes(ctx.preferences.extraTimeCustomMinutes ?? null)
      } catch {
        // silently keep defaults — no accommodation is safe fallback
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const scaleFactor = useMemo(
    () => resolveTimerScaleFactor(extraTimeSetting, extraTimeCustomMinutes),
    [extraTimeSetting, extraTimeCustomMinutes],
  )

  const sectionTimerSeconds = useMemo(
    () => applyTimerScale(BASE_SECTION_TIMER_SECONDS, scaleFactor),
    [scaleFactor],
  )

  const perQuestionSeconds = useMemo(
    () => applyTimerScale(BASE_PER_QUESTION_SECONDS, scaleFactor),
    [scaleFactor],
  )

  const updateAccommodations = useCallback(
    async (setting: ExtraTimeSetting, customMinutes: number | null) => {
      const api = createUsersApi(getSupabaseBrowserClient())
      await api.updateStudyPreferences({
        extraTimeSetting: setting,
        extraTimeCustomMinutes: customMinutes,
      })
      setExtraTimeSetting(setting)
      setExtraTimeCustomMinutes(customMinutes)
    },
    [],
  )

  return (
    <AccommodationsContext.Provider
      value={{
        extraTimeSetting,
        extraTimeCustomMinutes,
        scaleFactor,
        sectionTimerSeconds,
        perQuestionSeconds,
        updateAccommodations,
      }}
    >
      {children}
    </AccommodationsContext.Provider>
  )
}

export function useAccommodations(): AccommodationsState {
  return useContext(AccommodationsContext)
}
