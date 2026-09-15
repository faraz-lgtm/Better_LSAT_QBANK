import { useEffect, useRef, useState } from "react"

import type {
  PrepTestPoolSettingsItem,
  PrepTestPoolSettingsListResult,
  PrepTestPoolSettingsUpdate,
} from "@/features/account/prep-test-pool-types"
import { StudentMain } from "@/features/student/components/student-main"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { AppToast } from "@/components/ui/app-toast"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useAppToast } from "@/hooks/use-app-toast"
import { createPracticeApi } from "@/lib/api/practice"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type PoolFlag = "inDrills" | "inSections" | "inTests"

function prepTestLabel(item: PrepTestPoolSettingsItem): string {
  if (item.prepTestNumber) return `PT${item.prepTestNumber}`
  return item.title?.trim() || item.moduleId
}

function applyLocalUpdate(
  current: PrepTestPoolSettingsListResult,
  update: PrepTestPoolSettingsUpdate,
): PrepTestPoolSettingsListResult {
  const prepTests = current.prepTests.map((pt) =>
    pt.prepTestId === update.prepTestId
      ? {
          ...pt,
          inDrills: update.inDrills,
          inSections: update.inSections,
          inTests: update.inTests,
          isDefault: false,
        }
      : pt,
  )
  return {
    prepTests,
    counts: {
      drills: prepTests.filter((pt) => pt.inDrills).length,
      sections: prepTests.filter((pt) => pt.inSections).length,
      tests: prepTests.filter((pt) => pt.inTests).length,
    },
  }
}

