/** Figma `18617:35728` — blind review session tokens */

/** Figma `18617:35729` — header band height */
const BLIND_REVIEW_HEADER_HEIGHT_PX = 102
/** Figma `18617:35728` — gap below header before white card (132 − 102) */
const BLIND_REVIEW_SHELL_GAP_PX = 30
/** Figma `18617:35728` — page margin below white card */
const BLIND_REVIEW_SHELL_BOTTOM_PX = 49
/** Figma `18617:35757` — white card height at 924px viewport */
const BLIND_REVIEW_CARD_HEIGHT_PX = 743
/** Figma `18617:35757` — card top offset (header + gap) */
const BLIND_REVIEW_CARD_TOP_PX = BLIND_REVIEW_HEADER_HEIGHT_PX + BLIND_REVIEW_SHELL_GAP_PX

/** Figma `18617:35728` — full-height shell; header + card are absolutely positioned */
const BLIND_REVIEW_SHELL_CLASS =
  "relative mx-auto h-full min-h-0 w-full flex-1 px-4 md:px-6"

/** Figma `18617:35729` — header band with bottom rule */
const BLIND_REVIEW_HEADER_CLASS =
  "practice-session-header absolute inset-x-0 top-0 z-10 box-border flex h-[102px] shrink-0 items-center border-b border-[#dfe1e7] bg-[#f5f9ff] px-4 py-4 md:px-6"

/** Figma `18617:35757` — white card anchored 30px below header, 49px above viewport bottom */
const BLIND_REVIEW_CARD_CLASS =
  "practice-session-card practice-session-card--blind-review absolute bottom-[49px] left-4 right-4 top-[132px] mx-auto flex min-h-0 w-full max-w-[1280px] flex-col gap-[24px] rounded-[16px] bg-white shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)] md:left-6 md:right-6"

/** Figma `18617:33486` — body fills card; 24px gap to footer is on the card */
const BLIND_REVIEW_BODY_CLASS =
  "practice-session-body flex min-h-0 flex-1 flex-col overflow-hidden"

/** Figma `18617:33486` — flush to card top; 24px side inset; columns stretch to footer gap */
const BLIND_REVIEW_BODY_GRID_CLASS =
  "grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-[24px] px-6 pt-0 lg:grid-cols-[minmax(0,584px)_minmax(0,1fr)]"

const BLIND_REVIEW_COLUMN_PANEL_BASE_CLASS =
  "practice-session-pane practice-session-pane--br-column min-h-0 rounded-[16px] border border-[#e5e7eb] bg-white"

const BLIND_REVIEW_PASSAGE_PANEL_CLASS = `${BLIND_REVIEW_COLUMN_PANEL_BASE_CLASS} h-full p-6`

const BLIND_REVIEW_QUESTION_PANEL_CLASS =
  `${BLIND_REVIEW_COLUMN_PANEL_BASE_CLASS} flex h-full flex-col overflow-hidden`

/** Notes open — stacked passage / question column */
const BLIND_REVIEW_NOTES_LAYOUT_CLASS =
  "flex min-h-0 flex-1 gap-5 overflow-visible px-6 pt-0"

const BLIND_REVIEW_NOTES_STACK_CLASS = "practice-session-br-notes-stack min-h-0 min-w-0 flex-1"

const BLIND_REVIEW_NOTES_PASSAGE_PANEL_CLASS =
  `${BLIND_REVIEW_COLUMN_PANEL_BASE_CLASS} practice-session-br-notes-pane practice-session-scroll-hidden px-8 pb-8 pt-8`

const BLIND_REVIEW_NOTES_QUESTION_PANEL_CLASS =
  `${BLIND_REVIEW_COLUMN_PANEL_BASE_CLASS} flex min-h-0 flex-col overflow-hidden`

const BLIND_REVIEW_NOTES_SIDEBAR_CLASS =
  `${BLIND_REVIEW_COLUMN_PANEL_BASE_CLASS} flex h-full min-h-0 w-[451px] shrink-0 flex-col overflow-hidden`

const BLIND_REVIEW_PASSAGE_TEXT_CLASS =
  "text-base font-normal leading-[26px] tracking-[0.02em] text-[#0d0d12]"

const BLIND_REVIEW_QUESTION_STEM_CLASS =
  "text-lg font-medium leading-[1.4] tracking-[0.36px] text-[#0d0d12]"

