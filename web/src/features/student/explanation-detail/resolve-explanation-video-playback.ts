export type ExplanationVideoPlayback =
  | { kind: "iframe"; src: string }
  | { kind: "file"; src: string }

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
      return id ? { kind: "iframe", src: `https://www.youtube.com/embed/${id}` } : { kind: "file", src: trimmed }
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v")
        return id ? { kind: "iframe", src: `https://www.youtube.com/embed/${id}` } : { kind: "file", src: trimmed }
      }
      const embed = url.pathname.match(/^\/embed\/([^/]+)/)
      if (embed?.[1]) return { kind: "iframe", src: `https://www.youtube.com/embed/${embed[1]}` }
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const match = url.pathname.match(/\/(?:video\/)?(\d+)/)
      if (match?.[1]) return { kind: "iframe", src: `https://player.vimeo.com/video/${match[1]}` }
    }

    if (host === "gumlet.tv" || host === "gumlet.com") {
      const watch = url.pathname.match(/^\/watch\/([^/]+)\/?$/)
      if (watch?.[1]) return { kind: "iframe", src: `https://play.gumlet.io/embed/${watch[1]}` }
    }

    if (host === "play.gumlet.io") {
      const embed = url.pathname.match(/^\/embed\/([^/]+)\/?$/)
      if (embed?.[1]) return { kind: "iframe", src: `https://play.gumlet.io/embed/${embed[1]}` }
    }
  } catch {
    /* keep as file src */
  }

  return { kind: "file", src: trimmed }
}
