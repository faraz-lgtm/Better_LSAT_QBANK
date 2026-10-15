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
  `h-[52px] w-[126px] shrink-0 gap-2 ${PRACTICE_SESSION_HEADER_CONTROL_RADIUS_CLASS} border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-3 py-2 text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)]`

/** Figma `18617:26214` finish dropdown trigger (section / prep test, closed) */
const SESSION_FINISH_BUTTON_CLASS =
  `h-[52px] w-[126px] shrink-0 gap-2 ${PRACTICE_SESSION_HEADER_CONTROL_RADIUS_CLASS} border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-3 py-2 text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)]`

/** Figma `18704:14485` finish dropdown open panel */
const FINISH_MENU_OPEN_PANEL_CLASS =
  "flex flex-col drop-shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"

/** Figma `18704:14488` finish row when open — matches closed trigger typography */
const FINISH_MENU_OPEN_TRIGGER_CLASS =
  "flex h-[52px] w-full items-center justify-between gap-2 rounded-t-[16px] border border-[var(--greyscale-100)] bg-[var(--primary-25)] px-3 py-2 text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)]"

/** Figma `19641:45663` — action rows container */
const FINISH_MENU_ACTIONS_PANEL_CLASS =
  "flex flex-col gap-1 rounded-b-[16px] border border-t-0 border-[var(--greyscale-100)] bg-[var(--greyscale-25)] p-2"

/** Figma `19641:45663` — submit / save & exit row */
const FINISH_MENU_ACTION_ITEM_CLASS =
  "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm font-medium leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)] transition-colors hover:bg-[var(--greyscale-50)]"

/** Figma `19641:45663` — row icon */
const FINISH_MENU_ACTION_ITEM_ICON_CLASS = "size-5 shrink-0 text-[var(--greyscale-500)]"

/** Figma `20268:100328` — exam more panel (3-dots) */
const EXAM_MORE_PANEL_OVERLAY_CLASS =
  "fixed inset-0 z-[200] bg-[rgba(0,0,0,0.3)] backdrop-blur-[3px]"

const EXAM_MORE_PANEL_CLASS =
  "fixed inset-y-0 right-0 z-[210] flex h-full w-[360px] flex-col items-start bg-[var(--primary-0)] p-3"

const EXAM_MORE_PANEL_CLOSE_ROW_CLASS = "flex h-12 w-full shrink-0 items-center justify-end"

const EXAM_MORE_PANEL_CLOSE_BUTTON_CLASS =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[var(--color-student-heading)] transition hover:bg-[var(--greyscale-0)]/70"

const EXAM_MORE_PANEL_ACTION_CLASS =
  "flex h-12 w-full shrink-0 items-center gap-2 rounded-[14px] p-2 text-left text-[18px] font-medium leading-[1.4] tracking-[0.36px] text-[var(--color-student-heading)] transition-colors hover:bg-[var(--greyscale-0)]/70 disabled:pointer-events-none disabled:opacity-50"

const EXAM_MORE_PANEL_ACTION_ICON_WRAP_CLASS =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px]"

const EXAM_MORE_PANEL_DIVIDER_WRAP_CLASS = "flex w-full shrink-0 flex-col items-start py-2"

const EXAM_MORE_PANEL_DIVIDER_CLASS =
  "h-[3px] w-full border-b-2 border-t border-[var(--greyscale-100)]"

const EXAM_MORE_PANEL_TOGGLE_ROW_CLASS =
  "flex h-12 w-full shrink-0 items-center justify-between rounded-[14px] p-2"

const EXAM_MORE_PANEL_TOGGLE_LABEL_CLASS =
  "text-[18px] font-medium leading-[1.4] tracking-[0.36px] text-[var(--color-student-heading)]"

/** Figma `20268:105580` — exam header chrome (compact on phone, desktop sizing from md) */
const ACTIVE_DRILL_HEADER_SHELL_CLASS =
  "practice-session-header practice-session-header--active-drill box-border flex h-auto min-h-0 shrink-0 flex-col overflow-hidden rounded-none border-b border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-3 py-2 md:h-[120px] md:overflow-visible md:border-b-0 md:px-10 md:py-6"

const ACTIVE_DRILL_HEADER_STACK_CLASS = "flex w-full flex-col justify-center gap-2 md:gap-4"

/** Mobile-only compact chrome — mirrors official exam mobile header structure */
const ACTIVE_DRILL_MOBILE_HEADER_CLASS =
  "grid w-full min-w-0 grid-cols-[36px_minmax(0,1fr)_36px] items-center gap-1 border-b border-[var(--greyscale-100)] pb-2 md:hidden"

