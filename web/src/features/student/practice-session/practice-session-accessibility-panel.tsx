import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Clock, X } from "lucide-react"

import {
  FONT_SIZE_OPTIONS,
  LINE_HEIGHT_OPTIONS,
  PRACTICE_SESSION_COLOR_SCHEMES,
  type PracticeSessionAccessibilitySettings,
  type PracticeSessionAccessibilityTab,
  type PracticeSessionColorSchemeId,
} from "@/features/student/practice-session/practice-session-accessibility"
import {
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
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_HELP_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_INSTRUCTION_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_SECTION_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_TITLE_CLASS,
  PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUTS_CLASS,
} from "@/features/student/practice-session/practice-session-accessibility-panel-styles"
import { formatPracticeElapsed } from "@/features/student/practice-session/use-practice-session-timer"
import { getZoomShortcutModifierLabel } from "@/features/student/practice-session/practice-session-zoom-shortcuts"
import { cn } from "@/lib/utils"

type PracticeSessionAccessibilityPanelProps = {
  open: boolean
  settings: PracticeSessionAccessibilitySettings
  timerDisplaySeconds: number
  onClose: () => void
  onCancel: () => void
  onPreview: (settings: PracticeSessionAccessibilitySettings) => void
  onSave: (settings: PracticeSessionAccessibilitySettings) => void
}

const TABS: ReadonlyArray<{ id: PracticeSessionAccessibilityTab; label: string }> = [
  { id: "color-scheme", label: "Color scheme" },
  { id: "font-size", label: "Font size" },
  { id: "zoom", label: "Zoom" },
  { id: "line-height", label: "Line Height" },
]

