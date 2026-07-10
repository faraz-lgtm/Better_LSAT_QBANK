const PATTERN_ROWS = 4
const PATTERN_COLS = 8

/** Figma `19510:18944` / `19510:19181` — faded checkerboard behind marketing panel */
function GuestMarketingPanelPattern() {
  const accentCells = new Set(["0-4", "1-2", "2-5", "3-2"])

  return (
    <div className="guest-intent-pattern" aria-hidden>
      <div className="guest-intent-pattern__grid">
        {Array.from({ length: PATTERN_ROWS }, (_, row) =>
          Array.from({ length: PATTERN_COLS }, (_, col) => {
            const key = `${row}-${col}`
            const accented = accentCells.has(key)
            return (
              <div
                key={key}
                className={accented ? "guest-intent-pattern__cell guest-intent-pattern__cell--accent" : "guest-intent-pattern__cell"}
              />
            )
          }),
        )}
      </div>
      <div className="guest-intent-pattern__fade" />
    </div>
  )
}

export { GuestMarketingPanelPattern }
