export type PrepTestPoolSettingsItem = {
  prepTestId: string
  moduleId: string
  prepTestNumber: string | null
  title: string | null
  inDrills: boolean
  inSections: boolean
  inTests: boolean
  freshnessPercent: number
  isDefault: boolean
}

export type PrepTestPoolSettingsCounts = {
  drills: number
  sections: number
  tests: number
}

export type PrepTestPoolSettingsListResult = {
  prepTests: PrepTestPoolSettingsItem[]
  counts: PrepTestPoolSettingsCounts
}

export type PrepTestPoolSettingsUpdate = {
  prepTestId: string
  inDrills: boolean
  inSections: boolean
  inTests: boolean
}

export const SETTINGS_HREF = "/app/settings"
/** @deprecated Prefer SETTINGS_HREF — PrepTest pools live under Settings. */
export const PREP_TEST_POOLS_HREF = SETTINGS_HREF
