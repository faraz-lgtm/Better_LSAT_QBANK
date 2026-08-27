/** Figma `18704:14485` — finish control width (closed trigger) */
const FINISH_MENU_WIDTH_PX = 126

/** Figma `19641:45663` — open finish menu panel */
const FINISH_MENU_PANEL_WIDTH_PX = 200

/** Shared corner radius for timer + finish controls in the practice session header */
const PRACTICE_SESSION_HEADER_CONTROL_RADIUS_CLASS = "rounded-[16px]"

/** Figma timer progress track + fill — 6px height, 6px corner radius */
const PRACTICE_SESSION_TIMER_PROGRESS_RADIUS_CLASS = "rounded-[6px]"

/** Figma `18617:31643` finish dropdown trigger (active drill, closed) */
const ACTIVE_DRILL_FINISH_BUTTON_CLASS =
  `h-[52px] w-[126px] shrink-0 gap-2 ${PRACTICE_SESSION_HEADER_CONTROL_RADIUS_CLASS} border border-[#dfe1e7] bg-white px-3 py-2 text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[#062357]`

/** Figma `18617:26214` finish dropdown trigger (section / prep test, closed) */
const SESSION_FINISH_BUTTON_CLASS =
  `h-[52px] w-[126px] shrink-0 gap-2 ${PRACTICE_SESSION_HEADER_CONTROL_RADIUS_CLASS} border border-[#dfe1e7] bg-[#f6f8fa] px-3 py-2 text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[#062357]`

/** Figma `18704:14485` finish dropdown open panel */
const FINISH_MENU_OPEN_PANEL_CLASS =
  "flex flex-col drop-shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"

/** Figma `18704:14488` finish row when open — matches closed trigger typography */
const FINISH_MENU_OPEN_TRIGGER_CLASS =
  "flex h-[52px] w-full items-center justify-between gap-2 rounded-t-[16px] border border-[#dfe1e7] bg-[#edf3ff] px-3 py-2 text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[#062357]"

/** Figma `19641:45663` — action rows container */
const FINISH_MENU_ACTIONS_PANEL_CLASS =
  "flex flex-col gap-1 rounded-b-[16px] border border-t-0 border-[#dfe1e7] bg-[#f6f8fa] p-2"

/** Figma `19641:45663` — submit / save & exit row */
const FINISH_MENU_ACTION_ITEM_CLASS =
  "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm font-medium leading-[1.5] tracking-[0.28px] text-[#062357] transition-colors hover:bg-[#eceff3]"

/** Figma `19641:45663` — row icon */
const FINISH_MENU_ACTION_ITEM_ICON_CLASS = "size-5 shrink-0 text-[#666d80]"

/** Figma `20268:100328` — exam more panel (3-dots) */
const EXAM_MORE_PANEL_OVERLAY_CLASS =
  "fixed inset-0 z-[200] bg-[rgba(0,0,0,0.3)] backdrop-blur-[3px]"

const EXAM_MORE_PANEL_CLASS =
  "fixed inset-y-0 right-0 z-[210] flex h-full w-[360px] flex-col items-start bg-[#f3f7ff] p-3"

const EXAM_MORE_PANEL_CLOSE_ROW_CLASS = "flex h-12 w-full shrink-0 items-center justify-end"

const EXAM_MORE_PANEL_CLOSE_BUTTON_CLASS =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#0d0d12] transition hover:bg-white/70"

const EXAM_MORE_PANEL_ACTION_CLASS =
  "flex h-12 w-full shrink-0 items-center gap-2 rounded-[14px] p-2 text-left text-[18px] font-medium leading-[1.4] tracking-[0.36px] text-[#062357] transition-colors hover:bg-white/70 disabled:pointer-events-none disabled:opacity-50"

const EXAM_MORE_PANEL_ACTION_ICON_WRAP_CLASS =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px]"

const EXAM_MORE_PANEL_DIVIDER_WRAP_CLASS = "flex w-full shrink-0 flex-col items-start py-2"

const EXAM_MORE_PANEL_DIVIDER_CLASS = "h-[3px] w-full border-b-2 border-t border-[#eceff3]"

const EXAM_MORE_PANEL_TOGGLE_ROW_CLASS =
  "flex h-12 w-full shrink-0 items-center justify-between rounded-[14px] p-2"

