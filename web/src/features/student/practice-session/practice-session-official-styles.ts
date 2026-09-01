/** Figma `20255:49920` — Official LawHub exam chrome (full page) */

const OFFICIAL_IMMERSIVE_FRAME_CLASS = "bg-white p-0"

const OFFICIAL_CARD_CLASS =
  "practice-session-card practice-session-card--active-drill practice-session-card--official relative flex h-full max-h-full min-h-0 w-full flex-col overflow-hidden rounded-[10px] border border-[#d4d7e2] bg-white"

const OFFICIAL_HEADER_SHELL_CLASS =
  "practice-session-header practice-session-header--official box-border flex shrink-0 flex-col overflow-visible rounded-none bg-white"

const OFFICIAL_HEADER_UTILITY_ROW_CLASS =
  "flex min-h-[50px] w-full min-w-0 items-center justify-between gap-4 px-[14px] py-2"

const OFFICIAL_HEADER_LEFT_CLASS = "flex min-w-0 items-center gap-4"

const OFFICIAL_HEADER_RIGHT_CLASS = "flex h-9 shrink-0 items-center gap-4"

const OFFICIAL_HEADER_CLOSE_BUTTON_CLASS =
  "inline-flex size-[22px] shrink-0 items-center justify-center text-[#2c3143] transition hover:opacity-80"

const OFFICIAL_HEADER_PILL_BUTTON_CLASS =
  "inline-flex h-[34px] shrink-0 items-center justify-center rounded-[6px] border border-[#d4d7e2] bg-[#eaecf3] px-[11px] text-[14px] font-normal leading-5 text-[#2c3143] transition hover:bg-[#e2e5ee]"

const OFFICIAL_HEADER_PILL_BUTTON_PRESSED_CLASS = "border-[#1877b1] bg-[#e6f0f6] text-[#1877b1]"

const OFFICIAL_FIND_WRAP_CLASS =
  "flex h-[34px] w-[192px] shrink-0 items-center gap-2 rounded-full border border-[#aab2cf] bg-white px-3"

const OFFICIAL_FIND_TEXT_INPUT_CLASS =
  "min-w-0 flex-1 bg-transparent text-[14px] font-normal leading-normal text-[#2c3143] outline-none placeholder:text-[rgba(44,49,67,0.5)]"

const OFFICIAL_HEADER_PROGRESS_LABEL_CLASS =
  "h-[18px] shrink-0 whitespace-nowrap text-[14px] font-normal leading-5 text-[#2c3143]"

const OFFICIAL_HEADER_TIMER_WRAP_CLASS = "flex h-9 shrink-0 items-center"

const OFFICIAL_HEADER_TIMER_CLASS = "flex h-9 shrink-0 items-center gap-1.5 px-2.5"

