import { useEffect, useMemo, useState } from "react"
import { Bookmark, ChevronRight, Eraser, Search, X } from "lucide-react"

import {
  BLIND_REVIEW_NOTES_SIDEBAR_CLASS,
  REVIEW_SIDEBAR_CLASS,
} from "@/features/student/practice-session/practice-session-blind-review-styles"
import { cn } from "@/lib/utils"

export type PracticeSessionNote = {
  id: string
  questionId: string
  tag: string
  body: string
  createdAt: string
}

function loadNotes(storageKey: string): PracticeSessionNote[] {
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PracticeSessionNote[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveNotes(storageKey: string, notes: PracticeSessionNote[]) {
  sessionStorage.setItem(storageKey, JSON.stringify(notes))
}

type PracticeSessionNotesPanelProps = {
  open: boolean
  storageKey: string
  questionTag: string
  activeQuestionId: string | null
  onClose: () => void
  variant?: "default" | "blind-review"
  chrome?: "blind-review" | "review"
}

function PracticeSessionNotesPanel({
  open,
  storageKey,
  questionTag,
  activeQuestionId,
  onClose,
  variant = "default",
  chrome = "blind-review",
}: PracticeSessionNotesPanelProps) {
  const [notes, setNotes] = useState<PracticeSessionNote[]>(() => loadNotes(storageKey))
  const [draft, setDraft] = useState("")
  const [search, setSearch] = useState("")
  const isBlindReview = variant === "blind-review"
  const isReviewChrome = isBlindReview && chrome === "review"

  useEffect(() => {
    setNotes(loadNotes(storageKey))
  }, [storageKey])

  useEffect(() => {
    saveNotes(storageKey, notes)
  }, [notes, storageKey])

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return notes
    return notes.filter(
      (n) =>
        n.body.toLowerCase().includes(q) ||
        n.tag.toLowerCase().includes(q) ||
        n.questionId.toLowerCase().includes(q),
    )
  }, [notes, search])

  function handleAddNote() {
    const body = draft.trim()
    if (!body || !activeQuestionId) return
    const entry: PracticeSessionNote = {
      id: `${activeQuestionId}-${Date.now()}`,
      questionId: activeQuestionId,
      tag: questionTag,
      body,
      createdAt: new Date().toISOString(),
    }
    setNotes((prev) => [entry, ...prev])
    setDraft("")
  }

  if (!open) return null

  if (isBlindReview) {
    const examNotesChrome = !isReviewChrome
    return (
      <aside className={cn(BLIND_REVIEW_NOTES_SIDEBAR_CLASS, isReviewChrome && REVIEW_SIDEBAR_CLASS)}>
        <div
          className={cn(
            "flex shrink-0 items-center justify-between",
            isReviewChrome ? "h-[70px] px-6 pb-3 pt-9" : "px-6 pb-0 pt-9",
          )}
        >
          <h2
            className={cn(
              "text-[var(--color-student-heading)]",
              isReviewChrome
                ? "text-sm font-semibold leading-[1.5] tracking-[0.28px]"
                : "text-sm font-medium leading-[1.5] tracking-[0.28px]",
            )}
          >
            Notes
          </h2>
          <button
            type="button"
            className={cn(
              "inline-flex size-7 items-center justify-center rounded text-[var(--greyscale-500)] transition hover:bg-[var(--greyscale-25)] hover:text-[var(--color-student-heading)]",
              (isReviewChrome || examNotesChrome) && "sr-only",
            )}
            aria-label="Close notes"
            onClick={onClose}
          >
            <X className="size-5" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className={cn("flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto", examNotesChrome ? "p-6 pt-6" : "p-6 pt-0")}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Start typing your notes..."
            className="min-h-[256px] w-full resize-none rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-4 py-4 text-sm leading-[1.5] tracking-[0.28px] text-[var(--color-student-heading)] placeholder:text-[var(--greyscale-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          />

          <div className="flex h-8 items-center gap-2 text-[var(--greyscale-500)]">
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded transition hover:bg-[var(--greyscale-25)] hover:text-[var(--color-student-heading)]"
              aria-label="Erase"
              onClick={() => setDraft("")}
            >
              <Eraser className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded transition hover:bg-[var(--greyscale-25)] hover:text-[var(--color-student-heading)]"
              aria-label="Bookmark note"
            >
              <Bookmark className="size-4" aria-hidden />
            </button>
          </div>

          <button
            type="button"
            disabled={!draft.trim() || !activeQuestionId}
            onClick={handleAddNote}
            className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-[var(--primary)] text-base font-medium tracking-[0.32px] text-white transition hover:opacity-90 disabled:opacity-50"
          >
            Add Note
          </button>

          <div className="border-t border-[var(--greyscale-100)] pt-6">
            <p className="text-sm uppercase tracking-[0.05em] text-[var(--greyscale-500)]">Tags</p>
            <span className="mt-3 inline-flex h-6 items-center rounded-full bg-[var(--primary-0)] px-3 text-xs text-[var(--primary)] dark:bg-[var(--secondary-0)]">
              {questionTag}
            </span>
          </div>

          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--greyscale-500)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="h-[38px] w-full rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] pl-10 pr-4 text-sm text-[var(--color-student-heading)] placeholder:text-[var(--greyscale-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </label>

          {filteredNotes.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {filteredNotes.map((note) => (
                <li
                  key={note.id}
                  className={cn(
                    "rounded-[10px] border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-3 py-2.5",
                    note.questionId === activeQuestionId &&
                      "border-[var(--primary)]/40 bg-[var(--primary-25)] dark:border-[var(--primary)]",
                  )}
                >
                  <p className="text-xs text-[var(--greyscale-500)]">{note.tag}</p>
                  <p className="mt-1 text-sm leading-normal text-[var(--color-student-heading)]">{note.body}</p>
                </li>
              ))}
            </ul>
          ) : null}

          <button
            type="button"
            className="flex h-11 w-full items-center justify-between rounded-[10px] px-4 text-sm font-medium text-[var(--color-student-heading)] transition hover:bg-[var(--greyscale-25)]"
          >
            <span>All notes</span>
            <ChevronRight className="size-4 text-[var(--greyscale-500)]" aria-hidden />
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex h-full min-h-0 w-[35%] min-w-[300px] max-w-[420px] shrink-0 flex-col border-l border-[var(--greyscale-100)] bg-[var(--greyscale-0)]">
      <div className="border-b border-[var(--greyscale-100)] px-5 py-4">
        <h2 className="text-xl font-bold text-[var(--color-student-heading)]">Notes</h2>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Start typing your notes…"
          className="min-h-[140px] w-full resize-none rounded-2xl border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-4 py-3 text-sm leading-normal text-[var(--color-student-heading)] placeholder:text-[var(--greyscale-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
        />

        <div className="flex items-center gap-3 text-[var(--greyscale-500)]">
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-[var(--greyscale-25)] hover:text-[var(--color-student-heading)]"
            aria-label="Erase"
          >
            <Eraser className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-[var(--greyscale-25)] hover:text-[var(--color-student-heading)]"
            aria-label="Bookmark note"
          >
            <Bookmark className="size-4" aria-hidden />
          </button>
        </div>

        <button
          type="button"
          disabled={!draft.trim() || !activeQuestionId}
          onClick={handleAddNote}
          className="ds-btn w-full disabled:opacity-50"
        >
          Add Note
        </button>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--greyscale-500)]">Tags</p>
          <span className="inline-flex rounded-full border border-[var(--primary)]/30 bg-[var(--primary-0)] px-3 py-1 text-xs font-semibold text-[var(--primary)] dark:bg-[var(--secondary-0)]">
            {questionTag}
          </span>
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--greyscale-500)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="h-10 w-full rounded-xl border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] pl-9 pr-3 text-sm text-[var(--color-student-heading)] placeholder:text-[var(--greyscale-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          />
        </label>

        <ul className="flex flex-col gap-2">
          {filteredNotes.length === 0 ? (
            <li className="rounded-xl border border-dashed border-[var(--greyscale-100)] px-3 py-6 text-center text-xs text-[var(--greyscale-500)]">
              No notes yet for this section.
            </li>
          ) : (
            filteredNotes.map((note) => (
              <li
                key={note.id}
                className={cn(
                  "rounded-xl border border-[var(--greyscale-100)] bg-[var(--greyscale-25)] px-3 py-2.5",
                  note.questionId === activeQuestionId &&
                    "border-[var(--primary)]/40 bg-[var(--primary-25)] dark:border-[var(--primary)]",
                )}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--greyscale-500)]">
                  {note.tag}
                </p>
                <p className="mt-1 text-sm leading-[1.45] text-[var(--color-student-heading)]">{note.body}</p>
              </li>
            ))
          )}
        </ul>
      </div>

      <button
        type="button"
        className="flex items-center justify-between border-t border-[var(--greyscale-100)] bg-[var(--primary-0)] px-5 py-3.5 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--primary-25)]"
      >
        <span>All notes</span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          {notes.length}
          <ChevronRight className="size-4" aria-hidden />
        </span>
      </button>
    </aside>
  )
}

export { PracticeSessionNotesPanel, loadNotes }
