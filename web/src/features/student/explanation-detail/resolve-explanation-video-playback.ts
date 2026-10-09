export type ExplanationVideoPlayback =
  | { kind: "iframe"; src: string; /** CSS aspect-ratio, e.g. `"16 / 9"` */ aspectRatio: string }
  | { kind: "file"; src: string; aspectRatio: string }

/** Fallback until per-video Gumlet oEmbed (or API `aspectRatio`) resolves. */
const DEFAULT_IFRAME_ASPECT_RATIO = "16 / 9"
const DEFAULT_FILE_ASPECT_RATIO = "16 / 9"

function iframePlayback(src: string, aspectRatio = DEFAULT_IFRAME_ASPECT_RATIO): ExplanationVideoPlayback {
  return { kind: "iframe", src, aspectRatio }
}

/**
 * Maps stored video URLs (direct files, YouTube, Vimeo, Gumlet watch/embed) to a playable src.
 */
export function resolveExplanationVideoPlayback(raw: string): ExplanationVideoPlayback | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed)
    const host = url.hostname.replace(/^www\./, "").toLowerCase()

    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\//, "").split("/")[0]
      return id ? iframePlayback(`https://www.youtube.com/embed/${id}`) : { kind: "file", src: trimmed, aspectRatio: DEFAULT_FILE_ASPECT_RATIO }
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v")
        return id
          ? iframePlayback(`https://www.youtube.com/embed/${id}`)
          : { kind: "file", src: trimmed, aspectRatio: DEFAULT_FILE_ASPECT_RATIO }
      }
      const embed = url.pathname.match(/^\/embed\/([^/]+)/)
      if (embed?.[1]) return iframePlayback(`https://www.youtube.com/embed/${embed[1]}`)
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const match = url.pathname.match(/\/(?:video\/)?(\d+)/)
      if (match?.[1]) return iframePlayback(`https://player.vimeo.com/video/${match[1]}`)
    }

    if (host === "gumlet.tv" || host === "gumlet.com") {
      const watch = url.pathname.match(/^\/watch\/([^/]+)\/?$/)
      if (watch?.[1]) {
        return iframePlayback(`https://play.gumlet.io/embed/${watch[1]}`)
      }
    }

    if (host === "play.gumlet.io") {
      const embed = url.pathname.match(/^\/embed\/([^/]+)\/?$/)
      if (embed?.[1]) {
        return iframePlayback(`https://play.gumlet.io/embed/${embed[1]}`)
      }
    }
  } catch {
    /* keep as file src */
  }

  return { kind: "file", src: trimmed, aspectRatio: DEFAULT_FILE_ASPECT_RATIO }
}
