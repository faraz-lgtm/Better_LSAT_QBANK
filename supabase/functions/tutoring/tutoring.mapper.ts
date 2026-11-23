import type { ParsedTranscriptLine } from '../_shared/zoom-vtt.ts'
import type {
  TutoringSessionRow,
  TutoringSessionTodoRow,
  TutoringTodoTag,
} from './tutoring.repository.ts'

export type TutoringSessionDto = {
  id: string
  tutorName: string
  tutorInitials: string
  focus: string
  startsAt: string
  endsAt: string | null
  status: TutoringSessionRow['status']
  joinUrl: string | null
  recordingStatus: TutoringSessionRow['recording_status']
  transcriptStatus: TutoringSessionRow['transcript_status']
  action: 'join' | 'reschedule'
  month: string
  day: string
  whenLabel: string
  dateLabel: string
  title: string
}

/** Free strategy call card on /app/free-strategy-call (booked vs completed). */
export type FreeStrategyCallDto = {
  id: string
  status: TutoringSessionRow['status']
  /** Finished call — show Status detail instead of Join/Reschedule. */
  isCompleted: boolean
  tutorName: string
  joinUrl: string | null
  startsAt: string
  endsAt: string | null
  timezone: string | null
  dateLabel: string
  timeLabel: string
  timezoneLabel: string
  focus: string
  title: string
  transcriptStatus: TutoringSessionRow['transcript_status']
  recordingStatus: TutoringSessionRow['recording_status']
  customerEmail: string | null
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
}

function formatWhenLabel(startsAt: string, timeZone: string | null): string {
  try {
    const d = new Date(startsAt)
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timeZone || undefined,
    }).format(d)
  } catch {
    return startsAt
  }
}

export function mapSessionRowToDto(row: TutoringSessionRow, now = new Date()): TutoringSessionDto {
  const starts = new Date(row.starts_at)
  const tutorName = row.tutor_name?.trim() || 'Tutor'
  const focus = row.focus?.trim() || 'Tutoring session'
  const upcoming = starts.getTime() >= now.getTime() - 15 * 60 * 1000 && row.status === 'scheduled'
  return {
    id: row.id,
    tutorName,
    tutorInitials: initials(tutorName),
    focus,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    joinUrl: row.join_url,
    recordingStatus: row.recording_status,
    transcriptStatus: row.transcript_status,
    action: upcoming && row.join_url ? 'join' : 'reschedule',
    month: MONTHS[starts.getUTCMonth()] ?? '',
    day: String(starts.getUTCDate()),
    whenLabel: formatWhenLabel(row.starts_at, row.timezone),
    dateLabel: `${MONTHS[starts.getUTCMonth()] ?? ''} ${starts.getUTCDate()}`,
    title: focus,
  }
}

function formatStrategyDateLabel(startsAt: string, timeZone: string | null): string {
  const tz = timeZone?.trim() || 'America/New_York'
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: tz,
    }).format(new Date(startsAt))
  } catch {
    return startsAt
  }
}

function formatStrategyTimeLabel(
  startsAt: string,
  endsAt: string | null,
  timeZone: string | null,
): string {
  const tz = timeZone?.trim() || 'America/New_York'
  try {
    const start = new Date(startsAt)
    const time = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz,
    }).format(start)
    let minutes = 15
    if (endsAt) {
      const end = new Date(endsAt)
      const diff = Math.round((end.getTime() - start.getTime()) / 60_000)
      if (diff > 0) minutes = diff
    }
    return `${time} · ${minutes} min`
  } catch {
    return startsAt
  }
}

/** Normalize ICU offsets to Figma-style `GMT+5` (not `GMT+05:00` / `UTC+5`). */
function normalizeGmtOffset(raw: string): string {
  return raw
    .replace(/^UTC/, 'GMT')
    .replace(/([+-])0(\d)(?::00)?$/, '$1$2')
    .replace(/([+-]\d+):00$/, '$1')
}

function formatTimezoneLabel(timeZone: string | null, at: string): string {
  const tz = timeZone?.trim() || 'America/New_York'
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date(at))
    const raw = parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
    const offset = raw ? normalizeGmtOffset(raw) : ''
    return offset ? `${tz} (${offset})` : tz
  } catch {
    return tz
  }
}

