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
  "flex w-[126px] flex-col drop-shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"

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

/** Figma header — find-text field (pill) */
const ACTIVE_DRILL_FIND_TEXT_INPUT_CLASS =
  "h-[52px] w-[min(320px,36vw)] min-w-[200px] shrink-0 rounded-[26px] border border-[#dfe1e7] bg-[#f6f8fa] px-5 py-2 text-sm font-normal leading-[1.5] tracking-[0.28px] text-[#0d0d12] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] outline-none placeholder:text-[#818898]"

/** Figma header — highlighter + eraser group */
const ACTIVE_DRILL_HEADER_TOOL_GROUP_CLASS =
  "flex h-[52px] shrink-0 items-center gap-1.5 rounded-[16px] border border-[#dfe1e7] bg-white px-3"

/** Figma header — standalone underline control */
const ACTIVE_DRILL_HEADER_UNDERLINE_BUTTON_CLASS =
  "inline-flex size-[52px] shrink-0 items-center justify-center rounded-[16px] border border-[#dfe1e7] bg-white text-sm font-bold text-[#666d80] transition hover:bg-[#f6f8fa] hover:text-[#062357]"

/** Figma header — question progress label */
const ACTIVE_DRILL_HEADER_PROGRESS_CLASS =
  "shrink-0 whitespace-nowrap text-sm font-medium tracking-[0.28px] text-[#666d80]"

/** Figma header — more-options trigger */
const ACTIVE_DRILL_HEADER_MORE_BUTTON_CLASS =
  "inline-flex size-[52px] shrink-0 items-center justify-center rounded-[16px] border border-[#dfe1e7] bg-white text-[#666d80] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition hover:bg-[#f6f8fa] hover:text-[#062357]"

/** Figma `18617:31668` — selected answer choice row */
const ACTIVE_DRILL_OPTION_ROW_SELECTED_CLASS =
  "rounded-[16px] border border-[#0d47a1] bg-[#f3f7ff] p-4 shadow-[0px_12px_8px_rgba(13,13,18,0.08),0px_4px_3px_rgba(13,13,18,0.03)]"

/** Figma `18617:31670` / `18617:31678` — choice letter badges */
const ACTIVE_DRILL_OPTION_LETTER_SELECTED_CLASS =
  "border-2 border-[#0d47a1] bg-[#0d47a1] text-base font-semibold leading-6 text-white"

const ACTIVE_DRILL_OPTION_LETTER_UNSELECTED_CLASS =
  "border-2 border-[#dfe1e7] bg-white text-base font-semibold leading-6 text-[#0d0d12]"

/** Figma `18617:31663` / `18781:29066` — 36×36 flag / eye controls */
const ACTIVE_DRILL_ACTION_BUTTON_CLASS =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#666d80] transition hover:text-[#062357]"

/** Figma `19641:44925` — two-column exam body grid */
const ACTIVE_DRILL_BODY_GRID_CLASS =
  "px-[23px] pt-[23px] lg:grid-cols-[minmax(0,524px)_minmax(0,1fr)]"

/** Figma `19641:44925` — passage column with vertical divider */
const ACTIVE_DRILL_PASSAGE_PANE_CLASS =
  "border-b border-[#dfe1e7] pb-[23px] lg:border-b-0 lg:border-r lg:pb-0 lg:pr-[23px]"

/** Figma `19641:44925` — question + answers column */
const ACTIVE_DRILL_QUESTION_PANE_CLASS = "pt-[23px] lg:pt-0 lg:pl-[23px]"

/** Figma `19641:44925` — stimulus / passage typography */
const ACTIVE_DRILL_PASSAGE_TEXT_CLASS = "text-[1.125em] leading-[1.5] text-[color:inherit]"

/** Figma `18781:29066` — collapsed side widget pill */
const ACTIVE_DRILL_SIDE_WIDGET_COLLAPSED_CLASS =
  "w-11 items-center gap-1 rounded-[20px] border border-[#dfe1e7] bg-white py-3 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"