const ACTIVE_DRILL_MOBILE_HEADER_TITLE_BUTTON_CLASS =
  "inline-flex min-w-0 max-w-full items-center justify-center gap-1 justify-self-center px-1"

const ACTIVE_DRILL_MOBILE_HEADER_TITLE_CLASS =
  "m-0 min-w-0 truncate text-center text-[15px] font-bold leading-[22px] text-[var(--color-student-heading)]"

const ACTIVE_DRILL_MOBILE_META_ROW_CLASS =
  "flex w-full min-w-0 items-center justify-between gap-2 md:hidden"

const ACTIVE_DRILL_MOBILE_META_RIGHT_CLASS =
  "flex min-w-0 items-center gap-1.5 text-[12px] font-medium leading-[18px] text-[var(--greyscale-500)]"

const ACTIVE_DRILL_MOBILE_FIND_INPUT_CLASS =
  "h-9 w-full min-w-0 rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-3 text-sm font-normal leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)] outline-none placeholder:text-[var(--greyscale-400)] md:hidden"

const ACTIVE_DRILL_MOBILE_TOOLS_BUTTON_CLASS =
  "inline-flex size-9 shrink-0 items-center justify-center justify-self-end rounded-[10px] text-[var(--color-student-heading)] transition hover:bg-[var(--greyscale-25)]"

/** Same Passage / Question dropdown pattern as official mobile header */
const ACTIVE_DRILL_MOBILE_PANE_TABS_CLASS =
  "grid w-full min-w-0 grid-cols-2 gap-[5px] border-b border-[var(--greyscale-100)] bg-[var(--greyscale-25)] p-2 md:hidden"

const ACTIVE_DRILL_MOBILE_PANE_TAB_CLASS =
  "inline-flex min-h-10 items-center justify-center gap-[7px] rounded-[8px] text-[13px] font-semibold leading-[19.5px] tracking-[-0.076px] transition"

const ACTIVE_DRILL_MOBILE_PANE_TAB_ACTIVE_CLASS =
  "bg-[var(--greyscale-0)] text-[var(--primary)] shadow-[0px_1px_2px_rgba(13,13,18,0.1)]"

const ACTIVE_DRILL_MOBILE_PANE_TAB_INACTIVE_CLASS = "bg-transparent text-[var(--greyscale-500)]"

/** Solo Passage/Question tab — fill remaining height and scroll inside the pane. */
const ACTIVE_DRILL_PANE_MOBILE_SOLO_CLASS = "max-md:min-h-0 max-md:flex-1 max-md:overflow-y-auto"

const ACTIVE_DRILL_DESKTOP_HEADER_BLOCK_CLASS = "hidden w-full min-w-0 flex-col gap-4 md:flex"

const ACTIVE_DRILL_HEADER_ROW_CLASS =
  "flex h-[52px] w-full min-w-0 items-center justify-between"

const ACTIVE_DRILL_HEADER_LEFT_CLASS = "flex min-w-0 items-center gap-6"

const ACTIVE_DRILL_HEADER_RIGHT_CLASS = "flex h-[52px] shrink-0 items-center gap-2.5"

const ACTIVE_DRILL_HEADER_TITLE_CLASS =
  "m-0 min-w-0 truncate text-[24px] font-bold leading-[1.3] text-[var(--color-student-heading)]"

/** Figma `20268:105580` — find-text field 200×52 */
const ACTIVE_DRILL_FIND_TEXT_INPUT_CLASS =
  "h-[52px] w-[200px] shrink-0 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-4 py-2 text-sm font-normal leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] outline-none placeholder:text-[var(--greyscale-400)]"

/** LSAT header — Passage Only View, same toggle chrome as official */
const ACTIVE_DRILL_HEADER_PILL_BUTTON_CLASS =
  "inline-flex h-[52px] shrink-0 items-center justify-center rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-4 text-sm font-medium leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)] transition hover:bg-[var(--greyscale-25)]"

const ACTIVE_DRILL_HEADER_PILL_BUTTON_PRESSED_CLASS =
  "border-[var(--primary)] bg-[var(--primary-25)] text-[var(--primary)]"

/** Figma `20268:105580` — timer card 222×52 (desktop); compact pill on phone */
const ACTIVE_DRILL_HEADER_TIMER_CLASS =
  "practice-session-timer flex h-8 w-auto max-w-full shrink-0 items-center overflow-visible rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-2 md:h-[52px] md:w-[222px] md:rounded-[16px] md:px-3"

const ACTIVE_DRILL_HEADER_PROGRESS_TRACK_CLASS =
  "relative h-1 w-full overflow-hidden rounded-[5px] bg-[var(--greyscale-50)]"