export function mapFreeStrategyCallDto(
  row: TutoringSessionRow,
  customerEmail: string | null,
  now = new Date(),
): FreeStrategyCallDto {
  const starts = new Date(row.starts_at)
  const tutorName = row.tutor_name?.trim() || 'Tutor'
  const focus = row.focus?.trim() || '15-Minute Free Strategy Call'
  const isCompleted =
    row.status === 'completed' ||
    row.status === 'no_show' ||
    (row.status === 'scheduled' && starts.getTime() < now.getTime())
  return {
    id: row.id,
    status: row.status,
    isCompleted,
    tutorName,
    joinUrl: row.join_url,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timezone: row.timezone,
    dateLabel: formatStrategyDateLabel(row.starts_at, row.timezone),
    timeLabel: formatStrategyTimeLabel(row.starts_at, row.ends_at, row.timezone),
    timezoneLabel: formatTimezoneLabel(row.timezone, row.starts_at),
    focus,
    title: focus,
    transcriptStatus: row.transcript_status,
    recordingStatus: row.recording_status,
    customerEmail,
  }
}

function asTakeawayList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function parseClockToSeconds(time: string): number {
  const parts = time.trim().split(':').map((part) => Number(part))
  if (parts.some((n) => Number.isNaN(n))) return 0
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!
  return parts[0] ?? 0
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const hh = Math.floor(s / 3600)
  const mm = Math.floor((s % 3600) / 60)
  const ss = s % 60
  if (hh > 0) {
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

function significantWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 4)
}

/** Find the transcript timestamp that best matches a topic/action phrase. */
export function findTranscriptTimeForPhrase(
  lines: Array<{ time: string; text: string }>,
  phrase: string,
): string | null {
  if (lines.length === 0) return null
  const words = significantWords(phrase)
  if (words.length === 0) return lines[0]?.time ?? null

  let bestIndex = -1
  let bestScore = 0
  for (let i = 0; i < lines.length; i++) {
    const hay = lines[i]!.text.toLowerCase()
    let score = 0
    for (const word of words) {
      if (hay.includes(word)) score += 1
    }
    if (score > bestScore) {
      bestScore = score
      bestIndex = i
    }
  }
  if (bestScore === 0) return null
  return lines[bestIndex]?.time ?? null
}

export type TranscriptViewerSegment = {
  id: string
  time: string
  label: string
  kind: 'topic' | 'action'
}

/**
 * Build scrubber tags from Zoom summary_details (topics) and next_steps (Actions needed).
 * Falls back to a single "Session" tag when summary data is missing.
 */
export function buildTranscriptSegments(
  lines: Array<{ time: string; text: string }>,
  summaryJson: unknown,
): TranscriptViewerSegment[] {
  const root = asRecord(summaryJson) ?? {}
  const object =
    asRecord(root.object) ??
    asRecord(asRecord(root.payload)?.object) ??
    root

  const segments: TranscriptViewerSegment[] = []
  const details = object.summary_details
  if (Array.isArray(details)) {
    details.forEach((item, index) => {
      const rec = asRecord(item)
      const label = asString(rec?.label) ?? asString(rec?.summary) ?? asString(rec?.text)
      if (!label) return
      const time =
        findTranscriptTimeForPhrase(lines, label) ??
        lines[Math.min(index, Math.max(0, lines.length - 1))]?.time ??
        '00:00'
      segments.push({
        id: `topic-${index + 1}`,
        time,
        label: label.length > 42 ? `${label.slice(0, 39).trim()}…` : label,
        kind: 'topic',
      })
    })
  }

  const nextSteps: string[] = []
  const rawSteps = object.next_steps
  if (Array.isArray(rawSteps)) {
    for (const step of rawSteps) {
      if (typeof step === 'string' && step.trim()) nextSteps.push(step.trim())
      else {
        const rec = asRecord(step)
        const label =
          asString(rec?.label) ??
          asString(rec?.text) ??
          asString(rec?.content) ??
          asString(rec?.next_step)
        if (label) nextSteps.push(label)
      }
    }
  }

  if (nextSteps.length > 0) {
    const joined = nextSteps.join(' ')
    const time =
      findTranscriptTimeForPhrase(lines, joined) ??
      lines[Math.max(0, lines.length - 1)]?.time ??
      '00:00'
    segments.push({
      id: 'actions-needed',
      time,
      label: 'Actions needed',
      kind: 'action',
    })
  }

  if (segments.length > 0) {
    return segments.sort(
      (a, b) => parseClockToSeconds(a.time) - parseClockToSeconds(b.time),
    )
  }

  if (lines.length === 0) return []
  return [{ id: 'seg-1', time: lines[0]!.time, label: 'Session', kind: 'topic' }]
}

