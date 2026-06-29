export const PREPTEST_LIST_HREF = "/app/preptest"

const LEGACY_PREPTEST_PREFIX = "/app/practice/preptest"

export function isPrepTestStudentPath(pathname: string): boolean {
  return pathname === PREPTEST_LIST_HREF || pathname.startsWith(`${PREPTEST_LIST_HREF}/`)
}

export function isPrepTestHubDetailPath(pathname: string): boolean {
  return /^\/app\/preptest\/[^/]+$/.test(pathname)
}

export function rewriteLegacyPrepTestPath(pathname: string, search = ""): string {
  if (pathname === LEGACY_PREPTEST_PREFIX || pathname.startsWith(`${LEGACY_PREPTEST_PREFIX}/`)) {
    const suffix = pathname.slice(LEGACY_PREPTEST_PREFIX.length)
    return `${PREPTEST_LIST_HREF}${suffix}${search}`
  }
  return `${pathname}${search}`
}

/** Sidebar / breadcrumb parent links should navigate even when already on a child route. */
export function shouldForceParentNav(pathname: string, href: string): boolean {
  return pathname !== href && pathname.startsWith(`${href}/`)
}
