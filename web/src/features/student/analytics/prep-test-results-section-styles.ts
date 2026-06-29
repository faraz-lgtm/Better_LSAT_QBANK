/** Figma `18644:33040` — prep test results page tokens */

/** Figma `18644:33040` — Primary/0 page canvas behind white surfaces */
const PT_RESULTS_PAGE_BG_CLASS = "bg-[#f3f7ff]"

/** Figma `18644:33040` — 24px vertical rhythm between major blocks */
const PT_RESULTS_PAGE_GAP_CLASS = "flex flex-col gap-[24px]"

/** Figma `18644:33809` — hero card: title, actions, score + results-by-section */
const PT_RESULTS_HERO_CARD_CLASS =
  "flex w-full flex-col gap-[24px] overflow-hidden rounded-[24px] border border-[#dfe1e7] bg-white p-[24px]"

/** Figma `18644:33827` — Primary/0 panel behind section summary cards */
const PT_RESULTS_BY_SECTION_PANEL_CLASS =
  "flex min-h-[316px] min-w-0 w-full flex-col gap-[18px] rounded-[16px] bg-[#f3f7ff] p-[24px] lg:w-[918px] lg:shrink-0"

/** Figma `18644:33834` — secondary white surface (total questions, about, etc.) */
const PT_RESULTS_SURFACE_CARD_CLASS =
  "overflow-hidden rounded-[16px] border border-[#dfe1e7] bg-white"

/** Figma `18644:33810` — score column + results-by-section row (290 + 24 + 918) */
const PT_RESULTS_SUMMARY_ROW_CLASS =
  "flex w-full max-w-[1232px] flex-col gap-[24px] lg:flex-row lg:items-start"

/** Figma `18644:33841` — section block: white surface + gray header + passage groups */
const PT_RESULTS_SECTION_BLOCK_CLASS =
  "flex flex-col gap-[24px] overflow-hidden rounded-[16px] border border-[#dfe1e7] bg-white p-[24px]"

const PT_RESULTS_SECTION_HEADER_CLASS = "rounded-[16px] bg-[#f6f8fa] px-[24px] py-4"

const PT_RESULTS_SECTION_CLASS =
  "overflow-hidden rounded-[16px] border border-[#dfe1e7] bg-white"

const PT_RESULTS_SECTION_BODY_CLASS = "flex flex-col gap-[24px] p-[24px]"

/** One grouped card: passage header + question rows */
const PT_RESULTS_CARD_CLASS =
  "overflow-hidden rounded-[16px] border border-[#dfe1e7] bg-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)]"

const PT_RESULTS_PASSAGE_HEADER_CLASS = "rounded-t-[24px] border border-b-0 border-[#dfe1e7] bg-[#f3f7ff] p-[24px]"

const PT_RESULTS_QUESTION_ROW_PAD_CLASS = "p-6"

const PT_RESULTS_QUESTION_ROW_BORDER_CLASS = "border-t border-[#dfe1e7]"

const PT_RESULTS_TAG_CLASS =
  "inline-flex h-5 items-center rounded-[16px] border border-[#dfe1e7] bg-[#f6f8fa] px-2 py-0.5 text-[10px] font-normal leading-[1.5] tracking-[0.02em] text-[#0d0d12]"

const PT_RESULTS_ACTION_BUTTON_CLASS =
  "flex size-9 items-center justify-center rounded-[10px] border border-[#dfe1e6] bg-[#f9f9fb] text-[#666d80] transition-colors hover:bg-white"

const PT_RESULTS_PASSAGE_BADGE_CLASS =
  "flex size-14 shrink-0 items-center justify-center rounded-[14px] border border-[#0d47a1] bg-[#f3f7ff]"

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
