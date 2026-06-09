import { useEffect, useMemo, useState } from "react"
import { Bookmark, ChevronRight, Eraser, Search } from "lucide-react"

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
}

function PracticeSessionNotesPanel({
  open,
  storageKey,
  questionTag,
  activeQuestionId,
}: PracticeSessionNotesPanelProps) {
  const [notes, setNotes] = useState<PracticeSessionNote[]>(() => loadNotes(storageKey))
  const [draft, setDraft] = useState("")
  const [search, setSearch] = useState("")

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