const BLIND_REVIEW_QUESTION_NUMBER_CLASS =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-[14px] border-2 border-[#ff6f00] bg-white text-lg font-bold text-[#ff6f00] shadow-[0px_0px_5px_#ff6f00]"

const BLIND_REVIEW_RECOMMENDED_BADGE_CLASS =
  "inline-flex h-8 items-center rounded-[16px] px-4 text-xs font-medium tracking-[0.24px] text-[#ff6f00]"

const BLIND_REVIEW_OPTIONS_LIST_CLASS = "flex flex-col gap-3 p-6"

/** Figma `18617:33677` — footer band */
const BLIND_REVIEW_FOOTER_CLASS =
  "practice-session-footer box-border flex min-h-[76px] shrink-0 flex-col justify-center border-t border-[#dfe1e7] bg-[#f6f8fa] px-6 py-3"

/** Nav pills wrap to the next line; arrows stay on the right */
const BLIND_REVIEW_FOOTER_ROW_CLASS =
  "flex w-full min-w-0 items-center justify-between gap-4"

const BLIND_REVIEW_FOOTER_NAV_CLASS =
  "practice-session-question-nav-grid min-h-[48px] min-w-0 flex-1"

/** Figma `18617:33695` — prev/next controls */
const BLIND_REVIEW_NAV_ARROW_BUTTON_CLASS =
  "box-border inline-flex size-[52px] shrink-0 items-center justify-center rounded-[16px] border-2 border-solid border-[#dfe1e7] bg-[#f6f8fa] p-1 shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition hover:bg-white disabled:opacity-40"

/** Figma `18617:33677` — recommended-for-BR nav pill glow */
const BLIND_REVIEW_QUESTION_NAV_RECOMMENDED_CLASS = "drop-shadow-[0px_0px_5px_#ff6f00]"

const BLIND_REVIEW_NAV_ARROW_GROUP_CLASS = "flex shrink-0 items-center gap-4 self-center"

/** Figma `18617:33481` — Notes closed */
const BLIND_REVIEW_HEADER_NOTES_BUTTON_CLASS =
  "box-border inline-flex h-[52px] shrink-0 items-center gap-2 rounded-[16px] border border-solid border-[#dfe1e7] bg-white px-3 py-2 text-base font-medium leading-normal tracking-[0.32px] text-[#666d80] transition-colors hover:bg-[#f6f8fa] disabled:cursor-not-allowed disabled:opacity-45"

/** Figma `18617:33760` — Notes open */
const BLIND_REVIEW_HEADER_NOTES_BUTTON_ACTIVE_CLASS =
  "border-[#0d47a1] bg-[#edf3ff] text-[#0d47a1]"

/** Figma `18617:33484` — Exit Section */
const BLIND_REVIEW_HEADER_EXIT_BUTTON_CLASS =
  "box-border inline-flex h-[52px] shrink-0 items-center justify-center rounded-[16px] border border-solid border-[#dfe1e7] bg-white px-3 py-2 text-base font-medium leading-normal tracking-[0.32px] text-[#062357] transition hover:bg-[#f6f8fa] disabled:opacity-50"

/** Figma `18617:33464` / `18617:33586` — section selector (123×36 closed) */
const BLIND_REVIEW_SECTION_SELECT_MIN_WIDTH_PX = 123

const BLIND_REVIEW_SECTION_SELECT_TRIGGER_CLASS =
  "inline-flex h-9 min-w-[123px] items-center gap-2 rounded-[16px] border border-[#dfe1e7] bg-white py-1.5 pl-3 pr-3 text-base font-medium leading-6 tracking-[0.32px] text-[#062357] transition-colors hover:bg-[#f6f8fa]"

const BLIND_REVIEW_SECTION_SELECT_MENU_CLASS =
  "absolute left-0 top-full z-[110] mt-2 min-w-full overflow-hidden rounded-[16px] border border-[#dfe1e7] bg-white p-1 shadow-[0px_24px_24px_rgba(13,13,18,0.12)]"

/** Figma `18617:33893` — blind review notes / prep-test landing */
const BLIND_REVIEW_NOTES_PAGE_CLASS = "bg-[#f5f9ff]"

const BLIND_REVIEW_NOTES_HEADER_CLASS =
  "flex w-full items-center justify-between border-b border-[#dfe1e7] py-4"

const BLIND_REVIEW_NOTES_PT_LABEL_CLASS =
  "text-xl font-bold leading-[1.35] text-[#062357]"

const BLIND_REVIEW_NOTES_BADGE_BLIND_CLASS =
  "inline-flex h-6 items-center gap-1 rounded-full bg-[#fff3ea] px-4 py-0.5 text-xs font-medium tracking-[0.24px] text-[#ff6f00]"

const BLIND_REVIEW_NOTES_BADGE_ACTUAL_CLASS =
  "inline-flex h-6 items-center rounded-full bg-[#fff6e0] px-4 py-1 text-xs font-medium tracking-[0.24px] text-[#956321]"

const BLIND_REVIEW_NOTES_CARD_CLASS =
  "flex w-full flex-col gap-6 rounded-[24px] border border-[#dfe1e7] bg-white p-6"

const BLIND_REVIEW_NOTES_SECTION_CARD_CLASS =
  "flex h-[100px] items-center gap-6 rounded-[16px] border border-[#dfe1e7] bg-white px-6 py-3 shadow-[0px_1px_1.5px_rgba(13,13,18,0.05),0px_1px_1px_rgba(13,13,18,0.04)]"

const BLIND_REVIEW_NOTES_SECTION_TITLE_ACTIVE_CLASS =
  "text-2xl font-bold leading-[1.3] text-[#0d47a1]"

const BLIND_REVIEW_NOTES_SECTION_TITLE_MUTED_CLASS =
  "text-2xl font-bold leading-[1.3] text-[#a4acb9]"

const BLIND_REVIEW_NOTES_SECTION_SUBTITLE_ACTIVE_CLASS =
  "text-sm font-normal leading-normal tracking-[0.28px] text-[#666d80]"

const BLIND_REVIEW_NOTES_SECTION_SUBTITLE_MUTED_CLASS =
  "text-sm font-normal leading-normal tracking-[0.28px] text-[#a4acb9]"

const BLIND_REVIEW_NOTES_START_BUTTON_CLASS = "ds-btn h-[52px] shrink-0 gap-2 px-4 text-base tracking-[0.32px]"

const BLIND_REVIEW_NOTES_BACK_BUTTON_CLASS =
  "inline-flex h-[52px] shrink-0 items-center justify-center rounded-[16px] px-4 text-base font-semibold tracking-[0.32px] text-[#0d47a1] transition-colors hover:underline"

export {
  BLIND_REVIEW_BODY_CLASS,
  BLIND_REVIEW_BODY_GRID_CLASS,
  BLIND_REVIEW_CARD_CLASS,
  BLIND_REVIEW_CARD_HEIGHT_PX,
  BLIND_REVIEW_CARD_TOP_PX,
  BLIND_REVIEW_FOOTER_CLASS,
  BLIND_REVIEW_FOOTER_NAV_CLASS,
  BLIND_REVIEW_FOOTER_ROW_CLASS,
  BLIND_REVIEW_HEADER_CLASS,
  BLIND_REVIEW_HEADER_EXIT_BUTTON_CLASS,
  BLIND_REVIEW_HEADER_HEIGHT_PX,
  BLIND_REVIEW_HEADER_NOTES_BUTTON_CLASS,
  BLIND_REVIEW_HEADER_NOTES_BUTTON_ACTIVE_CLASS,
  BLIND_REVIEW_NAV_ARROW_BUTTON_CLASS,
  BLIND_REVIEW_NAV_ARROW_GROUP_CLASS,
  BLIND_REVIEW_NOTES_BACK_BUTTON_CLASS,
  BLIND_REVIEW_NOTES_BADGE_ACTUAL_CLASS,
  BLIND_REVIEW_NOTES_BADGE_BLIND_CLASS,
  BLIND_REVIEW_NOTES_CARD_CLASS,
  BLIND_REVIEW_NOTES_HEADER_CLASS,
  BLIND_REVIEW_NOTES_PAGE_CLASS,
  BLIND_REVIEW_NOTES_PT_LABEL_CLASS,
  BLIND_REVIEW_NOTES_SECTION_CARD_CLASS,
  BLIND_REVIEW_NOTES_SECTION_SUBTITLE_ACTIVE_CLASS,
  BLIND_REVIEW_NOTES_SECTION_SUBTITLE_MUTED_CLASS,
  BLIND_REVIEW_NOTES_SECTION_TITLE_ACTIVE_CLASS,
  BLIND_REVIEW_NOTES_SECTION_TITLE_MUTED_CLASS,
  BLIND_REVIEW_NOTES_LAYOUT_CLASS,
  BLIND_REVIEW_NOTES_PASSAGE_PANEL_CLASS,
  BLIND_REVIEW_NOTES_QUESTION_PANEL_CLASS,
  BLIND_REVIEW_NOTES_SIDEBAR_CLASS,
  BLIND_REVIEW_NOTES_STACK_CLASS,
  BLIND_REVIEW_NOTES_START_BUTTON_CLASS,
  BLIND_REVIEW_OPTIONS_LIST_CLASS,
  BLIND_REVIEW_PASSAGE_PANEL_CLASS,
  BLIND_REVIEW_PASSAGE_TEXT_CLASS,
  BLIND_REVIEW_QUESTION_PANEL_CLASS,
  BLIND_REVIEW_QUESTION_NAV_RECOMMENDED_CLASS,
  BLIND_REVIEW_QUESTION_NUMBER_CLASS,
  BLIND_REVIEW_QUESTION_STEM_CLASS,
  BLIND_REVIEW_RECOMMENDED_BADGE_CLASS,
  BLIND_REVIEW_SECTION_SELECT_MENU_CLASS,
  BLIND_REVIEW_SECTION_SELECT_MIN_WIDTH_PX,
  BLIND_REVIEW_SECTION_SELECT_TRIGGER_CLASS,
  BLIND_REVIEW_SHELL_CLASS,
  BLIND_REVIEW_SHELL_BOTTOM_PX,
  BLIND_REVIEW_SHELL_GAP_PX,
}