const EXAM_MORE_PANEL_TOGGLE_LABEL_CLASS =
  "text-[18px] font-medium leading-[1.4] tracking-[0.36px] text-[#062357]"

/** Figma `20268:105580` — exam header chrome */
const ACTIVE_DRILL_HEADER_SHELL_CLASS =
  "practice-session-header practice-session-header--active-drill box-border flex h-[120px] shrink-0 flex-col overflow-visible rounded-none bg-white px-10 py-6"

const ACTIVE_DRILL_HEADER_STACK_CLASS = "flex w-full flex-col justify-center gap-4"

const ACTIVE_DRILL_HEADER_ROW_CLASS =
  "flex h-[52px] w-full min-w-0 items-center justify-between"

const ACTIVE_DRILL_HEADER_LEFT_CLASS = "flex min-w-0 items-center gap-6"

const ACTIVE_DRILL_HEADER_RIGHT_CLASS = "flex h-[52px] shrink-0 items-center gap-2.5"

const ACTIVE_DRILL_HEADER_TITLE_CLASS =
  "m-0 min-w-0 truncate text-[24px] font-bold leading-[1.3] text-[#062357]"

/** Figma `20268:105580` — find-text field 200×52 */
const ACTIVE_DRILL_FIND_TEXT_INPUT_CLASS =
  "h-[52px] w-[200px] shrink-0 rounded-[16px] border border-[#dfe1e7] bg-[#f6f8fa] px-4 py-2 text-sm font-normal leading-[1.5] tracking-[0.28px] text-[#0d0d12] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] outline-none placeholder:text-[#818898]"

/** Figma `20268:105580` — timer card 178×52 */
const ACTIVE_DRILL_HEADER_TIMER_CLASS =
  "practice-session-timer flex h-[52px] w-[178px] shrink-0 items-center overflow-visible rounded-[16px] border border-[#dfe1e7] bg-white px-3"

const ACTIVE_DRILL_HEADER_PROGRESS_TRACK_CLASS =
  "relative h-1 w-full overflow-hidden rounded-[5px] bg-[#d9d9d9]"

const ACTIVE_DRILL_HEADER_PROGRESS_FILL_CLASS =
  "absolute left-0 top-0 h-full rounded-[5px] bg-[#0d47a1] transition-[width] duration-300 ease-linear"

/** Figma header — highlighter + eraser group */
const ACTIVE_DRILL_HEADER_TOOL_GROUP_CLASS =
  "flex h-[52px] shrink-0 items-center gap-1.5 rounded-[16px] border border-[#dfe1e7] bg-white px-3"

/** Figma header — standalone underline control */
const ACTIVE_DRILL_HEADER_UNDERLINE_BUTTON_CLASS =
  "inline-flex size-[52px] shrink-0 items-center justify-center rounded-[16px] border border-[#dfe1e7] bg-white text-sm font-bold text-[#666d80] transition hover:bg-[#f6f8fa] hover:text-[#062357]"

/** Figma `20268:105580` — question progress label */
const ACTIVE_DRILL_HEADER_PROGRESS_CLASS =
  "h-5 shrink-0 whitespace-nowrap text-sm font-medium leading-[1.5] tracking-[0.28px] text-[#666d80]"

/** Figma `20268:105580` — pause / more 54×52 */
const ACTIVE_DRILL_HEADER_ICON_BUTTON_CLASS =
  "inline-flex h-[52px] w-[54px] shrink-0 items-center justify-center rounded-[16px] border border-[#dfe1e7] bg-white transition hover:bg-[#f6f8fa]"

/** Figma `20268:105580` — close 36×36 */
const ACTIVE_DRILL_HEADER_CLOSE_BUTTON_CLASS =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#0d0d12] transition hover:bg-[#f6f8fa]"

/** Figma header — more-options trigger */
const ACTIVE_DRILL_HEADER_MORE_BUTTON_CLASS = ACTIVE_DRILL_HEADER_ICON_BUTTON_CLASS

/** Figma `20268:102788` — selected answer choice row (colors via a11y CSS vars) */
const ACTIVE_DRILL_OPTION_ROW_SELECTED_CLASS =
  "practice-session-choice--selected w-full rounded-[14px] border border-solid py-2 pl-2 pr-6 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"

/** Figma `20268:102788` — 46×46 letter badges, 12px corners */
const ACTIVE_DRILL_OPTION_LETTER_SELECTED_CLASS =
  "practice-session-choice-letter practice-session-choice-letter--selected box-border size-[46px] shrink-0 rounded-[12px] border text-sm font-semibold leading-[1.5] tracking-[0.28px]"