export function PrepTestPoolsPage() {
  const practiceApi = createPracticeApi(getSupabaseBrowserClient())
  const { toast, showError, showSuccess, dismiss } = useAppToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<PrepTestPoolSettingsListResult | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingUpdates = useRef<Map<string, PrepTestPoolSettingsUpdate>>(new Map())

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const result = await practiceApi.listPrepTestPoolSettings()
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) {
          showError(err instanceof Error ? err.message : "Failed to load PrepTest pools")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, [])

  function flushUpdates() {
    const updates = [...pendingUpdates.current.values()]
    pendingUpdates.current.clear()
    if (updates.length === 0) return
    setSaving(true)
    void (async () => {
      try {
        const result = await practiceApi.updatePrepTestPoolSettings(updates)
        setData(result)
        showSuccess("Allocation updated.")
      } catch (err) {
        showError(err instanceof Error ? err.message : "Failed to save PrepTest pools")
        try {
          const refreshed = await practiceApi.listPrepTestPoolSettings()
          setData(refreshed)
        } catch {
          /* keep optimistic state if refresh fails */
        }
      } finally {
        setSaving(false)
      }
    })()
  }

  function queueUpdate(update: PrepTestPoolSettingsUpdate) {
    setData((prev) => (prev ? applyLocalUpdate(prev, update) : prev))
    pendingUpdates.current.set(update.prepTestId, update)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => flushUpdates(), 400)
  }

  function onToggle(item: PrepTestPoolSettingsItem, flag: PoolFlag, checked: boolean) {
    queueUpdate({
      prepTestId: item.prepTestId,
      inDrills: flag === "inDrills" ? checked : item.inDrills,
      inSections: flag === "inSections" ? checked : item.inSections,
      inTests: flag === "inTests" ? checked : item.inTests,
    })
  }

  async function onReset() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    pendingUpdates.current.clear()
    setSaving(true)
    try {
      const result = await practiceApi.resetPrepTestPoolSettings()
      setData(result)
      showSuccess("Allocation updated.")
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to reset PrepTest pools")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <StudentMain fullBleed contentClassName="px-6">
        <StudentPageLoader centered className="min-h-0 flex-1" label="Loading PrepTest pools…" />
      </StudentMain>
    )
  }

  const counts = data?.counts ?? { drills: 0, sections: 0, tests: 0 }

  return (
    <StudentMain fullBleed contentClassName="px-6">
      <div className="mx-auto w-full max-w-[1304px] rounded-3xl border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6">
        <h1 className="m-0 text-2xl font-bold leading-[1.3] text-[var(--color-student-heading)]">Settings</h1>

        <div className="mt-8 max-w-[720px]">
          <h2 className="m-0 text-lg font-semibold text-[var(--color-student-heading)]">PrepTest pools</h2>
          <p className="mt-2 text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]">
            By default, BetterLSAT assigns PrepTests to different pools for drills, solo sections, and full PrepTests.
            A PrepTest can belong to more than one pool. Turn pools off to keep a test fresher for later.
          </p>

          <div className="mt-4 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] p-4">
            <p className="m-0 text-[14px] font-semibold text-[var(--color-student-heading)]">
              What tests are best for what type of practice?
            </p>
            <ul className="mt-3 space-y-2 text-[13px] leading-[1.5] text-[var(--greyscale-500)]">
              <li>
                <span className="font-semibold text-[var(--color-student-heading)]">Oldest tests (PT100–PT122):</span>{" "}
                Best for drills.
              </li>
              <li>
                <span className="font-semibold text-[var(--color-student-heading)]">Middle tests (PT123–PT152):</span>{" "}
                Work well for drills, sections, and full tests. Consider reserving 10–15 for sections and full tests.
              </li>
              <li>
                <span className="font-semibold text-[var(--color-student-heading)]">Recent tests (PT153+):</span>{" "}
                Most similar to the current exam — reserve these for full PrepTests.
              </li>
            </ul>
          </div>

          <Button
            type="button"
            variant="outline"
            className="mt-4"
            disabled={saving}
            onClick={() => void onReset()}
          >
            Reset to defaults
          </Button>
        </div>

        <div className="mt-8 overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="mb-3 flex items-end justify-between gap-4 border-b border-[var(--greyscale-100)] pb-3">
              <div>
                <p className="m-0 text-[14px] font-semibold text-[var(--color-student-heading)]">Official PrepTests</p>
              </div>
              <div className="grid grid-cols-3 gap-8 text-center text-[12px] font-semibold uppercase tracking-[0.24px] text-[var(--greyscale-500)]">
                <div>
                  <p className="m-0">Drills</p>
                  <p className="m-0 mt-1 text-[16px] text-[var(--color-student-heading)]">{counts.drills}</p>
                </div>
                <div>
                  <p className="m-0">Sections</p>
                  <p className="m-0 mt-1 text-[16px] text-[var(--color-student-heading)]">{counts.sections}</p>
                </div>
                <div>
                  <p className="m-0">Tests</p>
                  <p className="m-0 mt-1 text-[16px] text-[var(--color-student-heading)]">{counts.tests}</p>
                </div>
              </div>
            </div>

            <ul className="m-0 list-none space-y-0 p-0">
              {(data?.prepTests ?? []).map((item) => (
                <li
                  key={item.prepTestId}
                  className={cn(
                    "flex items-center justify-between gap-4 border-b border-[rgba(44,49,67,0.07)] py-3",
                  )}
                >
                  <div className="min-w-0">
                    <p className="m-0 truncate text-[15px] font-semibold text-[var(--color-student-heading)]">
                      {prepTestLabel(item)}
                    </p>
                    <p className="m-0 text-[12px] text-[var(--greyscale-500)]">{item.freshnessPercent}% fresh</p>
                  </div>
                  <div className="grid grid-cols-3 gap-8">
                    <div className="flex justify-center">
                      <Switch
                        checked={item.inDrills}
                        aria-label={`${prepTestLabel(item)} drills`}
                        onChange={(event) => onToggle(item, "inDrills", event.target.checked)}
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={item.inSections}
                        aria-label={`${prepTestLabel(item)} sections`}
                        onChange={(event) => onToggle(item, "inSections", event.target.checked)}
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={item.inTests}
                        aria-label={`${prepTestLabel(item)} tests`}
                        onChange={(event) => onToggle(item, "inTests", event.target.checked)}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {toast ? <AppToast toast={toast} onDismiss={dismiss} /> : null}
    </StudentMain>
  )
}
