/** Figma `18704:14485` — finish control width (closed + open stay the same) */
const FINISH_MENU_WIDTH_PX = 126

/** Figma `18617:31643` finish dropdown trigger (active drill, closed) */
const ACTIVE_DRILL_FINISH_BUTTON_CLASS =
  "h-[52px] w-[126px] shrink-0 gap-2 rounded-[16px] border border-[#dfe1e7] bg-white px-3 py-2 text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[#062357]"

/** Figma `18617:26214` finish dropdown trigger (section / prep test, closed) */
const SESSION_FINISH_BUTTON_CLASS =
  "h-[52px] w-[126px] shrink-0 gap-2 rounded-[16px] border border-[#dfe1e7] bg-[#f6f8fa] px-3 py-2 text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[#062357]"

/** Figma `18704:14485` finish dropdown open panel */
const FINISH_MENU_OPEN_PANEL_CLASS =
  "flex w-[126px] flex-col drop-shadow-[0px_5px_5px_rgba(13,13,18,0.04),0px_4px_4px_rgba(13,13,18,0.02)]"

/** Figma `18704:14488` finish row when open — matches closed trigger typography */
const FINISH_MENU_OPEN_TRIGGER_CLASS =
  "flex h-[52px] w-full items-center justify-between gap-2 rounded-t-[16px] border border-[#dfe1e7] bg-[#edf3ff] px-3 py-2 text-[14px] font-medium leading-[1.5] tracking-[0.28px] text-[#062357]"

/** Figma `18704:14494` submit row */
const FINISH_MENU_SUBMIT_ITEM_CLASS =
  "flex h-[52px] w-full items-center border-x border-[#dfe1e7] bg-[#f6f8fa] px-3 py-2 text-left text-[12px] font-semibold leading-[1.5] tracking-[0.24px] whitespace-nowrap text-[#062357] transition-colors hover:bg-[#eceff3]"

/** Figma `18704:14499` exit row */
const FINISH_MENU_EXIT_ITEM_CLASS =
  "flex min-h-[52px] w-full flex-col justify-center rounded-b-[16px] border border-[#dfe1e7] bg-[#f6f8fa] px-2 py-2 text-left text-[12px] font-semibold leading-[1.5] tracking-[0.24px] text-[#062357] transition-colors hover:bg-[#eceff3]"

/** Figma `18617:31644` find-text field */
const ACTIVE_DRILL_FIND_TEXT_INPUT_CLASS =
  "h-[52px] w-[200px] shrink-0 rounded-[16px] border border-[#dfe1e7] bg-white px-4 py-2 text-sm font-normal leading-[1.5] tracking-[0.28px] text-[#0d0d12] drop-shadow-[0px_1px_1px_rgba(13,13,18,0.06)] outline-none placeholder:text-[#818898]"

/** Figma `18617:31668` — selected answer choice row */
const ACTIVE_DRILL_OPTION_ROW_SELECTED_CLASS =
  "rounded-[16px] border border-[#0d47a1] bg-[#f3f7ff] p-4 shadow-[0px_12px_8px_rgba(13,13,18,0.08),0px_4px_3px_rgba(13,13,18,0.03)]"

/** Figma `18617:31670` / `18617:31678` — choice letter badges */
const ACTIVE_DRILL_OPTION_LETTER_SELECTED_CLASS =
  "border-2 border-[#0d47a1] bg-[#0d47a1] text-base font-semibold leading-6 text-white"

const ACTIVE_DRILL_OPTION_LETTER_UNSELECTED_CLASS =
  "border-2 border-[#dfe1e7] bg-white text-base font-semibold leading-6 text-[#0d0d12]"

/** Figma `18617:31663` / `18617:31682` — 36×36 flag / eye controls (same column) */
const ACTIVE_DRILL_ACTION_BUTTON_CLASS =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#a4acb9] transition hover:text-[#062357]"

/** Figma `18617:31667` — options list spacing */
const ACTIVE_DRILL_OPTIONS_LIST_CLASS = "flex flex-col gap-4 pb-4 pt-4"

