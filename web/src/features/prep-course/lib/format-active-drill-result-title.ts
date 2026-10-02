function formatActiveDrillResultTitle(prefix: string, lessonTitle: string): string {
  const trimmedPrefix = prefix.trim()
  const trimmedTitle = lessonTitle.trim()
  if (!trimmedTitle) return trimmedPrefix

  const stripLeading = (value: string, label: string) =>
    value.replace(new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–:]\\s*`, "i"), "").trim()

  let rest = stripLeading(trimmedTitle, trimmedPrefix)
  if (rest === trimmedTitle) {
    rest = stripLeading(trimmedTitle, "Active Drill")
  }
  if (rest === trimmedTitle) {
    rest = stripLeading(trimmedTitle, "Smart Drill")
  }

  if (!rest) return trimmedPrefix
  return `${trimmedPrefix} - ${rest}`
}

export { formatActiveDrillResultTitle }
