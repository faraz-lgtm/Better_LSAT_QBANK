export function videoUrlSummary(url: string): string {
  const t = url.trim()
  if (!t) return "No video linked"
  try {
    const u = new URL(t)
    return u.hostname + u.pathname.slice(0, 48) + (u.pathname.length > 48 ? "…" : "")
  } catch {
    return t.length > 56 ? `${t.slice(0, 54)}…` : t
  }
}
