/** Figma `18790:29610` — review drawer shell */
const PRACTICE_SESSION_REVIEW_PANEL_CLASS =
  "practice-session-review-panel absolute inset-x-0 bottom-0 z-20 flex max-h-[min(420px,55vh)] flex-col rounded-t-[16px] border-t border-[#dfe1e7] bg-white shadow-[0px_-8px_24px_rgba(13,13,18,0.08)]"

const PRACTICE_SESSION_REVIEW_PANEL_HEADER_CLASS =
  "flex shrink-0 items-center justify-between px-6 pb-3 pt-5"

const PRACTICE_SESSION_REVIEW_PANEL_TITLE_CLASS =
  "text-xl font-bold leading-[1.35] tracking-[0.4px] text-[#062357]"

const PRACTICE_SESSION_REVIEW_PANEL_CLOSE_BUTTON_CLASS =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-[#dfe1e7] bg-white text-[#666d80] transition hover:bg-[#f6f8fa] hover:text-[#062357]"

const PRACTICE_SESSION_REVIEW_PANEL_FILTERS_CLASS =
  "flex shrink-0 flex-wrap items-center gap-6 px-6 pb-4"

const PRACTICE_SESSION_REVIEW_PANEL_FILTER_ITEM_CLASS =
  "inline-flex items-center gap-2 text-sm font-medium tracking-[0.28px] text-[#666d80]"

const PRACTICE_SESSION_REVIEW_PANEL_FILTER_BOX_CLASS =
  "inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-[#c5d9f5] bg-[#edf3ff]"

const PRACTICE_SESSION_REVIEW_PANEL_FILTER_BOX_CHECKED_CLASS =
  "border-[#0d47a1] bg-[#0d47a1] text-white"

const PRACTICE_SESSION_REVIEW_PANEL_GRID_CLASS =
  "practice-session-review-panel__grid min-h-0 flex-1 overflow-y-auto px-6 pb-4"

const PRACTICE_SESSION_REVIEW_PANEL_FOOTER_CLASS =
  "flex shrink-0 items-center justify-center border-t border-[#dfe1e7] bg-white px-6 py-3"

const PRACTICE_SESSION_REVIEW_PANEL_FOOTER_CLUSTER_CLASS =
  "flex min-w-0 max-w-full items-center gap-3"

const PRACTICE_SESSION_REVIEW_PANEL_FOOTER_PAGES_CLASS =
  "practice-session-scroll-hidden flex min-h-9 min-w-0 max-w-full flex-nowrap items-center justify-center gap-2 overflow-x-auto"

/** Figma `18790:29610` — grid question cell */
const PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_CLASS =
  "practice-session-review-panel__question-btn box-border inline-flex h-10 w-full min-w-0 items-center justify-center rounded-[4px] text-sm font-semibold leading-none tracking-[0.28px] transition-colors"

const PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_ACTIVE_CLASS =
  "border border-[#0d47a1] bg-[#edf3ff] text-[#0d47a1]"

const PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_ANSWERED_CLASS =
  "border border-[#0d47a1] bg-[#0d47a1] text-white"

const PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_DEFAULT_CLASS =
  "border border-[#dfe1e7] bg-white text-[#062357]"

const PRACTICE_SESSION_REVIEW_PAGE_BUTTON_CLASS =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-[8px] text-sm font-semibold leading-none tracking-[0.28px] transition-colors"

const PRACTICE_SESSION_REVIEW_PAGE_BUTTON_ACTIVE_CLASS =
  "border border-[#0d47a1] bg-[#0d47a1] text-white"

const PRACTICE_SESSION_REVIEW_PAGE_BUTTON_ANSWERED_CLASS =
  "border border-[#0d47a1] bg-white text-[#062357]"

const PRACTICE_SESSION_REVIEW_PAGE_BUTTON_DEFAULT_CLASS =
  "border border-[#dfe1e7] bg-[#f6f8fa] text-[#666d80]"

const PRACTICE_SESSION_REVIEW_QUESTIONS_PER_PAGE = 25

export {
  PRACTICE_SESSION_REVIEW_PAGE_BUTTON_ACTIVE_CLASS,
  PRACTICE_SESSION_REVIEW_PAGE_BUTTON_ANSWERED_CLASS,
  PRACTICE_SESSION_REVIEW_PAGE_BUTTON_CLASS,
  PRACTICE_SESSION_REVIEW_PAGE_BUTTON_DEFAULT_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_CLOSE_BUTTON_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FILTER_BOX_CHECKED_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FILTER_BOX_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FILTER_ITEM_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FILTERS_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FOOTER_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FOOTER_CLUSTER_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FOOTER_PAGES_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_GRID_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_HEADER_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_TITLE_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_ACTIVE_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_ANSWERED_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_DEFAULT_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTIONS_PER_PAGE,
}