const ACTIVE_DRILL_HEADER_PROGRESS_FILL_CLASS =
  "absolute left-0 top-0 h-full rounded-[5px] bg-[var(--primary)] transition-[width] duration-300 ease-linear"

/** Figma header — highlighter + eraser group */
const ACTIVE_DRILL_HEADER_TOOL_GROUP_CLASS =
  "flex h-[52px] shrink-0 items-center gap-1.5 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-3"

/** Figma header — standalone underline control */
const ACTIVE_DRILL_HEADER_UNDERLINE_BUTTON_CLASS =
  "inline-flex size-[52px] shrink-0 items-center justify-center rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-sm font-bold text-[var(--greyscale-500)] transition hover:bg-[var(--greyscale-25)] hover:text-[var(--color-student-heading)]"

/** Figma `20268:105580` — question progress label */
const ACTIVE_DRILL_HEADER_PROGRESS_CLASS =
  "h-5 shrink-0 whitespace-nowrap text-xs font-medium leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)] md:text-sm"

/** Figma `20268:105580` — pause / more 54×52 (desktop); compact on phone */
const ACTIVE_DRILL_HEADER_ICON_BUTTON_CLASS =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] transition hover:bg-[var(--greyscale-25)] md:h-[52px] md:w-[54px] md:rounded-[16px]"

/** Figma `20268:105580` — close 36×36 */
const ACTIVE_DRILL_HEADER_CLOSE_BUTTON_CLASS =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[var(--color-student-heading)] transition hover:bg-[var(--greyscale-25)]"

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
  "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[var(--greyscale-500)] transition hover:text-[var(--color-student-heading)]"

/** Figma LSAT default — equal two-column exam body (tighter pad on phones) */
const ACTIVE_DRILL_BODY_GRID_CLASS = "px-3 pt-3 md:px-6 md:pt-6 lg:grid-cols-2"

/**
 * Mobile stacked (stimulus + question): content grows; the body scrolls.
 * Desktop keeps the 2-col grid with per-pane scroll.
 */
const ACTIVE_DRILL_BODY_GRID_MOBILE_STACKED_CLASS =
  "max-md:flex max-md:flex-col max-md:h-auto max-md:overflow-visible md:grid md:min-h-0 md:overflow-hidden"

/** Figma LSAT default — passage column with vertical divider */
const ACTIVE_DRILL_PASSAGE_PANE_CLASS =
  "border-b border-[var(--greyscale-100)] pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6"

/** Passage Only View — full-width passage, no question-column divider */
const ACTIVE_DRILL_PASSAGE_PANE_ONLY_CLASS =
  "border-b border-[var(--greyscale-100)] pb-6 lg:border-b-0 lg:pb-0"

/** Mobile stacked — passage grows with content (not clipped). */
const ACTIVE_DRILL_PASSAGE_PANE_MOBILE_STACKED_CLASS =
  "max-md:!h-auto max-md:!min-h-0 max-md:!max-h-none max-md:flex-none max-md:shrink-0 max-md:!overflow-visible"

/** Figma LSAT default — question + answers column */
const ACTIVE_DRILL_QUESTION_PANE_CLASS = "pt-6 lg:pt-0 lg:pl-6"

/** Mobile stacked — question/options grow; parent body scrolls to the footer. */
const ACTIVE_DRILL_QUESTION_PANE_MOBILE_STACKED_CLASS =
  "practice-session-pane--mobile-question-stack max-md:!h-auto max-md:!min-h-0 max-md:!max-h-none max-md:flex-none max-md:shrink-0 max-md:!overflow-visible max-md:pb-6"

/** Figma `19641:44925` — stimulus / passage typography */
const ACTIVE_DRILL_PASSAGE_TEXT_CLASS = "text-[1.125em] leading-[30px] text-[color:inherit]"

/** Figma `20268:102762` — LSAT default side widget */
const ACTIVE_DRILL_SIDE_WIDGET_COLLAPSED_CLASS =
  "items-center gap-2 rounded-[14px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-2.5 py-3 shadow-[0px_12px_8px_rgba(13,13,18,0.08),0px_4px_3px_rgba(13,13,18,0.03)]"

/** Figma `18781:29066` — expanded side widget panel */
const ACTIVE_DRILL_SIDE_WIDGET_EXPANDED_CLASS =
  "w-[200px] gap-0.5 rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] py-2 shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"

const ACTIVE_DRILL_SIDE_WIDGET_ITEM_CLASS =
  "inline-flex size-9 items-center justify-center rounded-[10px] text-[var(--greyscale-500)] transition hover:bg-[var(--greyscale-0)] hover:text-[var(--color-student-heading)]"

