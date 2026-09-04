const PRACTICE_SESSION_ACCESSIBILITY_PANEL_OVERLAY_CLASS =
  "fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-[rgba(13,13,18,0.24)] p-4 sm:p-6"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_CLASS =
  "my-auto flex w-full max-w-[640px] flex-col overflow-hidden rounded-[16px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] shadow-[0px_24px_24px_rgba(13,13,18,0.12)] max-h-[min(720px,calc(100vh-2rem))]"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_HEADER_CLASS =
  "flex shrink-0 items-center justify-between border-b border-[var(--greyscale-100)] px-6 py-4"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_TITLE_CLASS =
  "text-xl font-bold leading-[1.35] tracking-[0.4px] text-[var(--color-student-heading)]"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_CLOSE_BUTTON_CLASS =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-0)] text-[var(--greyscale-500)] transition hover:bg-[var(--greyscale-25)] hover:text-[var(--color-student-heading)]"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_TIMER_CLASS =
  "flex shrink-0 items-center gap-2 border-b border-[#f8d5d9] bg-[#fff1f2] px-6 py-3 text-sm font-semibold tracking-[0.28px] text-[#df1c41]"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_TABS_CLASS =
  "flex shrink-0 items-center gap-6 overflow-x-auto border-b border-[var(--greyscale-100)] px-6"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_TAB_CLASS =
  "relative -mb-px border-b-2 border-transparent py-4 text-sm font-medium tracking-[0.28px] text-[var(--greyscale-500)] transition-colors"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_TAB_ACTIVE_CLASS =
  "border-[var(--primary)] text-[var(--primary)]"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_BODY_CLASS = "min-h-0 flex-1 overflow-y-auto px-6 py-5"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_DESCRIPTION_CLASS =
  "mb-4 text-sm font-medium tracking-[0.28px] text-[var(--greyscale-500)]"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_OPTION_LIST_CLASS = "flex flex-col gap-3"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_FONT_SIZE_LIST_CLASS = "flex flex-col gap-4"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_FONT_SIZE_PREVIEW_CLASS =
  "font-semibold leading-[1.2] tracking-[0.2px] text-[var(--color-student-heading)]"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_OPTION_CLASS =
  "flex w-full items-center gap-3 text-left"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_RADIO_CLASS =
  "inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-[var(--greyscale-100)] bg-[var(--greyscale-0)]"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_RADIO_SELECTED_CLASS =
  "border-[var(--primary)]"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_RADIO_DOT_CLASS =
  "size-2.5 rounded-full bg-[var(--primary)]"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_SWATCH_CLASS =
  "flex min-h-[44px] flex-1 items-center rounded-[8px] border border-[var(--greyscale-100)] px-4 text-sm font-medium tracking-[0.28px]"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_FOOTER_CLASS =
  "flex shrink-0 items-center justify-end gap-3 border-t border-[var(--greyscale-100)] px-6 py-4"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_CANCEL_BUTTON_CLASS =
  "inline-flex h-10 items-center justify-center rounded-[12px] border border-[var(--primary)] bg-[var(--greyscale-0)] px-5 text-sm font-semibold tracking-[0.28px] text-[var(--primary)] transition hover:bg-[var(--primary-0)]"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_SAVE_BUTTON_CLASS =
  "inline-flex h-10 items-center justify-center rounded-[12px] border border-[var(--primary-border)] bg-[var(--primary)] px-5 text-sm font-semibold tracking-[0.28px] text-white transition hover:bg-[var(--primary-600)]"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_SIMPLE_OPTION_CLASS =
  "flex min-h-[44px] flex-1 items-center rounded-[8px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-4 text-sm font-medium tracking-[0.28px] text-[var(--color-student-heading)]"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_SIMPLE_OPTION_SELECTED_CLASS =
  "border-[var(--primary)] bg-[var(--primary-25)] text-[var(--primary)]"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUTS_CLASS = "flex flex-col gap-5"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_SECTION_CLASS = "flex flex-col gap-1"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_TITLE_CLASS =
  "text-sm font-semibold leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)]"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_INSTRUCTION_CLASS =
  "text-sm font-medium leading-[1.5] tracking-[0.28px] text-[var(--greyscale-500)]"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_HELP_CLASS =
  "text-sm font-medium leading-[1.5] tracking-[0.28px] text-[var(--primary)]"

const PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_OPTIONS_DIVIDER_CLASS =
  "my-2 border-t border-[var(--greyscale-100)]"

export {
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_BODY_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_CANCEL_BUTTON_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_CLOSE_BUTTON_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_DESCRIPTION_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_FONT_SIZE_LIST_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_FONT_SIZE_PREVIEW_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_FOOTER_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_HEADER_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_OPTION_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_OPTION_LIST_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_OVERLAY_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_RADIO_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_RADIO_DOT_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_RADIO_SELECTED_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_SAVE_BUTTON_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_SIMPLE_OPTION_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_SIMPLE_OPTION_SELECTED_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_SWATCH_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_TAB_ACTIVE_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_TAB_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_TABS_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_TIMER_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_TITLE_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_OPTIONS_DIVIDER_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_HELP_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_INSTRUCTION_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_SECTION_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_TITLE_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUTS_CLASS,
}