const ACTIVE_DRILL_OPTION_LETTER_UNSELECTED_CLASS =
  "practice-session-choice-letter practice-session-choice-letter--unselected box-border size-[46px] shrink-0 rounded-[12px] border text-sm font-semibold leading-[1.5] tracking-[0.28px]"

/** Figma `18617:31663` / `18781:29066` — 36×36 flag / eye controls */
const ACTIVE_DRILL_ACTION_BUTTON_CLASS =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#666d80] transition hover:text-[#062357]"

/** Figma LSAT default — equal two-column exam body */
const ACTIVE_DRILL_BODY_GRID_CLASS = "px-6 pt-6 lg:grid-cols-2"

/** Figma LSAT default — passage column with vertical divider */
const ACTIVE_DRILL_PASSAGE_PANE_CLASS =
  "border-b border-[#dfe1e7] pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6"

/** Figma LSAT default — question + answers column */
const ACTIVE_DRILL_QUESTION_PANE_CLASS = "pt-6 lg:pt-0 lg:pl-6"

/** Figma `19641:44925` — stimulus / passage typography */
const ACTIVE_DRILL_PASSAGE_TEXT_CLASS = "text-[1.125em] leading-[1.5] text-[color:inherit]"

/** Figma `20268:102762` — LSAT default side widget */
const ACTIVE_DRILL_SIDE_WIDGET_COLLAPSED_CLASS =
  "items-center gap-2 rounded-[14px] border border-[#dfe1e7] bg-[#f6f8fa] px-2.5 py-3 shadow-[0px_12px_8px_rgba(13,13,18,0.08),0px_4px_3px_rgba(13,13,18,0.03)]"

/** Figma `18781:29066` — expanded side widget panel */
const ACTIVE_DRILL_SIDE_WIDGET_EXPANDED_CLASS =
  "w-[200px] gap-0.5 rounded-[16px] border border-[#dfe1e7] bg-white py-2 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"

const ACTIVE_DRILL_SIDE_WIDGET_ITEM_CLASS =
  "inline-flex size-9 items-center justify-center rounded-[10px] text-[#666d80] transition hover:bg-white hover:text-[#062357]"

const ACTIVE_DRILL_SIDE_WIDGET_ITEM_EXPANDED_CLASS =
  "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[#666d80] transition hover:bg-[#f6f8fa] hover:text-[#062357]"

/** Figma `18781:29066` — room for floating side widget */
const ACTIVE_DRILL_QUESTION_PANEL_WITH_WIDGET_CLASS =
  "practice-session-question-panel-with-widget relative min-w-0 pr-14"

/** Figma `20268:102788` — 11px stack: choices then Reset */
const ACTIVE_DRILL_OPTIONS_LIST_CLASS = "mt-[11px] flex w-full flex-col items-end gap-[11px]"

/** Figma `20280:108037` — same 14px choice card, frost + hatch overlay */
const ACTIVE_DRILL_OPTION_ROW_MASKED_CLASS =
  "practice-session-choice-masked practice-session-choice--unselected w-full rounded-[14px] border border-solid py-2 pl-2 pr-6"

/** Passage highlight selection popover (Figma `20280:108155` highlight UI) */
const PASSAGE_HIGHLIGHT_POPOVER_CARD_CLASS =
  "flex min-w-[168px] flex-col gap-2 rounded-[12px] border border-[#dfe1e7] bg-white p-2 shadow-[0px_8px_24px_rgba(13,13,18,0.16),0px_2px_6px_rgba(13,13,18,0.08)]"

const PASSAGE_HIGHLIGHT_POPOVER_HEADER_CLASS =
  "flex h-7 w-full items-center gap-2 text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[#0d0d12]"

const PASSAGE_HIGHLIGHT_POPOVER_SWATCH_ROW_CLASS = "flex w-full items-center justify-between px-0.5"

const PASSAGE_HIGHLIGHT_POPOVER_SWATCH_CLASS =
  "relative box-border size-5 shrink-0 rounded-[5px] border-2 border-solid border-[#dfe1e7]"

const PASSAGE_HIGHLIGHT_REMOVE_CARD_CLASS =
  "flex h-9 items-center gap-2 rounded-[12px] border border-[#dfe1e7] bg-white px-3 shadow-[0px_8px_24px_rgba(13,13,18,0.16),0px_2px_6px_rgba(13,13,18,0.08)] text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[#0d0d12]"