/** Figma `18617:31676` — unselected answer choice row */
const ACTIVE_DRILL_OPTION_ROW_UNSELECTED_CLASS = "rounded-[16px] py-1 pl-4 pr-4"

/** Figma `18617:31659` — question stem section (top flush with passage column) */
const ACTIVE_DRILL_STEM_SECTION_CLASS = "shrink-0 bg-white px-4 pb-3 pt-0"

/** Figma `18617:31676` / `18617:31668` — choice row grid (letter | gap | text | eye) */
const ACTIVE_DRILL_CHOICE_ROW_GRID_CLASS =
  "grid w-full grid-cols-[32px_16px_minmax(0,1fr)_36px] items-start"

/** Figma `18617:31660` — stem text + flag share the eye column */
const ACTIVE_DRILL_STEM_GRID_CLASS = "grid w-full grid-cols-[minmax(0,1fr)_36px] items-start"

/** Figma `18617:31674` / `18617:31682` — hide-choice control */
const ACTIVE_DRILL_OPTION_EYE_BUTTON_CLASS = ACTIVE_DRILL_ACTION_BUTTON_CLASS

/** Figma `18617:26234` / `18617:26236` — 52×52 icon-only prev/next */
const ACTIVE_DRILL_NAV_ARROW_BUTTON_CLASS =
  "box-border inline-flex size-[52px] shrink-0 items-center justify-center rounded-[16px] border-2 border-solid border-[#dfe1e7] bg-[#f6f8fa] p-1 shadow-[0px_1px_1px_rgba(13,13,18,0.06)] transition hover:bg-white disabled:opacity-40"

/** Figma `18617:26233` — 16px gap between prev/next */
const ACTIVE_DRILL_NAV_ARROW_GROUP_CLASS = "flex h-[52px] shrink-0 items-center gap-4"

/** Figma `18624:76723` — footer grows when question pills wrap */
const ACTIVE_DRILL_FOOTER_CLASS =
  "box-border flex min-h-[72px] shrink-0 flex-col items-center justify-center rounded-b-[16px] border-t border-[#dfe1e7] bg-[#f5f9ff] px-6 py-2"

const ACTIVE_DRILL_FOOTER_ROW_CLASS =
  "flex min-h-[56px] w-full min-w-0 items-center justify-between gap-4"

export {
  ACTIVE_DRILL_ACTION_BUTTON_CLASS,
  ACTIVE_DRILL_CHOICE_ROW_GRID_CLASS,
  ACTIVE_DRILL_FIND_TEXT_INPUT_CLASS,
  ACTIVE_DRILL_FINISH_BUTTON_CLASS,
  ACTIVE_DRILL_FOOTER_CLASS,
  ACTIVE_DRILL_FOOTER_ROW_CLASS,
  ACTIVE_DRILL_NAV_ARROW_BUTTON_CLASS,
  ACTIVE_DRILL_NAV_ARROW_GROUP_CLASS,
  ACTIVE_DRILL_OPTION_EYE_BUTTON_CLASS,
  ACTIVE_DRILL_OPTIONS_LIST_CLASS,
  ACTIVE_DRILL_STEM_GRID_CLASS,
  ACTIVE_DRILL_STEM_SECTION_CLASS,
  ACTIVE_DRILL_OPTION_LETTER_SELECTED_CLASS,
  ACTIVE_DRILL_OPTION_LETTER_UNSELECTED_CLASS,
  ACTIVE_DRILL_OPTION_ROW_SELECTED_CLASS,
  ACTIVE_DRILL_OPTION_ROW_UNSELECTED_CLASS,
  FINISH_MENU_EXIT_ITEM_CLASS,
  FINISH_MENU_OPEN_PANEL_CLASS,
  FINISH_MENU_OPEN_TRIGGER_CLASS,
  FINISH_MENU_SUBMIT_ITEM_CLASS,
  FINISH_MENU_WIDTH_PX,
  SESSION_FINISH_BUTTON_CLASS,
}
