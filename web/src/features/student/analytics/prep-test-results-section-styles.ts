/** Figma `18942:44492` — prep test results section list */

const PT_RESULTS_SECTION_CLASS =
  "mb-6 overflow-hidden rounded-[16px] border border-[#dfe1e7] bg-white"

const PT_RESULTS_SECTION_BODY_CLASS = "flex flex-col gap-6 p-6"

/** One grouped card: passage header + question rows */
const PT_RESULTS_CARD_CLASS =
  "overflow-hidden rounded-[16px] border border-[#dfe1e7] bg-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)]"

const PT_RESULTS_PASSAGE_HEADER_CLASS = "bg-[#f3f7ff] p-6"

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

export {
  PT_RESULTS_ACTION_BUTTON_CLASS,
  PT_RESULTS_CARD_CLASS,
  PT_RESULTS_PASSAGE_BADGE_CLASS,
  PT_RESULTS_PASSAGE_HEADER_CLASS,
  PT_RESULTS_QUESTION_BADGE_CORRECT_CLASS,
  PT_RESULTS_QUESTION_BADGE_INCORRECT_CLASS,
  PT_RESULTS_QUESTION_ROW_BORDER_CLASS,
  PT_RESULTS_QUESTION_ROW_PAD_CLASS,
  PT_RESULTS_SECTION_BODY_CLASS,
  PT_RESULTS_SECTION_CLASS,
  PT_RESULTS_TAG_CLASS,
}
