/**
 * Produktly rejects browser calls from localhost (403) unless the Origin is an
 * allowlisted production host. In Vite dev, route api.produktly.com through a
 * same-origin proxy that forwards with Origin: https://app.betterlsat.com.
 *
 * Import this module before any Produktly identify / openFeedback calls.
 */
const PRODUKTLY_API_ORIGIN = "https://api.produktly.com"
const DEV_PROXY_PREFIX = "/__produktly_api"

function rewriteProduktlyUrl(url: string): string | null {
  if (!url.startsWith(PRODUKTLY_API_ORIGIN)) return null
  return `${DEV_PROXY_PREFIX}${url.slice(PRODUKTLY_API_ORIGIN.length)}`
}

export function installProduktlyDevProxy(): void {
  if (!import.meta.env.DEV) return
  if (typeof window === "undefined") return

  const originalFetch = window.fetch.bind(window)

  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const rawUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input instanceof Request
            ? input.url
            : String(input)

    const proxied = rewriteProduktlyUrl(rawUrl)
    if (!proxied) return originalFetch(input, init)

    if (typeof input === "string" || input instanceof URL) {
      return originalFetch(proxied, init)
    }
    return originalFetch(new Request(proxied, input), init)
  }
}

installProduktlyDevProxy()
