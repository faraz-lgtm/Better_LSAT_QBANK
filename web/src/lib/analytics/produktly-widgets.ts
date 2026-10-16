/** Produktly dashboard → Feedback collectors → edit/2722 */
export const PRODUKTLY_FEEDBACK_WIDGET_ID = 2722

/**
 * Produktly dashboard → Product tours → edit/11289
 *
 * CSS selectors (set these in the tour step editor after deploy):
 * - Step 1 (logo):            [data-tour-target="sidebar-brand"]
 * - Step 2 (menu):            [data-tour-target="sidebar-menu"]
 * - Step 7 (Explanations):    [data-tour-target="nav-explanations"]
 * - Step 15 (Active Drills):  [data-tour-target="dashboard-active-drills"]
 * - Step 16 (drill difficulty): [data-tour-target="dashboard-drill-difficulty"]
 *
 * Do not use full Tailwind class chains (e.g. border-[color:var(...)]) — they break
 * the spotlight and can cover half the viewport.
 */
const DEFAULT_PRODUCT_TOUR_ID = 11289
const envTourId = Number(
  (import.meta.env.VITE_PRODUKTLY_PRODUCT_TOUR_ID as string | undefined)?.trim() ?? "",
)
export const PRODUKTLY_PRODUCT_TOUR_ID =
  Number.isFinite(envTourId) && envTourId > 0 ? envTourId : DEFAULT_PRODUCT_TOUR_ID

/** Produktly dashboard → Roadmaps → edit/2445 */
export const PRODUKTLY_ROADMAP_EDIT_ID = 2445

/** Public share id for roadmap 2445 */
export const PRODUKTLY_ROADMAP_PUBLIC_ID = "3aea45a5-bef2-41f1-a448-4d1ce0589b4b"

const DEFAULT_ROADMAP_PUBLIC_URL = `https://produktly.com/roadmap/produktly/${PRODUKTLY_ROADMAP_PUBLIC_ID}`

const envRoadmapUrl = (import.meta.env.VITE_PRODUKTLY_ROADMAP_URL as string | undefined)?.trim()

/** Hosted public roadmap URL for iframe embed. */
export const PRODUKTLY_ROADMAP_PUBLIC_URL =
  envRoadmapUrl && envRoadmapUrl.length > 0 ? envRoadmapUrl : DEFAULT_ROADMAP_PUBLIC_URL

/** True when the configured URL still uses the numeric edit id (public API returns 404). */
export function isProduktlyRoadmapEditIdUrl(url: string): boolean {
  return /\/roadmap\/produktly\/2445\/?$/.test(url.trim())
}
