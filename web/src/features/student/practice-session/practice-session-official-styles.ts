/** Figma `20255:49920` — Official LawHub exam chrome (full page) */

const OFFICIAL_IMMERSIVE_FRAME_CLASS = "bg-[var(--background)] p-0"

/** Figma normal exam canvas is 1440px; Full Screen / full-width raises this to 1920px. */
const EXAM_CARD_FULL_WIDTH_CLASS = "practice-session-card--full-width max-w-[1920px]"

const OFFICIAL_CARD_CLASS =
  "practice-session-card practice-session-card--active-drill practice-session-card--official relative mx-auto flex h-full max-h-full min-h-0 w-full min-w-0 max-w-[1440px] flex-col overflow-hidden overflow-x-clip rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)]"

const OFFICIAL_HEADER_SHELL_CLASS =
  "practice-session-header practice-session-header--official box-border flex w-full min-w-0 max-w-full shrink-0 flex-col overflow-x-clip rounded-none bg-[var(--greyscale-0)]"

/** Figma `21453:49474` — mobile official header: close | title+chevron | tools menu */
const OFFICIAL_MOBILE_HEADER_CLASS =
  "grid w-full min-w-0 grid-cols-[40px_minmax(0,1fr)_44px] items-center border-b border-[#e7eaf0] px-3 pb-1 pt-2 md:hidden"

const OFFICIAL_MOBILE_HEADER_CLOSE_CLASS =
  "inline-flex size-10 items-center justify-center rounded-[12px] text-[var(--color-student-heading)] transition hover:bg-[var(--greyscale-25)]"

const OFFICIAL_MOBILE_HEADER_TITLE_BUTTON_CLASS =
  "inline-flex min-w-0 max-w-full items-center justify-center gap-[5px] justify-self-center px-1"

const OFFICIAL_MOBILE_HEADER_TITLE_CLASS =
  "m-0 min-w-0 truncate text-center text-[15px] font-bold leading-[22.5px] tracking-[-0.23px] text-[#16243b]"

const OFFICIAL_MOBILE_HEADER_TOOLS_CLASS =
  "inline-flex size-9 items-center justify-center justify-self-center rounded-[10px] text-[#2c3143] transition hover:bg-[var(--greyscale-25)]"

/** Mobile meta row under title: section · Question N of M · timer */
const OFFICIAL_MOBILE_META_ROW_CLASS =
  "flex w-full min-w-0 items-center justify-between gap-2 px-[18px] pb-2.5 pt-3 md:hidden"

const OFFICIAL_MOBILE_META_SECTION_CLASS =
  "m-0 shrink-0 text-[12px] font-bold leading-[18px] text-[#2f60a6]"

const OFFICIAL_MOBILE_META_RIGHT_CLASS =
  "flex min-w-0 items-center gap-2 text-[12px] font-normal leading-[18px] text-[#526079]"

/** Figma mobile — pill Find Text under header */
const OFFICIAL_MOBILE_FIND_WRAP_CLASS =
  "relative mx-[18px] mb-2.5 mt-3 flex h-[34px] w-[calc(100%-2.25rem)] min-w-0 items-center rounded-full border border-[#ced0e7] bg-[var(--greyscale-0)] px-3 md:hidden"

const OFFICIAL_MOBILE_FIND_INPUT_CLASS =
  "min-w-0 flex-1 bg-transparent pr-7 text-[14px] font-normal leading-normal text-[var(--color-student-heading)] outline-none placeholder:text-[rgba(44,49,67,0.5)]"

const OFFICIAL_MOBILE_FIND_ICON_CLASS =
  "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"

/** Figma `21452:48964` — thin progress under find on mobile */
const OFFICIAL_MOBILE_PROGRESS_TRACK_CLASS =
  "relative mt-2.5 h-[3px] w-full overflow-hidden bg-[#e7ebf2] md:hidden"

