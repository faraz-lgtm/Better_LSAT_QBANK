/**
 * Fetches Gumlet oEmbed dimensions and returns a CSS aspect-ratio string.
 * Returns null when the URL is not Gumlet, the request fails, or CORS blocks the call.
 */
export async function fetchGumletCssAspectRatio(
  embedOrWatchUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<string | null> {
  const trimmed = embedOrWatchUrl.trim()
  if (!trimmed) return null

  let embedSrc = trimmed
  try {
    const url = new URL(trimmed)
    const host = url.hostname.replace(/^www\./, "").toLowerCase()
    if (host === "gumlet.tv" || host === "gumlet.com") {
      const watch = url.pathname.match(/^\/watch\/([^/]+)\/?$/)
      if (!watch?.[1]) return null
      embedSrc = `https://play.gumlet.io/embed/${watch[1]}`
    } else if (host === "play.gumlet.io") {
      const embed = url.pathname.match(/^\/embed\/([^/]+)\/?$/)
      if (!embed?.[1]) return null
      embedSrc = `https://play.gumlet.io/embed/${embed[1]}`
    } else {
      return null
    }
  } catch {
    return null
  }

  try {
    const res = await fetchFn(
      `https://api.gumlet.com/v1/oembed?url=${encodeURIComponent(embedSrc)}&format=json`,
    )
    if (!res.ok) return null
    const data = (await res.json()) as { width?: unknown; height?: unknown }
    const width = typeof data.width === "number" ? data.width : Number(data.width)
    const height = typeof data.height === "number" ? data.height : Number(data.height)
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return null
    }
    return `${Math.round(width)} / ${Math.round(height)}`
  } catch {
    return null
  }
}
