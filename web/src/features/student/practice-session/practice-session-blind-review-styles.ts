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

/** Figma `20645:49778` — Primary `#121A26` shell behind elevated Neutral-0 chrome */
const BLIND_REVIEW_SHELL_CLASS = "relative h-full min-h-0 w-full flex-1 bg-[var(--background)]"

/** Legacy header band (unused by Figma exam chrome; kept for exports) */
const BLIND_REVIEW_HEADER_CLASS =
  "practice-session-header absolute inset-x-0 top-0 z-10 box-border flex h-[102px] shrink-0 items-center border-b border-[var(--greyscale-50)] bg-[var(--greyscale-0)] px-4 py-4 md:px-6"

/** Figma `20645:49778` — elevated Neutral-0 content surface */
const BLIND_REVIEW_CARD_CLASS =
  "practice-session-card practice-session-card--blind-review absolute inset-x-0 bottom-0 top-[100px] flex min-h-0 flex-col bg-[var(--greyscale-0)]"

/** Figma `20645:49778` — body fills elevated surface */
const BLIND_REVIEW_BODY_CLASS =
  "practice-session-body flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--greyscale-0)] text-[var(--color-student-heading)]"

/** Figma `20596:144371` — passage | question split with center divider */
const BLIND_REVIEW_BODY_GRID_CLASS =
  "grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-0 px-10 pb-5 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"

const BLIND_REVIEW_COLUMN_PANEL_BASE_CLASS =
  "practice-session-pane practice-session-pane--br-column min-h-0 bg-[var(--greyscale-0)]"

const BLIND_REVIEW_PASSAGE_PANEL_CLASS =
  `${BLIND_REVIEW_COLUMN_PANEL_BASE_CLASS} h-full overflow-y-auto py-2 pr-6 lg:border-r lg:border-[var(--greyscale-50)] dark:lg:border-[var(--greyscale-600)] lg:pr-10`

const BLIND_REVIEW_QUESTION_PANEL_CLASS =
  `${BLIND_REVIEW_COLUMN_PANEL_BASE_CLASS} practice-session-pane--br-question relative flex h-full flex-col overflow-visible py-2 pl-0 lg:pl-10`

/** Notes open — Figma `20596:145049`: passage | question (+ side widget) | notes */
const BLIND_REVIEW_NOTES_LAYOUT_CLASS =
  "grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-4 px-6 pb-5 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(300px,426px)] lg:gap-5 lg:overflow-hidden"

const BLIND_REVIEW_NOTES_STACK_CLASS = "practice-session-br-notes-stack"

const BLIND_REVIEW_NOTES_PASSAGE_PANEL_CLASS =
  `${BLIND_REVIEW_COLUMN_PANEL_BASE_CLASS} practice-session-br-notes-pane practice-session-scroll-hidden min-h-0 overflow-y-auto px-2 py-2 lg:pr-4`

const BLIND_REVIEW_NOTES_QUESTION_PANEL_CLASS =
  `${BLIND_REVIEW_COLUMN_PANEL_BASE_CLASS} practice-session-pane--br-question relative flex min-h-0 flex-col overflow-visible px-2 py-2 lg:pl-2 lg:pr-14`

const BLIND_REVIEW_NOTES_SIDEBAR_CLASS =
  `${BLIND_REVIEW_COLUMN_PANEL_BASE_CLASS} flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-[18px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]`

const BLIND_REVIEW_PASSAGE_TEXT_CLASS =
  "text-base font-normal leading-[26px] tracking-[0.02em] text-[var(--color-student-heading)]"

const BLIND_REVIEW_QUESTION_STEM_WRAP_CLASS =
  "flex min-h-[56px] w-full min-w-0 items-center"

/** Figma `18617:35777` — 18px medium stem; size is forced in CSS so HTML content rules cannot shrink it */
const BLIND_REVIEW_QUESTION_STEM_CLASS =
  "practice-session-br-stem min-w-0 flex-1 font-medium text-[var(--color-student-heading)]"

const BLIND_REVIEW_QUESTION_NUMBER_CLASS =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-[14px] border-2 border-[var(--blind-review-accent)] bg-[var(--greyscale-0)] text-lg font-bold text-[var(--blind-review-accent)] shadow-[0px_0px_5px_var(--blind-review-accent)]"

const BLIND_REVIEW_RECOMMENDED_BADGE_CLASS =
  "inline-flex h-8 items-center text-xs font-bold tracking-[0.24px] text-[var(--blind-review-accent)]"

const BLIND_REVIEW_OPTIONS_LIST_CLASS =
  "practice-session-br-options flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-0 py-3"

/** Choice rows grow with wrapped copy; letter and hide control stay top-aligned. */
const BLIND_REVIEW_OPTION_ROW_INNER_CLASS =
  "flex items-start justify-between gap-4 py-3 pl-4 pr-4 text-left"

