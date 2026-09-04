/** Figma `20268:103207` — review drawer shell */
const PRACTICE_SESSION_REVIEW_PANEL_CLASS =
  "practice-session-review-panel absolute inset-x-0 bottom-0 z-20 flex h-[512px] max-h-[min(512px,75vh)] flex-col overflow-hidden rounded-t-[32px] bg-[var(--greyscale-0)] px-[72px] pt-16 shadow-[0px_-8px_24px_rgba(13,13,18,0.08)]"

const PRACTICE_SESSION_REVIEW_PANEL_HEADER_CLASS = "flex shrink-0 items-center justify-between"

const PRACTICE_SESSION_REVIEW_PANEL_TITLE_CLASS =
  "text-[24px] font-bold leading-[1.3] text-[var(--color-student-heading)]"

const PRACTICE_SESSION_REVIEW_PANEL_CLOSE_BUTTON_CLASS =
  "inline-flex size-6 shrink-0 items-center justify-center text-[var(--greyscale-500)] transition hover:opacity-80"

const PRACTICE_SESSION_REVIEW_PANEL_FILTERS_CLASS =
  "mt-[31px] flex shrink-0 flex-wrap items-center gap-[26px]"

const PRACTICE_SESSION_REVIEW_PANEL_FILTER_ITEM_CLASS =
  "inline-flex items-center gap-2 text-sm font-medium leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]"

const PRACTICE_SESSION_REVIEW_PANEL_FILTER_BOX_CLASS =
  "inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-[6px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)]"

const PRACTICE_SESSION_REVIEW_PANEL_FILTER_BOX_CHECKED_CLASS =
  "border-[var(--primary)] bg-[var(--primary)] text-white"

/** Figma `20268:103220` — 16×100px tiles, 12px columns, 24px rows */
const PRACTICE_SESSION_REVIEW_PANEL_GRID_CLASS =
  "practice-session-review-panel__grid mt-6 flex min-h-0 flex-1 flex-wrap content-start gap-x-3 gap-y-6 overflow-y-auto pb-8"

const PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_CLASS =
  "practice-session-review-panel__question-btn box-border inline-flex h-[54px] w-[100px] shrink-0 items-center justify-center rounded-[4px] p-px text-[18px] font-semibold leading-[1.4] tracking-[0.36px] transition-colors"

const PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_ACTIVE_CLASS =
  "border border-[var(--primary)] bg-[var(--primary-25)] text-[var(--primary)]"

const PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_ANSWERED_CLASS =
  "border border-[var(--primary-border)] bg-[var(--primary)] text-[var(--primary-0)]"

const PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_DEFAULT_CLASS =
  "border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-[var(--color-student-heading)] hover:bg-[var(--greyscale-25)]"

const PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_FLAGGED_CLASS =
  "flex-col gap-0.5"

export {
  PRACTICE_SESSION_REVIEW_PANEL_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_CLOSE_BUTTON_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FILTER_BOX_CHECKED_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FILTER_BOX_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FILTER_ITEM_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_FILTERS_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_GRID_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_HEADER_CLASS,
  PRACTICE_SESSION_REVIEW_PANEL_TITLE_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_ACTIVE_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_ANSWERED_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_DEFAULT_CLASS,
  PRACTICE_SESSION_REVIEW_QUESTION_BUTTON_FLAGGED_CLASS,
}