export function mapTranscriptJsonToViewer(input: {
  sessionId: string
  title: string
  metaLabel: string
  lines: ParsedTranscriptLine[] | unknown
  takeaways?: unknown
  summaryJson?: unknown
  recordingUrl?: string | null
  zoomShareUrl?: string | null
  durationSeconds?: number | null
}) {
  const lines = Array.isArray(input.lines) ? (input.lines as ParsedTranscriptLine[]) : []
  const totalSeconds = input.durationSeconds ?? 0
  const totalTime = formatClock(totalSeconds)
  const segments = buildTranscriptSegments(lines, input.summaryJson)

  return {
    sessionId: input.sessionId,
    title: input.title,
    metaLabel: input.metaLabel,
    takeaways: asTakeawayList(input.takeaways),
    currentTime: segments[0]?.time ?? lines[0]?.time ?? '00:00',
    totalTime,
    segments,
    lines: lines.map((line) => ({
      id: line.id,
      speaker: line.speaker === 'tutor' || line.speaker === 'student' ? line.speaker : 'tutor',
      name: line.name,
      initials: line.initials,
      time: line.time,
      text: line.text,
    })),
    recordingUrl: input.recordingUrl ?? null,
    zoomShareUrl: input.zoomShareUrl ?? null,
  }
}

export type TutoringTodoDto = {
  id: string
  sessionId: string
  title: string
  tag: TutoringTodoTag
  source: TutoringSessionTodoRow['source']
  done: boolean
  createdLabel: string
  dueLabel: string
  /** ISO timestamp for edit forms; null when unset. */
  dueAt: string | null
}

function formatTodoCreatedLabel(iso: string): string {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d)
  } catch {
    return iso
  }
}

function formatTodoDueLabel(dueAt: string | null): string {
  if (!dueAt) return 'No due date'
  try {
    const d = new Date(dueAt)
    return `Due ${new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(d)}`
  } catch {
    return 'No due date'
  }
}

export function mapTodoRowToDto(row: TutoringSessionTodoRow): TutoringTodoDto {
  return {
    id: row.id,
    sessionId: row.session_id,
    title: row.title,
    tag: row.tag,
    source: row.source,
    done: row.done,
    createdLabel: formatTodoCreatedLabel(row.created_at),
    dueLabel: formatTodoDueLabel(row.due_at),
    dueAt: row.due_at,
  }
}

/**
 * Amelia appointment `bookingStart` / `bookingEnd` are stored as UTC wall times
 * (`YYYY-MM-DD HH:mm`). Customer `timeZone` is for display only — do not re-apply it.
 */
export function ameliaUtcDateTimeToIso(utcDateTime: string): string {
  const trimmed = utcDateTime.trim()
  const withT = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T')
  const withoutZ = withT.replace(/Z$/i, '')
  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(withoutZ)
    ? `${withoutZ}:00`
    : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(withoutZ)
      ? withoutZ.slice(0, 19)
      : withoutZ
  const ms = Date.parse(`${normalized}Z`)
  if (Number.isNaN(ms)) return new Date().toISOString()
  return new Date(ms).toISOString()
}

/** Interpret a wall-clock time in `timeZone` (e.g. slots the client picked). */
export function ameliaLocalDateTimeToIso(localDateTime: string, timeZone: string): string {
  const trimmed = localDateTime.trim()
  const normalized = (trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T')).replace(/Z$/i, '')
  const asUtcGuess = new Date(`${normalized}:00`)
  if (!Number.isNaN(asUtcGuess.getTime()) && !timeZone) return asUtcGuess.toISOString()

  const probe = new Date(`${normalized}Z`)
  if (Number.isNaN(probe.getTime())) return new Date().toISOString()
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    const parts = fmt.formatToParts(probe)
    const get = (type: string) => parts.find((p) => p.type === type)?.value
    const offsetRaw = get('timeZoneName') ?? 'GMT'
    const match = offsetRaw.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/)
    let offsetMinutes = 0
    if (match) {
      const hours = Number(match[1])
      const mins = Number(match[2] ?? '0')
      offsetMinutes = hours * 60 + Math.sign(hours || 1) * mins
    }
    const wall = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)
      ? `${normalized}:00`
      : normalized.slice(0, 19)
    const utcMs = Date.parse(`${wall}Z`) - offsetMinutes * 60_000
    return new Date(utcMs).toISOString()
  } catch {
    return probe.toISOString()
  }
}