/** Selected answer while viewing timed/actual responses — Figma primary-25 + primary */
const BLIND_REVIEW_OPTION_ROW_SELECTED_ACTUAL_CLASS =
  "border border-[var(--primary)] bg-[var(--primary-25)] shadow-[0px_10px_15px_-3px_rgba(13,71,161,0.12),0px_4px_6px_-4px_rgba(13,71,161,0.08)]"

const BLIND_REVIEW_OPTION_LETTER_SELECTED_ACTUAL_CLASS =
  "bg-[var(--primary)] text-white shadow-[0px_10px_7px_rgba(13,71,161,0.12),0px_4px_3px_rgba(13,71,161,0.08)]"

/** Review chrome — correct answer highlight (Figma teal) */
const BLIND_REVIEW_OPTION_ROW_CORRECT_CLASS =
  "border border-[var(--explanation-teal)] bg-[var(--explanation-answered-bg)]"

const BLIND_REVIEW_OPTION_LETTER_CORRECT_CLASS =
  "bg-[var(--explanation-teal)] text-white"

/** Selected answer while in Blind Review — Figma `20645:49778` primary-25 + primary */
const BLIND_REVIEW_OPTION_ROW_SELECTED_BR_CLASS =
  "border border-[var(--primary)] bg-[var(--primary-25)] shadow-[0px_10px_15px_-3px_rgba(13,71,161,0.12),0px_4px_6px_-4px_rgba(13,71,161,0.08)]"

const BLIND_REVIEW_OPTION_LETTER_SELECTED_BR_CLASS =
  "bg-[var(--primary)] text-white shadow-[0px_10px_7px_rgba(13,71,161,0.12),0px_4px_3px_rgba(13,71,161,0.08)]"

/** Figma `20645:49778` — footer on elevated Neutral-0 */
const BLIND_REVIEW_FOOTER_CLASS =
  "practice-session-footer box-border flex min-h-[72px] shrink-0 flex-col justify-center border-t border-[var(--greyscale-50)] bg-[var(--greyscale-0)] px-2 py-3"

/** Nav pills wrap to the next line; arrows stay on the right */
const BLIND_REVIEW_FOOTER_ROW_CLASS =
  "flex w-full min-w-0 items-center justify-between gap-4"

const BLIND_REVIEW_FOOTER_NAV_CLASS =
  "practice-session-question-nav-grid min-h-[48px] min-w-0 flex-1"

/** Figma `20596:144371` — prev/next controls */
const BLIND_REVIEW_NAV_ARROW_BUTTON_CLASS =
  "box-border inline-flex size-7 shrink-0 items-center justify-center rounded-[6px] border border-solid border-[var(--greyscale-100)] bg-[var(--greyscale-25)] p-1 shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition hover:bg-[var(--greyscale-0)] disabled:opacity-40 dark:bg-[var(--greyscale-25)]"

/** Figma `18617:33677` — recommended-for-BR nav pill glow + peach border */
const BLIND_REVIEW_QUESTION_NAV_RECOMMENDED_CLASS =
  "border-[var(--blind-review-recommended-border)] drop-shadow-[0px_0px_5px_var(--blind-review-accent)]"

const BLIND_REVIEW_NAV_ARROW_GROUP_CLASS = "flex shrink-0 items-center gap-4 self-center"

/** Figma `18617:33481` — Notes closed — elevated Neutral-0 control on Primary chrome */
const BLIND_REVIEW_HEADER_NOTES_BUTTON_CLASS =
  "box-border inline-flex h-[52px] shrink-0 items-center gap-2 rounded-[16px] border border-solid border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-3 py-2 text-base font-medium leading-normal tracking-[0.32px] text-[var(--greyscale-500)] transition-colors hover:bg-[var(--greyscale-25)] disabled:cursor-not-allowed disabled:opacity-45"

/** Figma `18617:33760` — Notes open */
const BLIND_REVIEW_HEADER_NOTES_BUTTON_ACTIVE_CLASS =
  "border-[var(--primary)] bg-[var(--primary-25)] text-[var(--primary)]"

/** Figma `18617:33484` — Exit Section */
const BLIND_REVIEW_HEADER_EXIT_BUTTON_CLASS =
  "box-border inline-flex h-[52px] shrink-0 items-center justify-center rounded-[16px] border border-solid border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-3 py-2 text-base font-medium leading-normal tracking-[0.32px] text-[var(--color-student-heading)] transition hover:bg-[var(--greyscale-25)] disabled:opacity-50"

/** Figma `18617:33464` / `18617:33586` — section selector (123×36 closed) */
const BLIND_REVIEW_SECTION_SELECT_MIN_WIDTH_PX = 123

