export type ParsedTranscriptLine = {
  id: string
  speaker: 'tutor' | 'student' | 'unknown'
  name: string
  initials: string
  time: string
  text: string
}

function formatTimestamp(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const hh = Math.floor(s / 3600)
  const mm = Math.floor((s % 3600) / 60)
  const ss = s % 60
  if (hh > 0) {
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

function parseClock(value: string): number {
  const parts = value.trim().split(':').map((p) => Number(p.replace(',', '.')))
  if (parts.some((n) => Number.isNaN(n))) return 0
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!
  return parts[0] ?? 0
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
}

/**
 * Parse Zoom cloud-recording VTT into portal transcript lines.
 * Speaker labels like `SPEAKER NAME:` are preserved when present.
 */
export function parseZoomVttTranscript(vtt: string): ParsedTranscriptLine[] {
  const lines = vtt.replace(/^\uFEFF/, '').split(/\r?\n/)
  const out: ParsedTranscriptLine[] = []
  let i = 0
  let cueIndex = 0

  while (i < lines.length) {
    const line = lines[i]!.trim()
    i += 1
    if (!line || line === 'WEBVTT' || line.startsWith('NOTE')) continue

    let timeLine = line
    if (!line.includes('-->') && i < lines.length && lines[i]!.includes('-->')) {
      timeLine = lines[i]!.trim()
      i += 1
    }
    if (!timeLine.includes('-->')) continue

    const [startRaw] = timeLine.split('-->')
    const startSeconds = parseClock((startRaw ?? '').trim().split(' ')[0] ?? '0')

    const textParts: string[] = []
    while (i < lines.length && lines[i]!.trim() !== '') {
      textParts.push(lines[i]!.trim())
      i += 1
    }
    while (i < lines.length && lines[i]!.trim() === '') i += 1

    const rawText = textParts.join(' ').replace(/<[^>]+>/g, '').trim()
    if (!rawText) continue

    let name = 'Speaker'
    let text = rawText
    const speakerMatch = rawText.match(/^([^:]{1,80}):\s*(.+)$/)
    if (speakerMatch) {
      name = speakerMatch[1]!.trim()
      text = speakerMatch[2]!.trim()
    }

    cueIndex += 1
    out.push({
      id: `line-${cueIndex}`,
      speaker: 'unknown',
      name,
      initials: initialsFromName(name),
      time: formatTimestamp(startSeconds),
      text,
    })
  }

  return out
}