function PracticeSessionAccessibilityPanel({
  open,
  settings,
  timerDisplaySeconds,
  onClose,
  onCancel,
  onPreview,
  onSave,
}: PracticeSessionAccessibilityPanelProps) {
  const [activeTab, setActiveTab] = useState<PracticeSessionAccessibilityTab>("color-scheme")
  const [draft, setDraft] = useState(settings)

  useEffect(() => {
    if (!open) return
    setActiveTab("color-scheme")
    setDraft(settings)
    onPreview(settings)
  }, [open])

  useEffect(() => {
    if (!open) return
    setDraft((current) => {
      if (current.zoomScale === settings.zoomScale) return current
      const next = { ...current, zoomScale: settings.zoomScale }
      onPreview(next)
      return next
    })
  }, [open, settings.zoomScale, onPreview])

  if (!open) return null

  const modifierKey = getZoomShortcutModifierLabel()

  function updateDraft(patch: Partial<PracticeSessionAccessibilitySettings>) {
    setDraft((current) => {
      const next = { ...current, ...patch }
      onPreview(next)
      return next
    })
  }

  function handleDismiss() {
    onCancel()
    onClose()
  }

  return createPortal(
    <div
      className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_OVERLAY_CLASS}
      role="presentation"
      onClick={handleDismiss}
    >
      <section
        className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_CLASS}
        role="dialog"
        aria-modal="true"
        aria-labelledby="practice-session-accessibility-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_HEADER_CLASS}>
          <h2 id="practice-session-accessibility-title" className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_TITLE_CLASS}>
            Accessibility options
          </h2>
          <button
            type="button"
            className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_CLOSE_BUTTON_CLASS}
            aria-label="Close accessibility options"
            onClick={handleDismiss}
          >
            <X className="size-5" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_TIMER_CLASS}>
          <Clock className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          <span>{formatPracticeElapsed(timerDisplaySeconds)}</span>
        </div>

        <div className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_TABS_CLASS} role="tablist" aria-label="Accessibility settings">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={cn(
                PRACTICE_SESSION_ACCESSIBILITY_PANEL_TAB_CLASS,
                activeTab === tab.id && PRACTICE_SESSION_ACCESSIBILITY_PANEL_TAB_ACTIVE_CLASS,
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_BODY_CLASS} role="tabpanel">
          {activeTab === "color-scheme" ? (
            <>
              <p className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_DESCRIPTION_CLASS}>
                Change the background and foreground colors of your activity.
              </p>
              <div className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_OPTION_LIST_CLASS}>
                {PRACTICE_SESSION_COLOR_SCHEMES.map((scheme) => {
                  const selected = draft.colorScheme === scheme.id
                  return (
                    <button
                      key={scheme.id}
                      type="button"
                      className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_OPTION_CLASS}
                      onClick={() => updateDraft({ colorScheme: scheme.id })}
                    >
                      <span
                        className={cn(
                          PRACTICE_SESSION_ACCESSIBILITY_PANEL_RADIO_CLASS,
                          selected && PRACTICE_SESSION_ACCESSIBILITY_PANEL_RADIO_SELECTED_CLASS,
                        )}
                        aria-hidden
                      >
                        {selected ? (
                          <span className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_RADIO_DOT_CLASS} />
                        ) : null}
                      </span>
                      <span
                        className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_SWATCH_CLASS}
                        style={{ backgroundColor: scheme.backgroundColor, color: scheme.color }}
                      >
                        {scheme.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : null}

          {activeTab === "font-size" ? (
            <>
              <p className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_DESCRIPTION_CLASS}>
                Adjust the size of fonts in your activity.
              </p>
              <div className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_FONT_SIZE_LIST_CLASS}>
                {FONT_SIZE_OPTIONS.map((option) => {
                  const selected = draft.fontScale === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_OPTION_CLASS}
                      onClick={() => updateDraft({ fontScale: option.value })}
                    >
                      <span
                        className={cn(
                          PRACTICE_SESSION_ACCESSIBILITY_PANEL_RADIO_CLASS,
                          selected && PRACTICE_SESSION_ACCESSIBILITY_PANEL_RADIO_SELECTED_CLASS,
                        )}
                        aria-hidden
                      >
                        {selected ? (
                          <span className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_RADIO_DOT_CLASS} />
                        ) : null}
                      </span>
                      <span
                        className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_FONT_SIZE_PREVIEW_CLASS}
                        style={{ fontSize: `${option.value}rem` }}
                      >
                        {option.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : null}

          {activeTab === "zoom" ? (
            <>
              <p className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_DESCRIPTION_CLASS}>
                Zoom in and out using the following keyboard shortcuts:
              </p>
              <div className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUTS_CLASS}>
                <section className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_SECTION_CLASS}>
                  <h3 className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_TITLE_CLASS}>Zoom In</h3>
                  <p className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_INSTRUCTION_CLASS}>
                    To zoom in, press {modifierKey} + .
                  </p>
                  <p className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_HELP_CLASS}>
                    The browser will zoom in incrementally each time you press plus (+) key.
                  </p>
                </section>
                <section className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_SECTION_CLASS}>
                  <h3 className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_TITLE_CLASS}>Zoom out</h3>
                  <p className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_INSTRUCTION_CLASS}>
                    To zoom out, press {modifierKey} - .
                  </p>
                  <p className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_HELP_CLASS}>
                    The browser will zoom out incrementally each time you press the minus (-) key.
                  </p>
                </section>
                <section className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_SECTION_CLASS}>
                  <h3 className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_TITLE_CLASS}>Reset zoom</h3>
                  <p className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_INSTRUCTION_CLASS}>
                    Reset the zoom level by pressing {modifierKey} 0 .
                  </p>
                  <p className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_ZOOM_SHORTCUT_HELP_CLASS}>
                    The browser will return to its default zoom level.
                  </p>
                </section>
              </div>
            </>
          ) : null}

          {activeTab === "line-height" ? (
            <>
              <p className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_DESCRIPTION_CLASS}>
                Adjust line spacing for easier reading.
              </p>
              <div className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_OPTION_LIST_CLASS}>
                {LINE_HEIGHT_OPTIONS.map((option) => {
                  const selected = draft.lineSpacing === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_OPTION_CLASS}
                      onClick={() => updateDraft({ lineSpacing: option.value })}
                    >
                      <span
                        className={cn(
                          PRACTICE_SESSION_ACCESSIBILITY_PANEL_RADIO_CLASS,
                          selected && PRACTICE_SESSION_ACCESSIBILITY_PANEL_RADIO_SELECTED_CLASS,
                        )}
                        aria-hidden
                      >
                        {selected ? (
                          <span className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_RADIO_DOT_CLASS} />
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          PRACTICE_SESSION_ACCESSIBILITY_PANEL_SIMPLE_OPTION_CLASS,
                          selected && PRACTICE_SESSION_ACCESSIBILITY_PANEL_SIMPLE_OPTION_SELECTED_CLASS,
                        )}
                      >
                        {option.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : null}
        </div>

        <footer className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_FOOTER_CLASS}>
          <button
            type="button"
            className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_CANCEL_BUTTON_CLASS}
            onClick={handleDismiss}
          >
            Cancel
          </button>
          <button
            type="button"
            className={PRACTICE_SESSION_ACCESSIBILITY_PANEL_SAVE_BUTTON_CLASS}
            onClick={() => {
              onSave(draft)
            }}
          >
            Save
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  )
}

export { PracticeSessionAccessibilityPanel, type PracticeSessionColorSchemeId }