const BLIND_REVIEW_SECTION_SELECT_TRIGGER_CLASS =
  "inline-flex h-9 min-w-[123px] items-center gap-2 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] py-1.5 pl-3 pr-3 text-base font-medium leading-6 tracking-[0.32px] text-[var(--color-student-heading)] transition-colors hover:bg-[var(--greyscale-25)]"

const BLIND_REVIEW_SECTION_SELECT_MENU_CLASS =
  "absolute left-0 top-full z-[110] mt-2 min-w-full overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-1 shadow-[0px_24px_24px_rgba(13,13,18,0.12)]"

/** Figma `20321:55044` / `20344:55732` — post-results Review tester chrome */
const REVIEW_SHELL_CLASS = "relative h-full min-h-0 w-full flex-1 bg-[var(--background)]"

const REVIEW_CARD_CLASS =
  "practice-session-card practice-session-card--review absolute inset-x-0 bottom-0 top-[88px] flex min-h-0 flex-col bg-[var(--greyscale-0)]"

const REVIEW_BODY_CLASS =
  "practice-session-body flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--greyscale-0)]"

const REVIEW_BODY_GRID_CLASS =
  "grid min-h-0 min-w-0 flex-1 grid-cols-1 justify-center gap-[52px] px-[clamp(40px,10.25vw,197px)] pb-5 pt-9 lg:grid-cols-[minmax(0,736px)_minmax(0,736px)]"

/** Full-bleed review body (diagnostic review / tester). */
const REVIEW_BODY_GRID_FULL_CLASS =
  "grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-6 px-6 pb-5 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"

const REVIEW_SIDE_PANEL_LAYOUT_FULL_CLASS =
  "grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-6 px-6 pb-5 pt-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(300px,424px)]"

const REVIEW_SIDE_PANEL_LAYOUT_CLASS =
  "grid min-h-0 min-w-0 flex-1 grid-cols-1 justify-center gap-[52px] px-10 pb-5 pt-9 xl:grid-cols-[minmax(0,656px)_minmax(0,656px)_424px]"

const REVIEW_PASSAGE_PANEL_CLASS =
  "practice-session-pane practice-session-pane--review-column min-h-0 rounded-[18px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-6 py-9"

const REVIEW_QUESTION_PANEL_CLASS =
  "practice-session-pane practice-session-pane--review-column flex min-h-0 flex-col overflow-hidden rounded-[18px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-6 py-9"

const REVIEW_SIDEBAR_CLASS =
  "practice-session-pane--review-column flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-[18px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)]"

const REVIEW_FOOTER_CLASS =
  "practice-session-footer box-border flex min-h-[64px] shrink-0 items-center border-t border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-10 py-3"

const REVIEW_FOOTER_ROW_CLASS =
  "flex w-full min-w-0 items-center justify-between gap-4"

const REVIEW_FOOTER_NAV_CLASS =
  "practice-session-question-nav-grid practice-session-review-nav-row min-h-[51px] min-w-0 flex-1"

const REVIEW_NAV_ARROW_GROUP_CLASS = "flex shrink-0 items-center gap-4 self-center"

const REVIEW_NAV_ARROW_BUTTON_CLASS =
  "box-border inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-solid border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-1 shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition hover:bg-[var(--greyscale-25)] disabled:opacity-40"

const REVIEW_EXIT_BUTTON_CLASS =
  "box-border inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[10px] border border-solid border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-4 text-sm font-medium tracking-[0.28px] text-[var(--greyscale-500)] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition hover:bg-[var(--greyscale-25)] hover:text-[var(--color-student-heading)] disabled:opacity-50"

/** Figma `18617:33893` — blind review notes / prep-test landing */
const BLIND_REVIEW_NOTES_PAGE_CLASS = "bg-[var(--background)]"

const BLIND_REVIEW_NOTES_HEADER_CLASS =
  "flex w-full items-center justify-between border-b border-[var(--greyscale-100)] py-4"

const BLIND_REVIEW_NOTES_PT_LABEL_CLASS =
  "text-xl font-bold leading-[1.35] text-[var(--color-student-heading)]"

const BLIND_REVIEW_NOTES_BADGE_BLIND_CLASS =
  "inline-flex h-6 items-center gap-1 rounded-full bg-[var(--blind-review-badge-bg)] px-4 py-0.5 text-xs font-medium tracking-[0.24px] text-[var(--blind-review-accent)]"

const BLIND_REVIEW_NOTES_BADGE_ACTUAL_CLASS =
  "inline-flex h-6 items-center rounded-full bg-[var(--explanation-in-process-bg)] px-4 py-1 text-xs font-medium tracking-[0.24px] text-[var(--blind-review-actual-fg)]"

const BLIND_REVIEW_NOTES_CARD_CLASS =
  "flex w-full flex-col gap-6 rounded-[24px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-6"

