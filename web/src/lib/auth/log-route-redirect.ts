const LOG_PREFIX = "[better-lsat:route]"

type RouteRedirectContext = Record<string, unknown>

/** Dev-only navigation decision logs (filter console by `better-lsat:route`). */
export function logRouteRedirect(
  from: string,
  to: string,
  reason: string,
  context?: RouteRedirectContext,
): void {
  if (!import.meta.env.DEV) return
  console.info(LOG_PREFIX, { from, to, reason, ...context })
}