const ACTIVE_DRILL_SIDE_WIDGET_ITEM_EXPANDED_CLASS =
  "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[var(--greyscale-500)] transition hover:bg-[var(--greyscale-25)] hover:text-[var(--color-student-heading)]"

/** Stem + choices column; sits beside the in-flow side widget. */
const ACTIVE_DRILL_QUESTION_PANEL_MAIN_CLASS = "min-w-0 flex-1"

/** Figma `18781:29066` — answers and floating side widget in one row (no overlay). */
const ACTIVE_DRILL_QUESTION_PANEL_WITH_WIDGET_CLASS =
  "practice-session-question-panel-with-widget relative flex min-w-0 items-start gap-3"

/** Figma `20268:102788` — 11px stack: choices then Reset */
const ACTIVE_DRILL_OPTIONS_LIST_CLASS = "mt-[11px] flex w-full flex-col items-end gap-[11px]"

/** LSAT exam layout — same 14px unselected card; letter + copy fade via CSS. */
const ACTIVE_DRILL_OPTION_ROW_MASKED_CLASS =
  "practice-session-choice-masked practice-session-choice--unselected w-full overflow-hidden rounded-[14px] border border-solid py-2 pl-2 pr-6"

/** Passage highlight selection popover (Figma `20280:108155` highlight UI) */
const PASSAGE_HIGHLIGHT_POPOVER_CARD_CLASS =
  "flex min-w-[168px] flex-col gap-2 rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] p-2 shadow-[0px_8px_24px_rgba(13,13,18,0.16),0px_2px_6px_rgba(13,13,18,0.08)]"

const PASSAGE_HIGHLIGHT_POPOVER_HEADER_CLASS =
  "flex h-7 w-full items-center gap-2 text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)]"

const PASSAGE_HIGHLIGHT_POPOVER_SWATCH_ROW_CLASS = "flex w-full items-center justify-between px-0.5"

const PASSAGE_HIGHLIGHT_POPOVER_SWATCH_CLASS =
  "relative box-border size-5 shrink-0 rounded-[5px] border-2 border-solid border-[var(--greyscale-100)]"

const PASSAGE_HIGHLIGHT_REMOVE_CARD_CLASS =
  "flex h-9 items-center gap-2 rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] px-3 shadow-[0px_8px_24px_rgba(13,13,18,0.16),0px_2px_6px_rgba(13,13,18,0.08)] text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)]"

/** Figma `20268:105681` — Reset Response 34×auto gray pill */
const ACTIVE_DRILL_RESET_RESPONSE_BUTTON_CLASS =
  "practice-session-reset-response inline-flex h-[34px] shrink-0 items-center justify-center rounded-[6px] bg-[var(--greyscale-25)] px-3 text-sm font-normal leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)] transition hover:bg-[var(--greyscale-50)]"

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
  "min-w-0 flex-1 text-sm font-semibold leading-[30px] tracking-[0.28px] text-[color:inherit] [&_ol]:m-0 [&_ol]:list-decimal [&_ol]:pl-7 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0"

const ACTIVE_DRILL_STEM_NUMBER_CLASS =
  "shrink-0 text-sm font-semibold leading-[30px] tracking-[0.28px] text-[color:inherit]"

/** Figma `18617:31674` / `18617:31682` — hide-choice control */
const ACTIVE_DRILL_OPTION_EYE_BUTTON_CLASS = ACTIVE_DRILL_ACTION_BUTTON_CLASS

/** Figma `19641:45187` — prev/next labeled pill controls (review panel, etc.) */
const ACTIVE_DRILL_NAV_ARROW_BUTTON_CLASS =
  "box-border inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-[12px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-3 text-sm font-medium leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)] transition hover:bg-[var(--greyscale-0)] disabled:pointer-events-none disabled:text-[var(--greyscale-400)]"

/** Figma `20268:107659` — footer prev/next, 28×28 icon-only */
const ACTIVE_DRILL_FOOTER_NAV_ARROW_BUTTON_CLASS =
  "box-border inline-flex size-7 shrink-0 items-center justify-center rounded-[6px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] p-0 text-[var(--greyscale-500)] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition hover:bg-[var(--greyscale-0)] disabled:pointer-events-none disabled:opacity-40"

/** Figma `20268:107659` — prev/next align with pills; flags sit above the 28px row */
const ACTIVE_DRILL_FOOTER_NAV_ARROW_COLUMN_CLASS = "flex shrink-0 items-end self-end"