/** Figma `20268:105681` — Reset Response 34×auto gray pill */
const ACTIVE_DRILL_RESET_RESPONSE_BUTTON_CLASS =
  "practice-session-reset-response inline-flex h-[34px] shrink-0 items-center justify-center rounded-[6px] bg-[#f6f8fa] px-3 text-sm font-normal leading-[1.5] tracking-[0.28px] text-[#666d80] transition hover:bg-[#eceff3]"

/** Figma `20268:102788` — unselected answer choice row (colors via a11y CSS vars) */
const ACTIVE_DRILL_OPTION_ROW_UNSELECTED_CLASS =
  "practice-session-choice--unselected w-full rounded-[14px] border border-solid py-2 pl-2 pr-6"

/** Figma `20268:102789` — question stem */
const ACTIVE_DRILL_STEM_SECTION_CLASS = "w-full shrink-0 p-3"

/** Figma `20268:102788` — letter | 12px | text */
const ACTIVE_DRILL_CHOICE_ROW_GRID_CLASS = "flex w-full items-start gap-3"

/** Inline eye column when not using the side rail */
const ACTIVE_DRILL_CHOICE_ROW_GRID_WITH_ACTION_CLASS = "flex w-full items-start gap-3"

/** Figma `20268:102792` — stem text (flag lives in side rail) */
const ACTIVE_DRILL_STEM_GRID_CLASS = "min-w-0"

const ACTIVE_DRILL_STEM_TEXT_CLASS =
  "min-w-0 flex-1 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[color:inherit] [&_ol]:m-0 [&_ol]:list-decimal [&_ol]:pl-7 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0"

const ACTIVE_DRILL_STEM_NUMBER_CLASS =
  "shrink-0 text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[color:inherit]"

/** Figma `18617:31674` / `18617:31682` — hide-choice control */
const ACTIVE_DRILL_OPTION_EYE_BUTTON_CLASS = ACTIVE_DRILL_ACTION_BUTTON_CLASS

/** Figma `19641:45187` — prev/next labeled pill controls (review panel, etc.) */
const ACTIVE_DRILL_NAV_ARROW_BUTTON_CLASS =
  "box-border inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-[12px] border border-[#dfe1e7] bg-[#f6f8fa] px-3 text-sm font-medium leading-[1.5] tracking-[0.28px] text-[#4a5568] transition hover:bg-white disabled:pointer-events-none disabled:text-[#a4acb9]"

/** Figma `20268:107659` — footer prev/next, 28×28 icon-only */
const ACTIVE_DRILL_FOOTER_NAV_ARROW_BUTTON_CLASS =
  "box-border inline-flex size-7 shrink-0 items-center justify-center rounded-[6px] border border-[#dfe1e7] bg-[#f6f8fa] p-0 text-[#666d80] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition hover:bg-white disabled:pointer-events-none disabled:opacity-40"

/** Figma `20268:107659` — prev/next align with pills; flags sit above the 28px row */
const ACTIVE_DRILL_FOOTER_NAV_ARROW_COLUMN_CLASS = "flex shrink-0 items-end self-end"

/** Figma `19641:45187` — compact arrow-only control (blind review overrides) */
const ACTIVE_DRILL_NAV_ARROW_ICON_BUTTON_CLASS =
  "box-border inline-flex size-12 shrink-0 items-center justify-center rounded-[20px] border border-[#dfe1e7] bg-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition hover:bg-[#f0f5ff] disabled:pointer-events-none"

/** Figma `20268:107659` — left-aligned question number row; flags sit above pills */
const ACTIVE_DRILL_FOOTER_NAV_GRID_CLASS =
  "practice-session-question-nav-grid practice-session-scroll-hidden flex min-w-0 max-w-full flex-nowrap items-end justify-start gap-2 overflow-x-auto overflow-y-hidden"

/** Figma `20268:107661` — prev, numbers, and next as one left-aligned group */
const ACTIVE_DRILL_FOOTER_NAV_CLUSTER_CLASS =
  "flex min-w-0 max-w-full items-end justify-start gap-2 px-2"

/** Figma `20268:107659` — footer chrome, 72px; flags + 28px pills vertically centered */
const ACTIVE_DRILL_FOOTER_CLASS =
  "box-border flex h-[72px] shrink-0 flex-col justify-center overflow-visible rounded-none border-t border-[#dfe1e7] bg-white"