const OFFICIAL_MOBILE_PROGRESS_FILL_CLASS =
  "absolute left-0 top-0 h-full min-w-[18px] rounded-br-[3px] rounded-tr-[3px] bg-[#2f60a6] transition-[width] duration-300 ease-linear"

/**
 * Figma `21452:48966` — Passage / Question segmented control (mobile only).
 */
const OFFICIAL_MOBILE_PANE_TABS_CLASS =
  "grid w-full min-w-0 grid-cols-2 gap-[5px] border-b border-[#e2e6ed] bg-[#f0f3f7] p-2 md:hidden"

const OFFICIAL_MOBILE_PANE_TAB_CLASS =
  "inline-flex min-h-10 items-center justify-center gap-[7px] rounded-[8px] text-[13px] font-semibold leading-[19.5px] tracking-[-0.076px] transition"

const OFFICIAL_MOBILE_PANE_TAB_ACTIVE_CLASS =
  "bg-[var(--greyscale-0)] text-[#1e4f91] shadow-[0px_1px_2px_rgba(30,49,78,0.1)]"

const OFFICIAL_MOBILE_PANE_TAB_INACTIVE_CLASS = "bg-transparent text-[#657189]"

const OFFICIAL_DESKTOP_HEADER_BLOCK_CLASS = "hidden w-full min-w-0 flex-col md:flex"

const OFFICIAL_HEADER_UTILITY_ROW_CLASS =
  "flex min-h-[44px] w-full min-w-0 max-w-full items-center justify-between gap-2 px-2 py-1.5 max-md:flex-wrap sm:min-h-[50px] sm:gap-4 sm:px-[14px] sm:py-2"

const OFFICIAL_HEADER_LEFT_CLASS =
  "flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden sm:gap-4"

const OFFICIAL_HEADER_RIGHT_CLASS =
  "flex h-9 shrink-0 items-center gap-1.5 sm:gap-4"

const OFFICIAL_HEADER_CLOSE_BUTTON_CLASS =
  "inline-flex size-[22px] shrink-0 items-center justify-center text-[var(--color-student-heading)] transition hover:opacity-80"