/** Figma `18781:29066` — expanded side widget panel */
const ACTIVE_DRILL_SIDE_WIDGET_EXPANDED_CLASS =
  "w-[200px] gap-0.5 rounded-[16px] border border-[#dfe1e7] bg-white py-2 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"

const ACTIVE_DRILL_SIDE_WIDGET_ITEM_CLASS =
  "inline-flex size-9 items-center justify-center rounded-[10px] text-[#666d80] transition hover:bg-[#f6f8fa] hover:text-[#062357]"

const ACTIVE_DRILL_SIDE_WIDGET_ITEM_EXPANDED_CLASS =
  "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[#666d80] transition hover:bg-[#f6f8fa] hover:text-[#062357]"

/** Figma `18781:29066` — room for floating side widget */
const ACTIVE_DRILL_QUESTION_PANEL_WITH_WIDGET_CLASS = "relative min-w-0 pr-14"

/** Figma `18617:31667` — options list spacing */
const ACTIVE_DRILL_OPTIONS_LIST_CLASS = "flex flex-col gap-4 pb-4 pt-4"

/** Figma response masking — diagonal-lined choice row */
const ACTIVE_DRILL_OPTION_ROW_MASKED_CLASS = "practice-session-choice-masked bg-[#f6f8fa]"

/** Figma response masking — reset masked choices */
const ACTIVE_DRILL_RESET_RESPONSE_BUTTON_CLASS =
  "inline-flex h-10 items-center justify-center rounded-[12px] border border-[#dfe1e7] bg-white px-4 text-sm font-medium leading-[1.5] tracking-[0.28px] text-[#666d80] transition hover:bg-[#f6f8fa]"

/** Figma `18617:31676` — unselected answer choice row */
const ACTIVE_DRILL_OPTION_ROW_UNSELECTED_CLASS = "rounded-[16px] py-1 pl-4 pr-4"

/** Figma `18617:31659` — question stem section (top flush with passage column) */
const ACTIVE_DRILL_STEM_SECTION_CLASS = "shrink-0 pb-3 pt-0"

/** Figma `18617:31676` / `18617:31668` — choice row grid (letter | gap | text) */
const ACTIVE_DRILL_CHOICE_ROW_GRID_CLASS =
  "grid w-full grid-cols-[32px_16px_minmax(0,1fr)] items-start"

/** Inline eye column when not using the side rail */
const ACTIVE_DRILL_CHOICE_ROW_GRID_WITH_ACTION_CLASS =
  "grid w-full grid-cols-[32px_16px_minmax(0,1fr)_36px] items-start"

/** Figma `18617:31660` — stem text (flag lives in side rail) */
const ACTIVE_DRILL_STEM_GRID_CLASS = "min-w-0"

/** Figma `18617:31674` / `18617:31682` — hide-choice control */
const ACTIVE_DRILL_OPTION_EYE_BUTTON_CLASS = ACTIVE_DRILL_ACTION_BUTTON_CLASS

/** Figma `19641:45187` — prev/next labeled pill controls (review panel, etc.) */
const ACTIVE_DRILL_NAV_ARROW_BUTTON_CLASS =
  "box-border inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-[12px] border border-[#dfe1e7] bg-[#f6f8fa] px-3 text-sm font-medium leading-[1.5] tracking-[0.28px] text-[#4a5568] transition hover:bg-white disabled:pointer-events-none disabled:text-[#a4acb9]"

/** Figma `19641:45187` — footer prev/next, same 32px height as question pills */
const ACTIVE_DRILL_FOOTER_NAV_ARROW_BUTTON_CLASS =
  "box-border inline-flex h-8 min-w-[72px] shrink-0 items-center justify-center gap-1 rounded-[8px] border border-[#dfe1e7] bg-[#f6f8fa] px-2 text-sm font-medium leading-none tracking-[0.28px] text-[#4a5568] transition hover:bg-white disabled:pointer-events-none disabled:text-[#a4acb9] [&_svg]:size-3.5"

/** Figma `19641:45187` — flag spacer + control column (prev/next) */
const ACTIVE_DRILL_FOOTER_NAV_ARROW_COLUMN_CLASS = "flex shrink-0 flex-col items-center gap-1"

