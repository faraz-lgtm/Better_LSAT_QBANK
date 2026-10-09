/** CSS `aspect-ratio` for Gumlet embeds when oembed is unavailable. */
export const GUMLET_FALLBACK_ASPECT_RATIO = "16 / 9"

type OembedPayload = {
  width?: unknown
  height?: unknown
}

function gumletEmbedUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim())
    const host = url.hostname.replace(/^www\./, "").toLowerCase()
    if (host === "gumlet.tv" || host === "gumlet.com") {
      const watch = url.pathname.match(/^\/watch\/([^/]+)\/?$/)
      if (watch?.[1]) return `https://play.gumlet.io/embed/${watch[1]}`
    }
    if (host === "play.gumlet.io") {
      const embed = url.pathname.match(/^\/embed\/([^/]+)\/?$/)
      if (embed?.[1]) return `https://play.gumlet.io/embed/${embed[1]}`
    }
  } catch {
    /* ignore */
  }
  return null
}

/**
 * Resolves a CSS aspect-ratio string for a Gumlet watch/embed URL via oEmbed.
 * Non-Gumlet URLs and failed lookups return null.
 */
export async function resolveGumletCssAspectRatio(
  videoUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<string | null> {
  const embed = gumletEmbedUrl(videoUrl)
  if (!embed) return null

  const oembedUrl =
    `https://api.gumlet.com/v1/oembed?url=${encodeURIComponent(embed)}&format=json`
  try {
    const res = await fetchFn(oembedUrl)
    if (!res.ok) return null
    const data = (await res.json()) as OembedPayload
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

export async function resolveGumletCssAspectRatios(
  videoUrls: readonly string[],
  fetchFn: typeof fetch = fetch,
): Promise<Map<string, string>> {
  const unique = [...new Set(videoUrls.map((u) => u.trim()).filter(Boolean))]
  const entries = await Promise.all(
    unique.map(async (url) => {
      const ratio = await resolveGumletCssAspectRatio(url, fetchFn)
      return [url, ratio] as const
    }),
  )
  const out = new Map<string, string>()
  for (const [url, ratio] of entries) {
    if (ratio) out.set(url, ratio)
  }
  return out
}