const BLIND_REVIEW_NOTES_SECTION_CARD_CLASS =
  "flex h-[100px] items-center gap-6 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-6 py-3 shadow-[0px_1px_1.5px_rgba(13,13,18,0.05),0px_1px_1px_rgba(13,13,18,0.04)]"

const BLIND_REVIEW_NOTES_SHELL_GUTTER_CLASS = "px-4 md:px-6"

const BLIND_REVIEW_NOTES_CONTENT_CLASS = "mx-auto w-full max-w-[1280px]"

const BLIND_REVIEW_NOTES_SECTION_TITLE_ACTIVE_CLASS =
  "text-2xl font-bold leading-[1.3] text-[var(--primary)]"

const BLIND_REVIEW_NOTES_SECTION_TITLE_MUTED_CLASS =
  "text-2xl font-bold leading-[1.3] text-[var(--greyscale-300)]"

const BLIND_REVIEW_NOTES_SECTION_SUBTITLE_ACTIVE_CLASS =
  "text-sm font-normal leading-normal tracking-[0.28px] text-[var(--greyscale-500)]"

const BLIND_REVIEW_NOTES_SECTION_SUBTITLE_MUTED_CLASS =
  "text-sm font-normal leading-normal tracking-[0.28px] text-[var(--greyscale-300)]"

const BLIND_REVIEW_NOTES_START_BUTTON_CLASS = "ds-btn h-[52px] shrink-0 gap-2 px-4 text-base tracking-[0.32px]"

const BLIND_REVIEW_NOTES_BACK_BUTTON_CLASS =
  "inline-flex h-[52px] shrink-0 items-center justify-center rounded-[16px] px-4 text-base font-semibold tracking-[0.32px] text-[var(--primary)] transition-colors hover:underline"

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
  BLIND_REVIEW_NOTES_CONTENT_CLASS,
  BLIND_REVIEW_NOTES_HEADER_CLASS,
  BLIND_REVIEW_NOTES_PAGE_CLASS,
  BLIND_REVIEW_NOTES_SHELL_GUTTER_CLASS,
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
  BLIND_REVIEW_OPTION_ROW_INNER_CLASS,
  BLIND_REVIEW_OPTION_LETTER_SELECTED_ACTUAL_CLASS,
  BLIND_REVIEW_OPTION_LETTER_SELECTED_BR_CLASS,
  BLIND_REVIEW_OPTION_LETTER_CORRECT_CLASS,
  BLIND_REVIEW_OPTION_ROW_SELECTED_ACTUAL_CLASS,
  BLIND_REVIEW_OPTION_ROW_SELECTED_BR_CLASS,
  BLIND_REVIEW_OPTION_ROW_CORRECT_CLASS,
  BLIND_REVIEW_PASSAGE_PANEL_CLASS,
  BLIND_REVIEW_PASSAGE_TEXT_CLASS,
  BLIND_REVIEW_QUESTION_PANEL_CLASS,
  BLIND_REVIEW_QUESTION_NAV_RECOMMENDED_CLASS,
  BLIND_REVIEW_QUESTION_NUMBER_CLASS,
  BLIND_REVIEW_QUESTION_STEM_CLASS,
  BLIND_REVIEW_QUESTION_STEM_WRAP_CLASS,
  BLIND_REVIEW_RECOMMENDED_BADGE_CLASS,
  BLIND_REVIEW_SECTION_SELECT_MENU_CLASS,
  BLIND_REVIEW_SECTION_SELECT_MIN_WIDTH_PX,
  BLIND_REVIEW_SECTION_SELECT_TRIGGER_CLASS,
  BLIND_REVIEW_SHELL_CLASS,
  BLIND_REVIEW_SHELL_BOTTOM_PX,
  BLIND_REVIEW_SHELL_GAP_PX,
  REVIEW_BODY_CLASS,
  REVIEW_BODY_GRID_CLASS,
  REVIEW_BODY_GRID_FULL_CLASS,
  REVIEW_SIDE_PANEL_LAYOUT_FULL_CLASS,
  REVIEW_CARD_CLASS,
  REVIEW_EXIT_BUTTON_CLASS,
  REVIEW_FOOTER_CLASS,
  REVIEW_FOOTER_NAV_CLASS,
  REVIEW_FOOTER_ROW_CLASS,
  REVIEW_NAV_ARROW_BUTTON_CLASS,
  REVIEW_NAV_ARROW_GROUP_CLASS,
  REVIEW_PASSAGE_PANEL_CLASS,
  REVIEW_QUESTION_PANEL_CLASS,
  REVIEW_SHELL_CLASS,
  REVIEW_SIDEBAR_CLASS,
  REVIEW_SIDE_PANEL_LAYOUT_CLASS,
}