const ACTIVE_DRILL_FOOTER_ROW_CLASS =
  "flex w-full min-w-0 items-end justify-start overflow-visible"

/** Figma exam-review flag — 11×13 pennant above flagged footer pills */
const ACTIVE_DRILL_QUESTION_NAV_FLAG_CLASS = "h-[13px] w-[11px] max-w-none shrink-0"

const ACTIVE_DRILL_QUESTION_NAV_FLAG_SLOT_CLASS =
  "flex h-[13px] w-7 shrink-0 items-center justify-center"

/** Figma `20268:107659` — flag slot + 28×28 question pill */
const ACTIVE_DRILL_QUESTION_NAV_ITEM_CLASS = "flex w-7 shrink-0 flex-col items-center gap-0.5"

/** Figma `20268:107659` — square question number pill, 28×28 */
const ACTIVE_DRILL_QUESTION_NAV_BUTTON_CLASS =
  "practice-session-question-nav-btn box-border relative inline-flex size-7 shrink-0 items-center justify-center rounded-[6px] text-xs font-normal leading-[1.5] tracking-[0.24px] transition-colors"

/** Figma `20268:107666` — current question (light blue); wins over answered */
const ACTIVE_DRILL_QUESTION_NAV_BUTTON_ACTIVE_CLASS =
  "border border-[#0d47a1] bg-[#edf3ff] text-[#0d47a1]"

/** Figma `20268:107664` — answered, not current */
const ACTIVE_DRILL_QUESTION_NAV_BUTTON_ANSWERED_CLASS =
  "border border-[#0b4e6e] bg-[#0d47a1] text-white"

/** Figma `20268:107668` — unvisited; hover matches current */
const ACTIVE_DRILL_QUESTION_NAV_BUTTON_DEFAULT_CLASS =
  "border border-[#d4d7e2] bg-white text-[#0d0d12] hover:border-[#0d47a1] hover:bg-[#edf3ff] hover:text-[#0d47a1]"