const OFFICIAL_HEADER_PILL_BUTTON_CLASS =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-[6px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-2 text-[12px] font-normal leading-4 text-[var(--color-student-heading)] transition hover:bg-[var(--greyscale-50)] sm:h-[34px] sm:px-[11px] sm:text-[14px] sm:leading-5"

const OFFICIAL_HEADER_PILL_BUTTON_PRESSED_CLASS = "border-[var(--primary)] bg-[var(--primary-25)] text-[var(--primary)]"

const OFFICIAL_FIND_WRAP_CLASS =
  "hidden h-[34px] w-[192px] shrink-0 items-center gap-2 rounded-full border border-[var(--greyscale-300)] bg-[var(--greyscale-0)] px-3 md:flex"

const OFFICIAL_FIND_TEXT_INPUT_CLASS =
  "min-w-0 flex-1 bg-transparent text-[14px] font-normal leading-normal text-[var(--color-student-heading)] outline-none placeholder:text-[var(--greyscale-400)]"

const OFFICIAL_HEADER_PROGRESS_LABEL_CLASS =
  "h-[18px] shrink-0 whitespace-nowrap text-[12px] font-normal leading-5 text-[var(--color-student-heading)] sm:text-[14px]"

const OFFICIAL_HEADER_TIMER_WRAP_CLASS = "flex h-9 shrink-0 items-center"

const OFFICIAL_HEADER_TIMER_CLASS = "flex h-9 shrink-0 items-center gap-1.5 px-1 sm:px-2.5"

const OFFICIAL_HEADER_PAUSE_BUTTON_CLASS =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-[6px] transition hover:bg-[var(--greyscale-25)]"

const OFFICIAL_HEADER_MORE_BUTTON_CLASS =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-[6px] p-1 transition hover:bg-[var(--greyscale-25)]"

const OFFICIAL_HEADER_TITLE_ROW_CLASS =
  "flex min-h-0 w-full min-w-0 shrink-0 flex-col items-start justify-center px-3 pb-2 pt-1 sm:min-h-[56px] sm:px-4 sm:pb-4 sm:pt-2"

const OFFICIAL_HEADER_TITLE_CLASS =
  "m-0 min-w-0 max-w-full overflow-x-hidden text-ellipsis whitespace-nowrap text-[18px] font-normal leading-6 tracking-[-0.5px] text-[var(--color-student-heading)] sm:text-[24px] sm:leading-8"

/** Desktop-only exam progress — hidden on mobile (no blue bar under Find Text). */
const OFFICIAL_HEADER_PROGRESS_TRACK_CLASS =
  "relative hidden h-[5px] w-full overflow-hidden bg-[var(--greyscale-25)] md:block"

const OFFICIAL_HEADER_PROGRESS_FILL_CLASS =
  "absolute left-0 top-0 h-full bg-[var(--primary)] transition-[width] duration-300 ease-linear"

const OFFICIAL_BODY_GRID_CLASS = "lg:grid-cols-2 lg:pr-[50px]"

/**
 * Mobile stacked (stimulus + question): one flex column that scrolls as a whole.
 * Desktop keeps the 2-col grid.
 */
const OFFICIAL_BODY_GRID_MOBILE_STACKED_CLASS =
  "max-md:flex max-md:flex-col max-md:overflow-y-auto max-md:overscroll-y-contain md:grid md:overflow-hidden"

const OFFICIAL_PASSAGE_PANE_CLASS =
  "border-b border-[var(--greyscale-50)] py-[13px] pl-7 pr-2 md:overflow-y-auto lg:border-b-0 lg:border-r-2 lg:border-[var(--greyscale-50)] lg:pb-0"

/** Stacked mobile — passage/stimulus grows with content (not clipped). */
const OFFICIAL_PASSAGE_PANE_MOBILE_STACKED_CLASS =
  "max-md:!h-auto max-md:!min-h-0 max-md:flex-none max-md:shrink-0 max-md:!overflow-visible max-md:pb-4"

const OFFICIAL_QUESTION_PANE_CLASS = "min-h-0 py-[13px] pl-1.5 md:overflow-y-auto"

/** Stacked mobile — taller question block; body scrolls to reach options/footer. */
const OFFICIAL_QUESTION_PANE_MOBILE_STACKED_CLASS =
  "practice-session-pane--mobile-question-stack max-md:!h-auto max-md:!min-h-[72vh] max-md:flex-none max-md:shrink-0 max-md:!overflow-visible max-md:pt-5 max-md:pb-6"

/** Solo Passage/Question tab — fill remaining height and scroll inside the pane. */
const OFFICIAL_PANE_MOBILE_SOLO_CLASS = "max-md:min-h-0 max-md:flex-1 max-md:overflow-y-auto"

/** Official exam passage, stem, and choice copy: 18 / 1.5 / 300, LawHub stack. */
const OFFICIAL_BODY_TYPE_CLASS =
  "text-[14px] font-light leading-[1.5] tracking-[0.28px] [font-family:Apostrophe,halyard-text,sans-serif] md:text-[18px] md:tracking-normal"

const OFFICIAL_PASSAGE_TEXT_CLASS =
  `${OFFICIAL_BODY_TYPE_CLASS} text-[var(--color-student-heading)] [&_p]:mb-0`

const OFFICIAL_QUESTION_PANEL_WITH_WIDGET_CLASS =
  "practice-session-question-panel-with-widget relative min-w-0 max-md:pr-0 md:pr-[50px]"

const OFFICIAL_STEM_SECTION_CLASS = "w-full min-w-0 shrink-0 px-3 sm:px-5"

const OFFICIAL_STEM_NUMBER_CLASS = `shrink-0 pr-2 ${OFFICIAL_BODY_TYPE_CLASS} text-[var(--color-student-heading)]`

const OFFICIAL_STEM_TEXT_CLASS =
  `min-w-0 flex-1 font-medium ${OFFICIAL_BODY_TYPE_CLASS} text-[var(--color-student-heading)] [&_ol]:m-0 [&_ol]:list-decimal [&_ol]:pl-7 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0`

/** Figma `20243:23534` / mobile `21452:49111` — choices + Reset */
const OFFICIAL_OPTIONS_LIST_CLASS =
  "flex w-full min-w-0 flex-col items-stretch gap-[2px] px-3 py-3 sm:px-[20px] sm:py-[16px]"

const OFFICIAL_OPTION_ROW_BASE_CLASS = "practice-session-official-choice flex w-full items-start"

/** Official LawHub unselected row */
const OFFICIAL_OPTION_ROW_UNSELECTED_CLASS = `${OFFICIAL_OPTION_ROW_BASE_CLASS} bg-[#f2f3f8]`

/** Selected row (`#fdfac4`) + 3px primary-800 bar */
const OFFICIAL_OPTION_ROW_SELECTED_CLASS =
  `${OFFICIAL_OPTION_ROW_BASE_CLASS} practice-session-official-choice--selected relative overflow-hidden bg-[#fdfac4]`

const OFFICIAL_OPTION_SELECTED_BAR_CLASS =
  "pointer-events-none absolute inset-y-0 left-0 z-[1] w-[3px] bg-[#041a44]"

const OFFICIAL_OPTION_ROW_MASKED_CLASS =
  `${OFFICIAL_OPTION_ROW_BASE_CLASS} practice-session-choice-masked relative overflow-hidden bg-[#f2f3f8]`

const OFFICIAL_OPTION_LETTER_TYPE_CLASS =
  "practice-session-official-choice-letter text-[28px] font-normal leading-[60px] [font-family:Apostrophe,halyard-text,sans-serif]"

const OFFICIAL_OPTION_LETTER_UNSELECTED_CLASS =
  `${OFFICIAL_OPTION_LETTER_TYPE_CLASS} box-border flex w-[60px] min-h-[60px] shrink-0 items-center justify-center self-stretch border-2 border-solid border-[#f2f3f8] bg-[#ffffff] text-[#666d80]`

const OFFICIAL_OPTION_LETTER_SELECTED_CLASS =
  `${OFFICIAL_OPTION_LETTER_TYPE_CLASS} practice-session-official-choice-letter--selected box-border flex w-[60px] min-h-[60px] shrink-0 items-center justify-center self-stretch border-2 border-solid border-transparent bg-[#fdfac4] text-[#041a44]`

/** Figma `20243:23545` — copy inset 6 / 12 / 8, min 60px. Type: 15 / 22 / regular. */
const OFFICIAL_OPTION_TEXT_CLASS =
  `box-border flex min-h-[60px] min-w-0 flex-1 flex-col justify-center self-stretch overflow-hidden py-[8px] pl-[6px] pr-[12px] ${OFFICIAL_BODY_TYPE_CLASS} font-normal text-[#041a44] [&_p]:min-w-0 [&_p]:break-words`

const OFFICIAL_RESET_RESPONSE_WRAP_CLASS =
  "flex h-[46px] w-full min-w-0 shrink-0 items-start justify-end pt-[12px]"

const OFFICIAL_RESET_RESPONSE_BUTTON_CLASS =
  "practice-session-official-reset inline-flex h-[34px] shrink-0 items-center justify-center rounded-[6px] border border-solid border-[#eceff3] bg-[#eceff3] px-[11px] pb-[5px] pt-[3px] text-[14px] font-normal leading-[20px] text-[#041a44] transition hover:bg-[#e2e6ec]"

const OFFICIAL_SIDE_WIDGET_CLASS =
  "practice-session-side-widget absolute bottom-0 right-0 top-0 z-10 hidden w-[50px] flex-col items-center justify-between overflow-visible bg-[var(--greyscale-25)] md:flex"

/** Desktop expanded tools rail (Figma `20255:51704`). */
const OFFICIAL_SIDE_WIDGET_EXPANDED_CLASS =
  "practice-session-side-widget absolute bottom-0 right-0 top-0 z-10 hidden w-[174px] flex-col items-start justify-between overflow-visible bg-[var(--greyscale-25)] md:flex"

/**
 * Figma `21453:49252` / `21453:49406` — mobile tools overlay panel (175×352).
 * Mounted at session-body level so it stays available on Passage tab.
 */
const OFFICIAL_SIDE_WIDGET_MOBILE_OVERLAY_CLASS =
  "practice-session-side-widget practice-session-side-widget--mobile-overlay absolute right-0 top-0 z-40 flex h-[min(352px,100%)] max-h-[352px] w-[175px] flex-col items-start justify-between overflow-hidden border-l border-[#f2f3f8] bg-[#f2f3f8] md:hidden"

const OFFICIAL_SIDE_WIDGET_MOBILE_BACKDROP_CLASS =
  "absolute inset-0 z-30 bg-[rgba(0,0,0,0.3)] backdrop-blur-[3px] md:hidden"

const OFFICIAL_SIDE_WIDGET_ITEM_CLASS =
  "inline-flex h-10 w-[49px] items-center justify-center text-[#2c3143] transition hover:bg-[var(--greyscale-0)]/70"

const OFFICIAL_SIDE_WIDGET_ITEM_EXPANDED_CLASS =
  "flex h-10 w-full items-center gap-3 px-[14px] text-left text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[#2c3143] transition hover:bg-[var(--greyscale-0)]/70"

/**
 * Figma `20257:89990` / mobile `21453:49659` — full-width on small screens (above tools menu).
 * Mobile bottom clears 76px footer; desktop keeps rail inset.
 */
const OFFICIAL_REVIEW_PANEL_CLASS =
  "practice-session-review-panel practice-session-review-panel--official absolute bottom-[76px] left-0 right-0 top-[148px] z-[60] flex min-w-0 flex-col overflow-hidden bg-[var(--greyscale-25)] md:bottom-[72px] md:right-[50px] md:top-[111px] md:z-20"

const OFFICIAL_REVIEW_HEADER_CLASS =
  "flex min-h-[50px] w-full shrink-0 items-center justify-between border-b border-[var(--greyscale-100)] px-4"

const OFFICIAL_REVIEW_TITLE_CLASS =
  "m-0 text-[20px] font-normal leading-6 tracking-[-0.5px] text-[var(--color-student-heading)]"

const OFFICIAL_REVIEW_CLOSE_BUTTON_CLASS =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-[14px] bg-[var(--greyscale-0)] transition hover:opacity-80"

const OFFICIAL_REVIEW_FILTERS_CLASS = "flex h-9 w-full shrink-0 items-center gap-[15px] px-4"

const OFFICIAL_REVIEW_FILTER_ITEM_CLASS =
  "inline-flex items-center gap-2 text-[14px] font-normal leading-5 text-[var(--color-student-heading)]"

const OFFICIAL_REVIEW_FILTER_BOX_CLASS =
  "inline-flex size-5 shrink-0 items-center justify-center rounded-[3px] border border-[var(--greyscale-300)] bg-[var(--greyscale-0)]"

const OFFICIAL_REVIEW_FILTER_BOX_CHECKED_CLASS = "border-[var(--primary)] bg-[var(--primary)] text-white"

const OFFICIAL_REVIEW_GRID_WRAP_CLASS =
  "min-h-0 w-full min-w-0 flex-1 overflow-auto px-2 pt-3 sm:px-[15px] sm:pt-[15px]"

const OFFICIAL_REVIEW_GRID_CLASS =
  "practice-session-review-panel__grid grid w-full min-w-0 grid-cols-3 border-l border-t border-[var(--greyscale-300)] md:grid-cols-10"

const OFFICIAL_REVIEW_QUESTION_BUTTON_CLASS =
  "practice-session-review-panel__question-btn relative flex h-[68px] min-w-0 w-full flex-col items-center justify-center gap-1 border-b border-r border-[var(--greyscale-300)] bg-[var(--greyscale-0)] text-[18px] font-normal leading-[1.4] tracking-[0.36px] text-[var(--color-student-heading)]"

const OFFICIAL_REVIEW_ANSWERED_BAR_CLASS = "absolute inset-x-0 bottom-0 h-[3px] bg-[var(--greyscale-300)]"

const OFFICIAL_REVIEW_CURRENT_BAR_CLASS = "absolute inset-x-0 bottom-0 h-[3px] bg-[var(--primary)]"

const OFFICIAL_REVIEW_CURRENT_CARET_CLASS =
  "pointer-events-none absolute bottom-[6px] left-1/2 h-[6px] w-3 -translate-x-1/2"

const OFFICIAL_REVIEW_FINISH_WRAP_CLASS = "flex w-full shrink-0 items-center justify-center py-6"

const OFFICIAL_REVIEW_FINISH_BUTTON_CLASS =
  "inline-flex h-10 min-w-[90px] shrink-0 items-center justify-center rounded-[6px] bg-[var(--primary)] px-4 text-base font-normal leading-6 text-white transition hover:bg-[var(--primary-600)]"

const OFFICIAL_FOOTER_CLASS =
  "box-border relative z-30 flex h-[72px] shrink-0 flex-col justify-center overflow-visible rounded-none border-t border-[var(--greyscale-50)] bg-[var(--greyscale-0)] max-md:h-[76px] max-md:border-[#dde2ea] max-md:bg-[rgba(255,255,255,0.96)] max-md:shadow-[0px_-8px_24px_0px_rgba(27,42,65,0.06)] max-md:backdrop-blur-[12px]"

const OFFICIAL_FOOTER_ROW_CLASS = "flex w-full min-w-0 items-center justify-center overflow-visible"

const OFFICIAL_FOOTER_NAV_CLUSTER_CLASS =
  "hidden min-w-0 max-w-full items-end justify-center gap-2 px-2 md:flex"

const OFFICIAL_FOOTER_NAV_BUTTON_CLASS =
  "box-border inline-flex h-7 shrink-0 items-center justify-center rounded-[6px] bg-[var(--primary)] px-3 pb-[5px] pt-[3px] text-[14px] font-normal leading-5 text-white transition hover:bg-[var(--primary-600)] disabled:pointer-events-none disabled:opacity-40"

const OFFICIAL_FOOTER_NAV_GRID_CLASS =
  "practice-session-question-nav-grid practice-session-scroll-hidden flex min-w-0 max-w-full flex-nowrap items-end justify-center gap-2 overflow-x-auto overflow-y-hidden"

/** Figma `21452:49123` — mobile footer: prev | Question N of M | next */
const OFFICIAL_MOBILE_FOOTER_CLASS =
  "grid w-full min-w-0 grid-cols-[46px_minmax(0,1fr)_46px] items-center gap-2.5 px-4 py-2.5 md:hidden"

const OFFICIAL_MOBILE_FOOTER_PREV_CLASS =
  "inline-flex size-[46px] shrink-0 items-center justify-center rounded-[12px] border border-[#d8dee8] bg-[#f5f6f8] text-[#536078] transition hover:bg-[#eef0f4] disabled:pointer-events-none disabled:opacity-40"

const OFFICIAL_MOBILE_FOOTER_NEXT_CLASS =
  "inline-flex size-[46px] shrink-0 items-center justify-center rounded-[12px] border border-[#244f8d] bg-[#244f8d] text-white transition hover:bg-[#1e447a] disabled:pointer-events-none disabled:opacity-40"

const OFFICIAL_MOBILE_FOOTER_CENTER_CLASS =
  "inline-flex h-[46px] min-w-0 items-center justify-center gap-2 rounded-[10px] px-2 text-[13px] font-normal leading-[19.5px] tracking-[-0.076px] text-[#536078] transition hover:bg-[var(--greyscale-25)]"

const OFFICIAL_QUESTION_NAV_ITEM_CLASS = "relative flex w-7 shrink-0 flex-col items-center gap-0.5"

const OFFICIAL_QUESTION_NAV_FLAG_SLOT_CLASS =
  "relative z-[1] flex h-[13px] w-7 shrink-0 items-center justify-center"

const OFFICIAL_QUESTION_NAV_FLAG_CLASS = "h-[13px] w-[11px] max-w-none shrink-0"

const OFFICIAL_QUESTION_NAV_BUTTON_CLASS =
  "practice-session-question-nav-btn box-border relative inline-flex size-7 shrink-0 items-center justify-center rounded-[6px] text-[12px] font-normal leading-[1.5] tracking-[0.24px] text-[var(--color-student-heading)] transition-colors"

const OFFICIAL_QUESTION_NAV_BUTTON_DEFAULT_CLASS = "border border-solid border-[var(--greyscale-100)] bg-[var(--greyscale-0)] hover:bg-[var(--primary-25)]"

const OFFICIAL_QUESTION_NAV_BUTTON_ACTIVE_CLASS = "border-0 bg-[var(--primary-25)] text-[var(--color-student-heading)]"

const OFFICIAL_QUESTION_NAV_BUTTON_ANSWERED_CLASS =
  "border border-solid border-[var(--greyscale-100)] border-b-0 bg-[var(--greyscale-0)] text-[var(--color-student-heading)]"

const OFFICIAL_QUESTION_NAV_CURRENT_BAR_CLASS =
  "pointer-events-none absolute inset-x-0 bottom-0 h-[3px] rounded-b-[6px] bg-[var(--primary)]"

const OFFICIAL_QUESTION_NAV_ANSWERED_BAR_CLASS =
  "pointer-events-none absolute inset-x-0 bottom-0 h-[3px] rounded-b-[6px] bg-[var(--greyscale-300)]"

const OFFICIAL_QUESTION_NAV_CARET_CLASS =
  "pointer-events-none absolute bottom-[3px] left-1/2 z-[1] size-[3px] -translate-x-1/2"

const OFFICIAL_PASSAGE_BREAK_CLASS =
  "practice-session-question-nav-passage-break h-7 w-[4px] min-w-[4px] max-w-[4px] shrink-0 self-end bg-[var(--greyscale-500)]"

/** LawHub official highlighter tooltip — 216×56 chip, 8px radius, shadow only */
const OFFICIAL_HIGHLIGHT_POPOVER_STACK_CLASS = "flex w-[216px] flex-col gap-2"

const OFFICIAL_HIGHLIGHT_POPOVER_CARD_CLASS =
  "flex w-full flex-col rounded-[8px] bg-[#ffffff] shadow-[0px_4px_16px_rgba(16,24,40,0.12),0px_1px_3px_rgba(16,24,40,0.06)]"

const OFFICIAL_HIGHLIGHT_POPOVER_HEADER_CLASS =
  "flex h-14 w-full items-center gap-3 px-5 text-[16px] font-normal leading-6 text-[#333333]"

const OFFICIAL_HIGHLIGHT_POPOVER_SWATCH_ROW_CLASS =
  "flex h-14 w-full items-center justify-between px-5"

const OFFICIAL_HIGHLIGHT_POPOVER_SWATCH_CLASS =
  "relative box-border size-6 shrink-0 overflow-visible rounded-full"

const OFFICIAL_HIGHLIGHT_REMOVE_CARD_CLASS =
  "relative inline-flex h-14 items-center gap-3 rounded-[8px] bg-[#ffffff] px-5 text-[16px] font-normal leading-6 text-[#333333] shadow-[0px_4px_16px_rgba(16,24,40,0.12),0px_1px_3px_rgba(16,24,40,0.06)]"

export {
  EXAM_CARD_FULL_WIDTH_CLASS,
  OFFICIAL_BODY_GRID_CLASS,
  OFFICIAL_BODY_GRID_MOBILE_STACKED_CLASS,
  OFFICIAL_BODY_TYPE_CLASS,
  OFFICIAL_CARD_CLASS,
  OFFICIAL_DESKTOP_HEADER_BLOCK_CLASS,
  OFFICIAL_FIND_TEXT_INPUT_CLASS,
  OFFICIAL_FIND_WRAP_CLASS,
  OFFICIAL_FOOTER_CLASS,
  OFFICIAL_FOOTER_NAV_BUTTON_CLASS,
  OFFICIAL_FOOTER_NAV_CLUSTER_CLASS,
  OFFICIAL_FOOTER_NAV_GRID_CLASS,
  OFFICIAL_FOOTER_ROW_CLASS,
  OFFICIAL_MOBILE_FOOTER_CENTER_CLASS,
  OFFICIAL_MOBILE_FOOTER_CLASS,
  OFFICIAL_MOBILE_FOOTER_NEXT_CLASS,
  OFFICIAL_MOBILE_FOOTER_PREV_CLASS,
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
  OFFICIAL_MOBILE_FIND_ICON_CLASS,
  OFFICIAL_MOBILE_FIND_INPUT_CLASS,
  OFFICIAL_MOBILE_FIND_WRAP_CLASS,
  OFFICIAL_MOBILE_HEADER_CLASS,
  OFFICIAL_MOBILE_HEADER_CLOSE_CLASS,
  OFFICIAL_MOBILE_HEADER_TOOLS_CLASS,
  OFFICIAL_MOBILE_HEADER_TITLE_BUTTON_CLASS,
  OFFICIAL_MOBILE_HEADER_TITLE_CLASS,
  OFFICIAL_MOBILE_META_RIGHT_CLASS,
  OFFICIAL_MOBILE_META_ROW_CLASS,
  OFFICIAL_MOBILE_META_SECTION_CLASS,
  OFFICIAL_MOBILE_PANE_TAB_ACTIVE_CLASS,
  OFFICIAL_MOBILE_PANE_TAB_CLASS,
  OFFICIAL_MOBILE_PANE_TAB_INACTIVE_CLASS,
  OFFICIAL_MOBILE_PANE_TABS_CLASS,
  OFFICIAL_MOBILE_PROGRESS_FILL_CLASS,
  OFFICIAL_MOBILE_PROGRESS_TRACK_CLASS,
  OFFICIAL_SIDE_WIDGET_MOBILE_BACKDROP_CLASS,
  OFFICIAL_SIDE_WIDGET_MOBILE_OVERLAY_CLASS,
  OFFICIAL_HIGHLIGHT_POPOVER_CARD_CLASS,
  OFFICIAL_HIGHLIGHT_POPOVER_HEADER_CLASS,
  OFFICIAL_HIGHLIGHT_POPOVER_STACK_CLASS,
  OFFICIAL_HIGHLIGHT_POPOVER_SWATCH_CLASS,
  OFFICIAL_HIGHLIGHT_POPOVER_SWATCH_ROW_CLASS,
  OFFICIAL_HIGHLIGHT_REMOVE_CARD_CLASS,
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
  OFFICIAL_PASSAGE_PANE_MOBILE_STACKED_CLASS,
  OFFICIAL_PASSAGE_TEXT_CLASS,
  OFFICIAL_PANE_MOBILE_SOLO_CLASS,
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
  OFFICIAL_QUESTION_PANE_MOBILE_STACKED_CLASS,
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
