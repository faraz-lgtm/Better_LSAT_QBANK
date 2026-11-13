export type TutoringPackageId = "single" | "pack-5" | "pack-10" | "pack-20"

export type TutoringPackage = {
  id: TutoringPackageId
  name: string
  price: string
  compareAtPrice: string
  saveLabel?: string
  description: string
  features: string[]
  popular?: boolean
  /** Label for the package card booking CTA. */
  ctaLabel: string
  /** Checkout/booking page embedded in the package modal iframe. */
  bookingUrl: string
}

export type TutoringTestimonial = {
  id: string
  name: string
  /** Gumlet (or other) embed URL for the student video. */
  videoEmbedSrc: string
  quote?: string
}

export type PackageSlotStatus = "completed" | "scheduled" | "unscheduled"

export type ActivePackageSummary = {
  name: string
  purchasedLabel: string
  slots: PackageSlotStatus[]
  completed: number
  scheduled: number
  notScheduled: number
}

export type TutoringSessionSummary = {
  id: string
  month: string
  day: string
  title: string
  whenLabel: string
  tutorName: string
  tutorInitials: string
  focus: string
  action: "join" | "reschedule"
  joinUrl?: string | null
}

export type PastSessionRow = {
  id: string
  dateLabel: string
  tutorName: string
  focus: string
  transcriptStatus?: "none" | "processing" | "ready" | "failed"
  recordingStatus?: "none" | "processing" | "ready" | "failed"
  joinUrl?: string | null
}

export type TranscriptSegment = {
  id: string
  time: string
  label: string
  /** Zoom topic chapter vs next-step / homework marker. */
  kind?: "topic" | "action"
}

export type TranscriptLine = {
  id: string
  speaker: "tutor" | "student"
  name: string
  initials: string
  time: string
  text: string
}

export type SessionTranscript = {
  sessionId: string
  title: string
  metaLabel: string
  takeaways: string[]
  currentTime: string
  totalTime: string
  segments: TranscriptSegment[]
  lines: TranscriptLine[]
  recordingUrl?: string | null
  /** Zoom cloud recording share page when in-app MP4 is unavailable. */
  zoomShareUrl?: string | null
}

/** Preset categories; free-text categories are also allowed. */
export type TodoTag = string

export type TutoringTodo = {
  id: string
  sessionId: string
  title: string
  createdLabel: string
  dueLabel: string
  /** ISO timestamp for edit forms; null/omitted when unset. */
  dueAt?: string | null
  tag: TodoTag
  done: boolean
  source?: "zoom_summary" | "user"
}

export type TutoringSessionsViewModel = {
  hasActivePackage: boolean
  nextSession: TutoringSessionSummary | null
  activePackage: ActivePackageSummary | null
  pastSessions: PastSessionRow[]
  transcript: SessionTranscript | null
  todos: TutoringTodo[]
  upcomingSessions: TutoringSessionSummary[]
  packages: TutoringPackage[]
  testimonials: TutoringTestimonial[]
}