export {
  ACTIVE_DRILL_ACTION_BUTTON_CLASS,
  ACTIVE_DRILL_BODY_GRID_CLASS,
  ACTIVE_DRILL_CHOICE_ROW_GRID_CLASS,
  ACTIVE_DRILL_CHOICE_ROW_GRID_WITH_ACTION_CLASS,
  ACTIVE_DRILL_HEADER_CLOSE_BUTTON_CLASS,
  ACTIVE_DRILL_HEADER_ICON_BUTTON_CLASS,
  ACTIVE_DRILL_HEADER_LEFT_CLASS,
  ACTIVE_DRILL_HEADER_MORE_BUTTON_CLASS,
  ACTIVE_DRILL_HEADER_PROGRESS_CLASS,
  ACTIVE_DRILL_HEADER_PROGRESS_FILL_CLASS,
  ACTIVE_DRILL_HEADER_PROGRESS_TRACK_CLASS,
  ACTIVE_DRILL_HEADER_RIGHT_CLASS,
  ACTIVE_DRILL_HEADER_ROW_CLASS,
  ACTIVE_DRILL_HEADER_SHELL_CLASS,
  ACTIVE_DRILL_HEADER_STACK_CLASS,
  ACTIVE_DRILL_HEADER_TIMER_CLASS,
  ACTIVE_DRILL_HEADER_TITLE_CLASS,
  ACTIVE_DRILL_HEADER_TOOL_GROUP_CLASS,
  ACTIVE_DRILL_HEADER_UNDERLINE_BUTTON_CLASS,
  ACTIVE_DRILL_FIND_TEXT_INPUT_CLASS,
  ACTIVE_DRILL_FINISH_BUTTON_CLASS,
  ACTIVE_DRILL_FOOTER_CLASS,
  ACTIVE_DRILL_FOOTER_NAV_ARROW_BUTTON_CLASS,
  ACTIVE_DRILL_FOOTER_NAV_ARROW_COLUMN_CLASS,
  ACTIVE_DRILL_FOOTER_NAV_CLUSTER_CLASS,
  ACTIVE_DRILL_FOOTER_NAV_GRID_CLASS,
  ACTIVE_DRILL_FOOTER_ROW_CLASS,
  ACTIVE_DRILL_NAV_ARROW_BUTTON_CLASS,
  ACTIVE_DRILL_NAV_ARROW_ICON_BUTTON_CLASS,
  ACTIVE_DRILL_QUESTION_NAV_BUTTON_ACTIVE_CLASS,
  ACTIVE_DRILL_QUESTION_NAV_BUTTON_ANSWERED_CLASS,
  ACTIVE_DRILL_QUESTION_NAV_BUTTON_CLASS,
  ACTIVE_DRILL_QUESTION_NAV_BUTTON_DEFAULT_CLASS,
  ACTIVE_DRILL_QUESTION_NAV_FLAG_CLASS,
  ACTIVE_DRILL_QUESTION_NAV_FLAG_SLOT_CLASS,
  ACTIVE_DRILL_QUESTION_NAV_ITEM_CLASS,
  ACTIVE_DRILL_OPTION_EYE_BUTTON_CLASS,
  ACTIVE_DRILL_OPTIONS_LIST_CLASS,
  ACTIVE_DRILL_PASSAGE_PANE_CLASS,
  ACTIVE_DRILL_PASSAGE_TEXT_CLASS,
  ACTIVE_DRILL_QUESTION_PANEL_WITH_WIDGET_CLASS,
  ACTIVE_DRILL_QUESTION_PANE_CLASS,
  ACTIVE_DRILL_SIDE_WIDGET_COLLAPSED_CLASS,
  ACTIVE_DRILL_SIDE_WIDGET_EXPANDED_CLASS,
  ACTIVE_DRILL_SIDE_WIDGET_ITEM_CLASS,
  ACTIVE_DRILL_SIDE_WIDGET_ITEM_EXPANDED_CLASS,
  ACTIVE_DRILL_STEM_GRID_CLASS,
  ACTIVE_DRILL_STEM_NUMBER_CLASS,
  ACTIVE_DRILL_STEM_SECTION_CLASS,
  ACTIVE_DRILL_STEM_TEXT_CLASS,
  ACTIVE_DRILL_OPTION_LETTER_SELECTED_CLASS,
  ACTIVE_DRILL_OPTION_LETTER_UNSELECTED_CLASS,
  ACTIVE_DRILL_OPTION_ROW_MASKED_CLASS,
  PASSAGE_HIGHLIGHT_POPOVER_CARD_CLASS,
  PASSAGE_HIGHLIGHT_POPOVER_HEADER_CLASS,
  PASSAGE_HIGHLIGHT_POPOVER_SWATCH_CLASS,
  PASSAGE_HIGHLIGHT_POPOVER_SWATCH_ROW_CLASS,
  PASSAGE_HIGHLIGHT_REMOVE_CARD_CLASS,
  ACTIVE_DRILL_OPTION_ROW_SELECTED_CLASS,
  ACTIVE_DRILL_OPTION_ROW_UNSELECTED_CLASS,
  ACTIVE_DRILL_RESET_RESPONSE_BUTTON_CLASS,
  FINISH_MENU_ACTION_ITEM_CLASS,
  FINISH_MENU_ACTION_ITEM_ICON_CLASS,
  FINISH_MENU_ACTIONS_PANEL_CLASS,
  FINISH_MENU_OPEN_PANEL_CLASS,
  FINISH_MENU_OPEN_TRIGGER_CLASS,
  FINISH_MENU_PANEL_WIDTH_PX,
  FINISH_MENU_WIDTH_PX,
  EXAM_MORE_PANEL_ACTION_CLASS,
  EXAM_MORE_PANEL_ACTION_ICON_WRAP_CLASS,
  EXAM_MORE_PANEL_CLASS,
  EXAM_MORE_PANEL_CLOSE_BUTTON_CLASS,
  EXAM_MORE_PANEL_CLOSE_ROW_CLASS,
  EXAM_MORE_PANEL_DIVIDER_CLASS,
  EXAM_MORE_PANEL_DIVIDER_WRAP_CLASS,
  EXAM_MORE_PANEL_OVERLAY_CLASS,
  EXAM_MORE_PANEL_TOGGLE_LABEL_CLASS,
  EXAM_MORE_PANEL_TOGGLE_ROW_CLASS,
  PRACTICE_SESSION_HEADER_CONTROL_RADIUS_CLASS,
  PRACTICE_SESSION_TIMER_PROGRESS_RADIUS_CLASS,
  SESSION_FINISH_BUTTON_CLASS,
}
