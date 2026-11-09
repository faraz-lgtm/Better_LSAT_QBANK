import type { ParsedTranscriptLine } from '../_shared/zoom-vtt.ts'
import type { TutoringSessionRow } from './tutoring.repository.ts'

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

export function mapTranscriptJsonToViewer(input: {
  sessionId: string
  title: string
  metaLabel: string
  lines: ParsedTranscriptLine[] | unknown
  recordingUrl?: string | null
  durationSeconds?: number | null
}) {
  const lines = Array.isArray(input.lines) ? (input.lines as ParsedTranscriptLine[]) : []
  const totalSeconds = input.durationSeconds ?? 0
  const hh = Math.floor(totalSeconds / 3600)
  const mm = Math.floor((totalSeconds % 3600) / 60)
  const ss = totalSeconds % 60
  const totalTime =
    hh > 0
      ? `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
      : `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`

  return {
    sessionId: input.sessionId,
    title: input.title,
    metaLabel: input.metaLabel,
    takeaways: [] as string[],
    currentTime: lines[0]?.time ?? '00:00',
    totalTime,
    segments: lines.length
      ? [{ id: 'seg-1', time: lines[0]!.time, label: 'Session' }]
      : [],
    lines: lines.map((line) => ({
      id: line.id,
      speaker: line.speaker === 'tutor' || line.speaker === 'student' ? line.speaker : 'tutor',
      name: line.name,
      initials: line.initials,
      time: line.time,
      text: line.text,
    })),
    recordingUrl: input.recordingUrl ?? null,
  }
}

export function ameliaLocalDateTimeToIso(localDateTime: string, timeZone: string): string {
  // Amelia uses `YYYY-MM-DD HH:mm` in the customer's/service timezone.
  const normalized = localDateTime.includes('T')
    ? localDateTime
    : localDateTime.replace(' ', 'T')
  const asUtcGuess = new Date(`${normalized}:00`)
  if (!Number.isNaN(asUtcGuess.getTime()) && !timeZone) return asUtcGuess.toISOString()

  // Interpret wall time in timezone via Intl offset round-trip.
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
    const utcMs = Date.parse(`${normalized}:00Z`) - offsetMinutes * 60_000
    return new Date(utcMs).toISOString()
  } catch {
    return probe.toISOString()
  }
}
