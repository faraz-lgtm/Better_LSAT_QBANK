/** Figma `18644:33040` / dark `20645` — prep test results page tokens */

/** Page canvas behind elevated surfaces */
const PT_RESULTS_PAGE_BG_CLASS = "bg-[var(--background)]"

/** Figma `18644:33040` — 24px vertical rhythm between major blocks */
const PT_RESULTS_PAGE_GAP_CLASS = "flex flex-col gap-[24px]"

/** Figma `18644:33809` — hero card: title, actions, score + results-by-section */
const PT_RESULTS_HERO_CARD_CLASS =
  "flex w-full flex-col gap-[24px] overflow-hidden rounded-[24px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-[24px]"

/** Figma `18644:33827` — panel behind section summary cards */
const PT_RESULTS_BY_SECTION_PANEL_CLASS =
  "flex min-h-[316px] min-w-0 w-full flex-col gap-[18px] rounded-[16px] bg-[var(--primary-0)] p-[24px] lg:w-[918px] lg:shrink-0"

/** Figma `18644:33834` — secondary elevated surface (total questions, about, etc.) */
const PT_RESULTS_SURFACE_CARD_CLASS =
  "overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)]"

/** Figma `18644:33810` — score column + results-by-section row (290 + 24 + 918) */
const PT_RESULTS_SUMMARY_ROW_CLASS =
  "flex w-full max-w-[1232px] flex-col gap-[24px] lg:flex-row lg:items-start"

/** Figma `18644:33841` — section block: elevated surface + gray header + passage groups */
const PT_RESULTS_SECTION_BLOCK_CLASS =
  "flex flex-col gap-[24px] overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-[24px]"

const PT_RESULTS_SECTION_HEADER_CLASS = "rounded-[16px] bg-[var(--greyscale-25)] px-[24px] py-4"

const PT_RESULTS_SECTION_CLASS =
  "overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)]"

const PT_RESULTS_SECTION_BODY_CLASS = "flex flex-col gap-[24px] p-[24px]"

/** Passage + question result rows — equal columns that shrink instead of scrolling. */
const PT_RESULTS_DETAIL_ROW_CLASS = "flex w-full min-w-0 max-w-full items-start gap-6"

const PT_RESULTS_DETAIL_GRID_CLASS =
  "grid min-w-0 flex-1 grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1.25fr)_auto] items-start gap-x-6 gap-y-4"

/** One grouped card: passage header + question rows */
const PT_RESULTS_CARD_CLASS =
  "overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)]"

const PT_RESULTS_PASSAGE_HEADER_CLASS =
  "rounded-t-[24px] border border-b-0 border-[var(--greyscale-100)] bg-[var(--primary-0)] p-[24px]"

const PT_RESULTS_QUESTION_ROW_PAD_CLASS = "p-6"

const PT_RESULTS_QUESTION_ROW_BORDER_CLASS = "border-t border-[var(--greyscale-100)]"

const PT_RESULTS_TAG_CLASS =
  "inline-flex h-5 items-center rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-2 py-0.5 text-[10px] font-normal leading-[1.5] tracking-[0.02em] text-[var(--color-student-heading)]"

const PT_RESULTS_ACTION_BUTTON_CLASS =
  "flex size-9 items-center justify-center rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] text-[var(--greyscale-500)] transition-colors hover:bg-[var(--greyscale-0)]"

const PT_RESULTS_PASSAGE_BADGE_CLASS =
  "flex size-14 shrink-0 items-center justify-center rounded-[14px] border border-[var(--primary)] bg-[var(--primary-0)]"

const PT_RESULTS_QUESTION_BADGE_CORRECT_CLASS =
  "flex size-14 shrink-0 items-center justify-center rounded-[14px] bg-[#00bc54]"

const PT_RESULTS_QUESTION_BADGE_INCORRECT_CLASS =
  "flex size-14 shrink-0 items-center justify-center rounded-[14px] bg-[#df1c41]"

const PT_RESULTS_QUESTION_BADGE_UNANSWERED_CLASS =
  "flex size-14 shrink-0 items-center justify-center rounded-[14px] bg-[#ff6683]"

export {
  PT_RESULTS_ACTION_BUTTON_CLASS,
  PT_RESULTS_BY_SECTION_PANEL_CLASS,
  PT_RESULTS_CARD_CLASS,
  PT_RESULTS_DETAIL_GRID_CLASS,
  PT_RESULTS_DETAIL_ROW_CLASS,
  PT_RESULTS_HERO_CARD_CLASS,
  PT_RESULTS_PAGE_BG_CLASS,
  PT_RESULTS_PAGE_GAP_CLASS,
  PT_RESULTS_PASSAGE_BADGE_CLASS,
  PT_RESULTS_PASSAGE_HEADER_CLASS,
  PT_RESULTS_QUESTION_BADGE_CORRECT_CLASS,
  PT_RESULTS_QUESTION_BADGE_INCORRECT_CLASS,
  PT_RESULTS_QUESTION_BADGE_UNANSWERED_CLASS,
  PT_RESULTS_QUESTION_ROW_BORDER_CLASS,
  PT_RESULTS_QUESTION_ROW_PAD_CLASS,
  PT_RESULTS_SECTION_BLOCK_CLASS,
  PT_RESULTS_SECTION_BODY_CLASS,
  PT_RESULTS_SECTION_CLASS,
  PT_RESULTS_SECTION_HEADER_CLASS,
  PT_RESULTS_SUMMARY_ROW_CLASS,
  PT_RESULTS_SURFACE_CARD_CLASS,
  PT_RESULTS_TAG_CLASS,
}
