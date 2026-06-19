import { useEffect, useMemo, useState } from "react"
import { Bookmark, ChevronRight, Eraser, Search, X } from "lucide-react"

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
}

function PracticeSessionNotesPanel({
  open,
  storageKey,
  questionTag,
  activeQuestionId,
  onClose,
  variant = "default",
}: PracticeSessionNotesPanelProps) {
  const [notes, setNotes] = useState<PracticeSessionNote[]>(() => loadNotes(storageKey))
  const [draft, setDraft] = useState("")
  const [search, setSearch] = useState("")
  const isBlindReview = variant === "blind-review"

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
    return (
      <aside className="flex h-full min-h-0 w-[451px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
        <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-[#f6f8fa] px-4 pt-4">
          <h2 className="text-lg font-bold leading-[1.35] text-[#062357]">Notes</h2>
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded text-[#666d80] transition hover:bg-white hover:text-[#062357]"
            aria-label="Close notes"
            onClick={onClose}
          >
            <X className="size-5" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Start typing your notes..."
            className="min-h-[256px] w-full resize-none rounded-[10px] border border-[#e5e7eb] bg-white px-4 py-4 text-sm leading-normal tracking-[0.02em] text-[#062357] placeholder:text-[rgba(10,10,10,0.5)] focus:outline-none focus:ring-2 focus:ring-[#0d47a1]/20"
          />

          <div className="flex items-center gap-2 text-[#666d80]">
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded transition hover:bg-[#f6f8fa]"
              aria-label="Erase"
              onClick={() => setDraft("")}
            >
              <Eraser className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded transition hover:bg-[#f6f8fa]"
              aria-label="Bookmark note"
            >
              <Bookmark className="size-4" aria-hidden />
            </button>
          </div>

          <button
            type="button"
            disabled={!draft.trim() || !activeQuestionId}
            onClick={handleAddNote}
            className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-[#0d47a1] text-base font-medium tracking-[0.02em] text-white transition hover:bg-[#0a3d8a] disabled:opacity-50"
          >
            Add Note
          </button>

          <div className="border-t border-[#e5e7eb] pt-6">
            <p className="text-sm uppercase tracking-[0.05em] text-[#6a7282]">Tags</p>
            <span className="mt-3 inline-flex h-6 items-center rounded-full bg-[#e3f2fd] px-3 text-xs text-[#0d47a1]">
              {questionTag}
            </span>
          </div>

          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[rgba(10,10,10,0.5)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="h-[38px] w-full rounded-[10px] border border-[#e5e7eb] bg-white pl-10 pr-4 text-sm text-[#062357] placeholder:text-[rgba(10,10,10,0.5)] focus:outline-none focus:ring-2 focus:ring-[#0d47a1]/20"
            />
          </label>

          {filteredNotes.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {filteredNotes.map((note) => (
                <li
                  key={note.id}
                  className={cn(
                    "rounded-[10px] border border-[#e5e7eb] bg-[#f9fbfc] px-3 py-2.5",
                    note.questionId === activeQuestionId && "border-[#0d47a1]/30 bg-[#f3f7ff]",
                  )}
                >
                  <p className="text-xs text-[#6a7282]">{note.tag}</p>
                  <p className="mt-1 text-sm leading-normal text-[#364153]">{note.body}</p>
                </li>
              ))}
            </ul>
          ) : null}

          <button
            type="button"
            className="flex h-11 w-full items-center justify-between rounded-[10px] px-4 text-sm font-medium text-[#364153] transition hover:bg-[#f6f8fa]"
          >
            <span>All notes</span>
            <ChevronRight className="size-4 text-[#666d80]" aria-hidden />
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex h-full min-h-0 w-[35%] min-w-[300px] max-w-[420px] shrink-0 flex-col border-l border-[#dfe1e7] bg-white">
      <div className="border-b border-[#dfe1e7] px-5 py-4">
        <h2 className="text-xl font-bold text-[#062357]">Notes</h2>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Start typing your notes…"
          className="min-h-[140px] w-full resize-none rounded-2xl border border-[#dfe1e7] bg-[#f6f8fa] px-4 py-3 text-sm leading-normal text-[#062357] placeholder:text-[#818898] focus:outline-none focus:ring-2 focus:ring-[#0d47a1]/20"
        />

        <div className="flex items-center gap-3 text-[#666d80]">
          <button type="button" className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-[#f6f8fa]" aria-label="Erase">
            <Eraser className="size-4" aria-hidden />
          </button>
          <button type="button" className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-[#f6f8fa]" aria-label="Bookmark note">
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#818898]">Tags</p>
          <span className="inline-flex rounded-full border border-[#c5d9f5] bg-[#edf3ff] px-3 py-1 text-xs font-semibold text-[#0d47a1]">
            {questionTag}
          </span>
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#818898]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="h-10 w-full rounded-xl border border-[#dfe1e7] bg-[#f6f8fa] pl-9 pr-3 text-sm text-[#062357] placeholder:text-[#818898] focus:outline-none focus:ring-2 focus:ring-[#0d47a1]/20"
          />
        </label>

        <ul className="flex flex-col gap-2">
          {filteredNotes.length === 0 ? (
            <li className="rounded-xl border border-dashed border-[#dfe1e7] px-3 py-6 text-center text-xs text-[#818898]">
              No notes yet for this section.
            </li>
          ) : (
            filteredNotes.map((note) => (
              <li
                key={note.id}
                className={cn(
                  "rounded-xl border border-[#dfe1e7] bg-[#f9fbfc] px-3 py-2.5",
                  note.questionId === activeQuestionId && "border-[#0d47a1]/30 bg-[#f3f7ff]",
                )}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#818898]">
                  {note.tag}
                </p>
                <p className="mt-1 text-sm leading-[1.45] text-[#36394a]">{note.body}</p>
              </li>
            ))
          )}
        </ul>
      </div>

      <button
        type="button"
        className="flex items-center justify-between border-t border-[#dfe1e7] bg-[#edf3ff] px-5 py-3.5 text-sm font-semibold text-[#0d47a1] hover:bg-[#e4edff]"
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