/** Figma `19641:45187` — compact arrow-only control (blind review overrides) */
const ACTIVE_DRILL_NAV_ARROW_ICON_BUTTON_CLASS =
  "box-border inline-flex size-12 shrink-0 items-center justify-center rounded-[20px] border border-[#dfe1e7] bg-white shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition hover:bg-[#f0f5ff] disabled:pointer-events-none"

/** Figma `19641:45187` — centered question number row */
const ACTIVE_DRILL_FOOTER_NAV_GRID_CLASS =
  "practice-session-question-nav-grid practice-session-scroll-hidden flex min-h-12 min-w-0 max-w-full flex-nowrap items-start justify-center gap-2 overflow-x-auto overflow-y-hidden"

/** Figma `19641:45187` — prev, numbers, and next as one centered group */
const ACTIVE_DRILL_FOOTER_NAV_CLUSTER_CLASS =
  "flex min-w-0 max-w-full items-start justify-center gap-2"

/** Figma drill footer — white shell */
const ACTIVE_DRILL_FOOTER_CLASS =
  "box-border flex min-h-[72px] shrink-0 flex-col items-center justify-center rounded-none border-t border-[#dfe1e7] bg-white px-6 py-3"

const ACTIVE_DRILL_FOOTER_ROW_CLASS =
  "flex min-h-[56px] w-full min-w-0 items-center justify-center"

/** Figma `19641:45187` — flagged question indicator above pill */
const ACTIVE_DRILL_QUESTION_NAV_FLAG_CLASS =
  "size-3 shrink-0 fill-[#0d47a1] text-[#0d47a1]"

const ACTIVE_DRILL_QUESTION_NAV_FLAG_SLOT_CLASS =
  "flex h-3 w-8 shrink-0 items-center justify-center"

/** Figma `19641:45187` — question pill + optional flag stack */
const ACTIVE_DRILL_QUESTION_NAV_ITEM_CLASS =
  "flex w-8 shrink-0 flex-col items-center gap-1"

/** Figma `19641:45187` — square question number pill */
const ACTIVE_DRILL_QUESTION_NAV_BUTTON_CLASS =
  "practice-session-question-nav-btn box-border relative inline-flex size-8 shrink-0 items-center justify-center rounded-[8px] text-sm font-semibold leading-none tracking-[0.28px] transition-colors"

/** Figma `19641:45187` — current question */
const ACTIVE_DRILL_QUESTION_NAV_BUTTON_ACTIVE_CLASS =
  "border border-[#0d47a1] bg-[#0d47a1] text-white"

/** Figma `19641:45187` — answered, not current */
const ACTIVE_DRILL_QUESTION_NAV_BUTTON_ANSWERED_CLASS =
  "border border-[#0d47a1] bg-white text-[#062357]"

/** Figma `19641:45187` — unvisited */
const ACTIVE_DRILL_QUESTION_NAV_BUTTON_DEFAULT_CLASS =
  "border border-[#dfe1e7] bg-[#f6f8fa] text-[#666d80]"

export {
  ACTIVE_DRILL_ACTION_BUTTON_CLASS,
  ACTIVE_DRILL_BODY_GRID_CLASS,
  ACTIVE_DRILL_CHOICE_ROW_GRID_CLASS,
  ACTIVE_DRILL_CHOICE_ROW_GRID_WITH_ACTION_CLASS,
  ACTIVE_DRILL_HEADER_MORE_BUTTON_CLASS,
  ACTIVE_DRILL_HEADER_PROGRESS_CLASS,
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
  ACTIVE_DRILL_STEM_SECTION_CLASS,
  ACTIVE_DRILL_OPTION_LETTER_SELECTED_CLASS,
  ACTIVE_DRILL_OPTION_LETTER_UNSELECTED_CLASS,
  ACTIVE_DRILL_OPTION_ROW_MASKED_CLASS,
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
  PRACTICE_SESSION_HEADER_CONTROL_RADIUS_CLASS,
  PRACTICE_SESSION_TIMER_PROGRESS_RADIUS_CLASS,
  SESSION_FINISH_BUTTON_CLASS,
}