/** Figma `19641:45187` — compact arrow-only control (blind review overrides) */
const ACTIVE_DRILL_NAV_ARROW_ICON_BUTTON_CLASS =
  "box-border inline-flex size-12 shrink-0 items-center justify-center rounded-[20px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition hover:bg-[var(--primary-25)] disabled:pointer-events-none"

/** Figma `20268:107659` — left-aligned question number row; flags sit above pills */
const ACTIVE_DRILL_FOOTER_NAV_GRID_CLASS =
  "practice-session-question-nav-grid practice-session-scroll-hidden flex min-w-0 max-w-full flex-nowrap items-end justify-start gap-2 overflow-x-auto overflow-y-hidden"

/** Figma `20268:107661` — prev, numbers, and next as one left-aligned group */
const ACTIVE_DRILL_FOOTER_NAV_CLUSTER_CLASS =
  "flex min-w-0 max-w-full items-end justify-start gap-2 px-2"

/** Figma `20268:107659` — footer chrome, 72px; flags + 28px pills vertically centered */
const ACTIVE_DRILL_FOOTER_CLASS =
  "box-border flex h-[72px] shrink-0 flex-col justify-center overflow-visible rounded-none border-t border-[var(--greyscale-100)] bg-[var(--greyscale-0)]"

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
  "border border-[var(--primary)] bg-[var(--primary-25)] text-[var(--primary)]"

/** Figma `20268:107664` — answered, not current */
const ACTIVE_DRILL_QUESTION_NAV_BUTTON_ANSWERED_CLASS =
  "border border-[var(--primary-border)] bg-[var(--primary)] text-white"

/** Figma `20268:107668` — unvisited; hover matches current */
const ACTIVE_DRILL_QUESTION_NAV_BUTTON_DEFAULT_CLASS =
  "border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-[var(--color-student-heading)] hover:border-[var(--primary)] hover:bg-[var(--primary-25)] hover:text-[var(--primary)]"

export {
  ACTIVE_DRILL_ACTION_BUTTON_CLASS,
  ACTIVE_DRILL_BODY_GRID_CLASS,
  ACTIVE_DRILL_BODY_GRID_MOBILE_STACKED_CLASS,
  ACTIVE_DRILL_CHOICE_ROW_GRID_CLASS,
  ACTIVE_DRILL_CHOICE_ROW_GRID_WITH_ACTION_CLASS,
  ACTIVE_DRILL_DESKTOP_HEADER_BLOCK_CLASS,
  ACTIVE_DRILL_HEADER_CLOSE_BUTTON_CLASS,
  ACTIVE_DRILL_HEADER_ICON_BUTTON_CLASS,
  ACTIVE_DRILL_HEADER_LEFT_CLASS,
  ACTIVE_DRILL_HEADER_MORE_BUTTON_CLASS,
  ACTIVE_DRILL_HEADER_PILL_BUTTON_CLASS,
  ACTIVE_DRILL_HEADER_PILL_BUTTON_PRESSED_CLASS,
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
  ACTIVE_DRILL_MOBILE_FIND_INPUT_CLASS,
  ACTIVE_DRILL_MOBILE_HEADER_CLASS,
  ACTIVE_DRILL_MOBILE_HEADER_TITLE_BUTTON_CLASS,
  ACTIVE_DRILL_MOBILE_HEADER_TITLE_CLASS,
  ACTIVE_DRILL_MOBILE_META_RIGHT_CLASS,
  ACTIVE_DRILL_MOBILE_META_ROW_CLASS,
  ACTIVE_DRILL_MOBILE_PANE_TAB_ACTIVE_CLASS,
  ACTIVE_DRILL_MOBILE_PANE_TAB_CLASS,
  ACTIVE_DRILL_MOBILE_PANE_TAB_INACTIVE_CLASS,
  ACTIVE_DRILL_MOBILE_PANE_TABS_CLASS,
  ACTIVE_DRILL_MOBILE_TOOLS_BUTTON_CLASS,
  ACTIVE_DRILL_PANE_MOBILE_SOLO_CLASS,
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
  ACTIVE_DRILL_PASSAGE_PANE_MOBILE_STACKED_CLASS,
  ACTIVE_DRILL_PASSAGE_PANE_ONLY_CLASS,
  ACTIVE_DRILL_PASSAGE_TEXT_CLASS,
  ACTIVE_DRILL_QUESTION_PANEL_MAIN_CLASS,
  ACTIVE_DRILL_QUESTION_PANEL_WITH_WIDGET_CLASS,
  ACTIVE_DRILL_QUESTION_PANE_CLASS,
  ACTIVE_DRILL_QUESTION_PANE_MOBILE_STACKED_CLASS,
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