const OFFICIAL_HEADER_PAUSE_BUTTON_CLASS =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-[6px] transition hover:bg-[#f2f3f8]"

const OFFICIAL_HEADER_MORE_BUTTON_CLASS =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-[6px] p-1 transition hover:bg-[#f2f3f8]"

const OFFICIAL_HEADER_TITLE_ROW_CLASS = "flex h-[56px] w-full shrink-0 flex-col items-start overflow-hidden px-4 pb-4 pt-2"

const OFFICIAL_HEADER_TITLE_CLASS =
  "m-0 min-w-0 truncate text-[24px] font-normal leading-8 tracking-[-0.5px] text-[#2c3143]"

const OFFICIAL_HEADER_PROGRESS_TRACK_CLASS = "relative h-[5px] w-full overflow-hidden bg-[#eaecf3]"

const OFFICIAL_HEADER_PROGRESS_FILL_CLASS =
  "absolute left-0 top-0 h-full bg-[#1877b1] transition-[width] duration-300 ease-linear"

const OFFICIAL_BODY_GRID_CLASS = "lg:grid-cols-2 lg:pr-[50px]"

const OFFICIAL_PASSAGE_PANE_CLASS =
  "overflow-y-auto border-b border-[#eceff3] py-[13px] pl-7 pr-2 lg:border-b-0 lg:border-r-2 lg:border-[#eceff3] lg:pb-0"

const OFFICIAL_QUESTION_PANE_CLASS = "min-h-0 overflow-y-auto py-[13px] pl-1.5"

const OFFICIAL_PASSAGE_TEXT_CLASS =
  "text-[14px] font-normal leading-[1.5] tracking-[0.28px] text-[#2c3143] [&_p]:mb-0"

const OFFICIAL_QUESTION_PANEL_WITH_WIDGET_CLASS = "practice-session-question-panel-with-widget relative min-w-0 pr-[50px]"

const OFFICIAL_STEM_SECTION_CLASS = "w-full shrink-0 px-5"

const OFFICIAL_STEM_NUMBER_CLASS = "shrink-0 pr-2 text-[14px] font-normal leading-5 text-[#2c3143]"

const OFFICIAL_STEM_TEXT_CLASS =
  "min-w-0 flex-1 text-[14px] font-normal leading-5 text-[#2c3143] [&_ol]:m-0 [&_ol]:list-decimal [&_ol]:pl-7 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0"

/** Figma `20243:23534` — choices + Reset, 20px x 16px inset */
const OFFICIAL_OPTIONS_LIST_CLASS = "flex w-full flex-col items-stretch gap-[2px] px-5 pt-4"

const OFFICIAL_OPTION_ROW_UNSELECTED_CLASS = "flex w-full items-stretch bg-[#f2f3f8]"

const OFFICIAL_OPTION_ROW_SELECTED_CLASS =
  "relative flex w-full items-stretch overflow-hidden bg-[#fdfac4]"

const OFFICIAL_OPTION_SELECTED_BAR_CLASS =
  "pointer-events-none absolute inset-y-0 left-0 z-[1] w-[3px] bg-[#12162a]"

const OFFICIAL_OPTION_ROW_MASKED_CLASS =
  "practice-session-choice-masked flex w-full items-stretch bg-[#f2f3f8]"

const OFFICIAL_OPTION_LETTER_UNSELECTED_CLASS =
  "box-border flex w-[60px] min-h-[60px] shrink-0 items-center justify-center self-stretch border-2 border-[#f2f3f8] bg-white text-[28px] font-normal leading-[60px] text-[#50577b]"

const OFFICIAL_OPTION_LETTER_SELECTED_CLASS =
  "box-border flex w-[60px] min-h-[60px] shrink-0 items-center justify-center self-stretch border-2 border-transparent bg-[#fdfac4] text-[28px] font-normal leading-[60px] text-[#2c3143]"

const OFFICIAL_OPTION_TEXT_CLASS =
  "box-border flex min-h-[60px] min-w-0 flex-1 flex-col justify-center self-stretch py-2 pl-1.5 pr-3 text-[14px] font-normal leading-5 text-[#2c3143]"

const OFFICIAL_RESET_RESPONSE_WRAP_CLASS = "flex h-[46px] w-full shrink-0 items-start justify-end pt-3"

const OFFICIAL_RESET_RESPONSE_BUTTON_CLASS =
  "inline-flex h-[34px] shrink-0 items-center justify-center rounded-[6px] border border-[#d4d7e2] bg-[#eaecf3] px-[11px] pb-[5px] pt-[3px] text-[14px] font-normal leading-5 text-[#2c3143] transition hover:bg-[#e2e5ee]"

const OFFICIAL_SIDE_WIDGET_CLASS =
  "practice-session-side-widget absolute bottom-0 right-0 top-0 z-10 flex w-[50px] flex-col items-center overflow-visible bg-[#eaecf3]"

const OFFICIAL_SIDE_WIDGET_EXPANDED_CLASS =
  "practice-session-side-widget absolute bottom-0 right-0 top-0 z-10 flex w-[174px] flex-col items-start justify-between overflow-visible border-l border-[#d4d7e2] bg-[#eaecf3]"

const OFFICIAL_SIDE_WIDGET_ITEM_CLASS =
  "inline-flex h-10 w-[49px] items-center justify-center text-[#666d80] transition hover:bg-white/70"

const OFFICIAL_SIDE_WIDGET_ITEM_EXPANDED_CLASS =
  "flex h-10 w-full items-center gap-3 px-[14px] text-left text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[#0d0d12] transition hover:bg-white/70"

/** Figma `20257:89990` — official Review overlay (header 50+56+5, rail 50px) */
const OFFICIAL_REVIEW_PANEL_CLASS =
  "practice-session-review-panel practice-session-review-panel--official absolute bottom-0 left-0 right-[50px] top-[111px] z-20 flex flex-col overflow-hidden bg-[#eaecf3]"

const OFFICIAL_REVIEW_HEADER_CLASS =
  "flex min-h-[50px] w-full shrink-0 items-center justify-between border-b border-[#d4d7e2] px-4"

const OFFICIAL_REVIEW_TITLE_CLASS =
  "m-0 text-[20px] font-normal leading-6 tracking-[-0.5px] text-[#2c3143]"

const OFFICIAL_REVIEW_CLOSE_BUTTON_CLASS =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-[14px] bg-white transition hover:opacity-80"

const OFFICIAL_REVIEW_FILTERS_CLASS = "flex h-9 w-full shrink-0 items-center gap-[15px] px-4"

const OFFICIAL_REVIEW_FILTER_ITEM_CLASS =
  "inline-flex items-center gap-2 text-[14px] font-normal leading-5 text-[#2c3143]"

const OFFICIAL_REVIEW_FILTER_BOX_CLASS =
  "inline-flex size-5 shrink-0 items-center justify-center rounded-[3px] border border-[#aab2cf] bg-white"

const OFFICIAL_REVIEW_FILTER_BOX_CHECKED_CLASS = "border-[#1877b1] bg-[#1877b1] text-white"

const OFFICIAL_REVIEW_GRID_WRAP_CLASS = "min-h-0 flex-1 overflow-auto px-[15px] pt-[15px]"

const OFFICIAL_REVIEW_GRID_CLASS =
  "practice-session-review-panel__grid grid w-full grid-cols-12 border-l border-t border-[#aab2cf]"

const OFFICIAL_REVIEW_QUESTION_BUTTON_CLASS =
  "practice-session-review-panel__question-btn relative flex h-[68px] min-w-0 w-full items-center justify-center border-b border-r border-[#aab2cf] bg-white text-[20px] font-normal leading-6 tracking-[-0.5px] text-[#2c3143]"

const OFFICIAL_REVIEW_PASSAGE_BREAK_CLASS =
  "practice-session-review-panel__passage-break h-[68px] border-b border-r border-[#aab2cf] bg-[#eaecf3]"

const OFFICIAL_REVIEW_ANSWERED_BAR_CLASS = "absolute inset-x-0 bottom-0 h-[3px] bg-[#818bb2]"

const OFFICIAL_REVIEW_CURRENT_BAR_CLASS = "absolute inset-x-0 bottom-0 h-[3px] bg-[#1877b1]"

const OFFICIAL_REVIEW_CURRENT_CARET_CLASS =
  "pointer-events-none absolute bottom-[6px] left-1/2 h-[6px] w-3 -translate-x-1/2"

const OFFICIAL_REVIEW_FINISH_WRAP_CLASS = "flex w-full shrink-0 items-center justify-center py-6"

const OFFICIAL_REVIEW_FINISH_BUTTON_CLASS =
  "inline-flex h-10 min-w-[90px] shrink-0 items-center justify-center rounded-[6px] bg-[#1877b1] px-4 text-base font-normal leading-6 text-white transition hover:bg-[#156799]"

const OFFICIAL_FOOTER_CLASS =
  "box-border flex h-[72px] shrink-0 flex-col justify-center overflow-visible rounded-none border-t border-[#eceff3] bg-white"

const OFFICIAL_FOOTER_ROW_CLASS = "flex w-full min-w-0 items-center justify-center overflow-visible"

const OFFICIAL_FOOTER_NAV_CLUSTER_CLASS =
  "flex min-w-0 max-w-full items-end justify-center gap-2 px-2"

const OFFICIAL_FOOTER_NAV_BUTTON_CLASS =
  "box-border inline-flex h-7 shrink-0 items-center justify-center rounded-[6px] bg-[#1877b1] px-3 pb-[5px] pt-[3px] text-[14px] font-normal leading-5 text-white transition hover:bg-[#156799] disabled:pointer-events-none disabled:opacity-40"

const OFFICIAL_FOOTER_NAV_GRID_CLASS =
  "practice-session-question-nav-grid practice-session-scroll-hidden flex min-w-0 max-w-full flex-nowrap items-end justify-center gap-2 overflow-x-auto overflow-y-hidden"

const OFFICIAL_QUESTION_NAV_ITEM_CLASS = "relative flex w-7 shrink-0 flex-col items-center gap-0.5"

const OFFICIAL_QUESTION_NAV_FLAG_SLOT_CLASS =
  "relative z-[1] flex h-[13px] w-7 shrink-0 items-center justify-center"

const OFFICIAL_QUESTION_NAV_FLAG_CLASS = "h-[13px] w-[11px] max-w-none shrink-0"

const OFFICIAL_QUESTION_NAV_BUTTON_CLASS =
  "practice-session-question-nav-btn box-border relative inline-flex size-7 shrink-0 items-center justify-center rounded-[6px] text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[#0d0d12] transition-colors"

const OFFICIAL_QUESTION_NAV_BUTTON_DEFAULT_CLASS = "border border-solid border-[#d4d7e2] bg-white hover:bg-[#e6f0f6]"

const OFFICIAL_QUESTION_NAV_BUTTON_ACTIVE_CLASS = "border-0 bg-[#e6f0f6] text-[#0d0d12]"

const OFFICIAL_QUESTION_NAV_BUTTON_ANSWERED_CLASS =
  "border border-solid border-[#d4d7e2] border-b-0 bg-white text-[#0d0d12]"

const OFFICIAL_QUESTION_NAV_CURRENT_BAR_CLASS =
  "pointer-events-none absolute inset-x-0 bottom-0 h-[3px] rounded-b-[6px] bg-[#1877b1]"

const OFFICIAL_QUESTION_NAV_ANSWERED_BAR_CLASS =
  "pointer-events-none absolute inset-x-0 bottom-0 h-[3px] rounded-b-[6px] bg-[#a4acb9]"

const OFFICIAL_QUESTION_NAV_CARET_CLASS =
  "pointer-events-none absolute bottom-[3px] left-1/2 z-[1] size-[3px] -translate-x-1/2"

const OFFICIAL_PASSAGE_BREAK_CLASS =
  "practice-session-question-nav-passage-break h-7 w-[4px] min-w-[4px] max-w-[4px] shrink-0 self-end bg-[#666d80]"

export {
  OFFICIAL_BODY_GRID_CLASS,
  OFFICIAL_CARD_CLASS,
  OFFICIAL_FIND_TEXT_INPUT_CLASS,
  OFFICIAL_FIND_WRAP_CLASS,
  OFFICIAL_FOOTER_CLASS,
  OFFICIAL_FOOTER_NAV_BUTTON_CLASS,
  OFFICIAL_FOOTER_NAV_CLUSTER_CLASS,
  OFFICIAL_FOOTER_NAV_GRID_CLASS,
  OFFICIAL_FOOTER_ROW_CLASS,
  OFFICIAL_HEADER_CLOSE_BUTTON_CLASS,
  OFFICIAL_HEADER_LEFT_CLASS,
  OFFICIAL_HEADER_MORE_BUTTON_CLASS,
  OFFICIAL_HEADER_PAUSE_BUTTON_CLASS,
  OFFICIAL_HEADER_PILL_BUTTON_CLASS,
  OFFICIAL_HEADER_PILL_BUTTON_PRESSED_CLASS,
  OFFICIAL_HEADER_PROGRESS_FILL_CLASS,
  OFFICIAL_HEADER_PROGRESS_LABEL_CLASS,
  OFFICIAL_HEADER_PROGRESS_TRACK_CLASS,
  OFFICIAL_HEADER_RIGHT_CLASS,
  OFFICIAL_HEADER_SHELL_CLASS,
  OFFICIAL_HEADER_TIMER_CLASS,
  OFFICIAL_HEADER_TIMER_WRAP_CLASS,
  OFFICIAL_HEADER_TITLE_CLASS,
  OFFICIAL_HEADER_TITLE_ROW_CLASS,
  OFFICIAL_HEADER_UTILITY_ROW_CLASS,
  OFFICIAL_IMMERSIVE_FRAME_CLASS,
  OFFICIAL_OPTION_LETTER_SELECTED_CLASS,
  OFFICIAL_OPTION_LETTER_UNSELECTED_CLASS,
  OFFICIAL_OPTION_ROW_MASKED_CLASS,
  OFFICIAL_OPTION_ROW_SELECTED_CLASS,
  OFFICIAL_OPTION_ROW_UNSELECTED_CLASS,
  OFFICIAL_OPTION_SELECTED_BAR_CLASS,
  OFFICIAL_OPTION_TEXT_CLASS,
  OFFICIAL_OPTIONS_LIST_CLASS,
  OFFICIAL_PASSAGE_BREAK_CLASS,
  OFFICIAL_PASSAGE_PANE_CLASS,
  OFFICIAL_PASSAGE_TEXT_CLASS,
  OFFICIAL_QUESTION_NAV_ANSWERED_BAR_CLASS,
  OFFICIAL_QUESTION_NAV_BUTTON_ACTIVE_CLASS,
  OFFICIAL_QUESTION_NAV_BUTTON_ANSWERED_CLASS,
  OFFICIAL_QUESTION_NAV_BUTTON_CLASS,
  OFFICIAL_QUESTION_NAV_BUTTON_DEFAULT_CLASS,
  OFFICIAL_QUESTION_NAV_CARET_CLASS,
  OFFICIAL_QUESTION_NAV_CURRENT_BAR_CLASS,
  OFFICIAL_QUESTION_NAV_FLAG_CLASS,
  OFFICIAL_QUESTION_NAV_FLAG_SLOT_CLASS,
  OFFICIAL_QUESTION_NAV_ITEM_CLASS,
  OFFICIAL_QUESTION_PANE_CLASS,
  OFFICIAL_QUESTION_PANEL_WITH_WIDGET_CLASS,
  OFFICIAL_RESET_RESPONSE_BUTTON_CLASS,
  OFFICIAL_RESET_RESPONSE_WRAP_CLASS,
  OFFICIAL_REVIEW_ANSWERED_BAR_CLASS,
  OFFICIAL_REVIEW_CLOSE_BUTTON_CLASS,
  OFFICIAL_REVIEW_CURRENT_BAR_CLASS,
  OFFICIAL_REVIEW_CURRENT_CARET_CLASS,
  OFFICIAL_REVIEW_FILTER_BOX_CHECKED_CLASS,
  OFFICIAL_REVIEW_FILTER_BOX_CLASS,
  OFFICIAL_REVIEW_FILTER_ITEM_CLASS,
  OFFICIAL_REVIEW_FILTERS_CLASS,
  OFFICIAL_REVIEW_FINISH_BUTTON_CLASS,
  OFFICIAL_REVIEW_FINISH_WRAP_CLASS,
  OFFICIAL_REVIEW_GRID_CLASS,
  OFFICIAL_REVIEW_GRID_WRAP_CLASS,
  OFFICIAL_REVIEW_HEADER_CLASS,
  OFFICIAL_REVIEW_PANEL_CLASS,
  OFFICIAL_REVIEW_PASSAGE_BREAK_CLASS,
  OFFICIAL_REVIEW_QUESTION_BUTTON_CLASS,
  OFFICIAL_REVIEW_TITLE_CLASS,
  OFFICIAL_SIDE_WIDGET_CLASS,
  OFFICIAL_SIDE_WIDGET_EXPANDED_CLASS,
  OFFICIAL_SIDE_WIDGET_ITEM_CLASS,
  OFFICIAL_SIDE_WIDGET_ITEM_EXPANDED_CLASS,
  OFFICIAL_STEM_NUMBER_CLASS,
  OFFICIAL_STEM_SECTION_CLASS,
  OFFICIAL_STEM_TEXT_CLASS,
}
