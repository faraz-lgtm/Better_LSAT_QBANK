import { useMemo, useState } from "react"
import { Clock3, Pencil, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"
import type { TodoTag, TutoringTodo } from "@/features/tutoring/lib/types"
import { cn } from "@/lib/utils"

type TodoFormInput = {
  title: string
  tag: TodoTag
  dueAt?: string | null
}

type TodoListSectionProps = {
  todos: TutoringTodo[]
  sessionId?: string | null
  loading?: boolean
  onToggle?: (todoId: string, done: boolean) => void | Promise<void>
  onAdd?: (input: TodoFormInput) => void | Promise<void>
  onEdit?: (todoId: string, input: TodoFormInput) => void | Promise<void>
}

const PRESET_TAG_CLASS: Record<string, string> = {
  Homework: "bg-[#fff4e8] text-[#b45309]",
  "Session prep": "bg-[var(--primary-25)] text-[var(--primary)]",
  Review: "bg-[#ddf3e7] text-[#17996f]",
  Setup: "bg-[var(--greyscale-50)] text-[var(--greyscale-500)]",
}

function tagClass(tag: string): string {
  return PRESET_TAG_CLASS[tag] ?? "bg-[var(--greyscale-50)] text-[var(--greyscale-500)]"
}

function formatCreatedNow(): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date())
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return ""
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return ""
  return parsed.toISOString().slice(0, 10)
}

function TodoListSection({
  todos,
  sessionId = null,
  loading = false,
  onToggle,
  onAdd,
  onEdit,
}: TodoListSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<TutoringTodo | null>(null)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Homework")
  const [dueDate, setDueDate] = useState("")
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [createdLabel] = useState(() => formatCreatedNow())

  const doneCount = useMemo(() => todos.filter((todo) => todo.done).length, [todos])
  const progress = todos.length === 0 ? 0 : Math.round((doneCount / todos.length) * 100)
  const canToggle = Boolean(sessionId && onToggle)
  const canAdd = Boolean(sessionId && onAdd)
  const canEdit = Boolean(sessionId && onEdit)
  const canSubmit = Boolean(title.trim() && category.trim())
  const isEditing = Boolean(editingTodo)

  function resetForm() {
    setEditingTodo(null)
    setTitle("")
    setCategory("Homework")
    setDueDate("")
  }

  function openAddDialog() {
    resetForm()
    setDialogOpen(true)
  }

  function openEditDialog(todo: TutoringTodo) {
    setEditingTodo(todo)
    setTitle(todo.title)
    setCategory(todo.tag)
    setDueDate(toDateInputValue(todo.dueAt))
    setDialogOpen(true)
  }

  async function handleToggle(todo: TutoringTodo) {
    if (!onToggle) return
    setBusyId(todo.id)
    try {
      await onToggle(todo.id, !todo.done)
    } finally {
      setBusyId(null)
    }
  }

  async function handleSubmit() {
    if (!sessionId || !canSubmit) return
    const payload: TodoFormInput = {
      title: title.trim(),
      tag: category.trim(),
      dueAt: dueDate.trim() ? dueDate.trim() : null,
    }
    setSaving(true)
    try {
      if (editingTodo) {
        if (!onEdit) return
        await onEdit(editingTodo.id, payload)
      } else {
        if (!onAdd) return
        await onAdd(payload)
      }
      resetForm()
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-[16px] border border-[#e4e9f2] bg-[var(--greyscale-0)] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[18px] font-bold leading-[1.35] text-[var(--color-student-heading)]">To-Do List</h2>
          <p className="mt-1 text-xs tracking-[0.02em] text-[var(--greyscale-500)]">
            {sessionId
              ? "Homework from this session's Zoom summary and tasks you add."
              : "Select a past session to see its homework and add tasks."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-full bg-[var(--primary-25)] px-3 py-1.5 text-xs font-semibold tracking-[0.02em] text-[var(--primary)]">
            {doneCount} of {todos.length} done
          </span>
          {canAdd ? (
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-1.5 rounded-[10px] px-3"
              onClick={openAddDialog}
            >
              <Plus className="size-3.5" aria-hidden />
              Add Task
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e4e9f2]">
        <div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${progress}%` }} />
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-[var(--greyscale-500)]">Loading to-dos…</p>
      ) : !sessionId ? (
        <p className="mt-4 rounded-[12px] border border-dashed border-[#d5deec] px-4 py-8 text-center text-sm text-[var(--greyscale-500)]">
          Select a past session with a transcript to view its to-do list.
        </p>
      ) : todos.length === 0 ? (
        <p className="mt-4 rounded-[12px] border border-dashed border-[#d5deec] px-4 py-8 text-center text-sm text-[var(--greyscale-500)]">
          No tasks yet. Add a task, or wait for the Zoom meeting summary next steps.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className={cn(
                "flex items-start gap-3 rounded-[12px] border border-[#e4e9f2] px-4 py-3.5",
                todo.done && "bg-[#f7f9fc]",
              )}
            >
              <Checkbox
                checked={todo.done}
                disabled={!canToggle || busyId === todo.id}
                onChange={() => void handleToggle(todo)}
                aria-label={todo.title}
                className="mt-1"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm tracking-[0.02em] text-[var(--color-student-heading)]",
                    todo.done && "line-through text-[var(--greyscale-500)]",
                  )}
                >
                  {todo.title}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tracking-[0.02em] text-[var(--greyscale-500)]">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="size-3" aria-hidden />
                    {todo.createdLabel}
                  </span>
                  <span>{todo.dueLabel}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold tracking-[0.02em]",
                    tagClass(todo.tag),
                  )}
                >
                  {todo.tag}
                </span>
                {canEdit ? (
                  <button
                    type="button"
                    className="inline-flex size-8 items-center justify-center rounded-[8px] text-[var(--greyscale-500)] hover:bg-[#f3f6fb] hover:text-[var(--primary)]"
                    aria-label={`Edit ${todo.title}`}
                    onClick={() => openEditDialog(todo)}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <DialogRoot
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}
      >
        {/* Only mount content while open — avoids ghost overlay covering the page. */}
        {dialogOpen ? (
          <DialogContent
            className="z-50 flex w-full max-w-[520px] flex-col gap-0 overflow-hidden rounded-[16px] border border-[#e4e9f2] bg-[var(--greyscale-0)] p-0 shadow-lg sm:max-w-[520px]"
          >
            <DialogHeader className="flex-row items-start justify-between space-y-0 border-b border-[#e4e9f2] px-[22px] py-[18px] text-left">
              <div className="flex flex-col gap-0.5">
                <DialogTitle className="text-[18px] font-bold leading-[1.35] tracking-normal text-[var(--color-student-heading)]">
                  {isEditing ? "Edit Task" : "Add Task"}
                </DialogTitle>
                <DialogDescription className="text-xs tracking-[0.02em] text-[var(--greyscale-500)]">
                  {isEditing
                    ? `Created ${editingTodo?.createdLabel ?? ""}`
                    : `Created ${createdLabel}`}
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#f3f6fb] text-[var(--greyscale-500)] hover:bg-[#e8eef7]"
                  aria-label="Close"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </DialogClose>
            </DialogHeader>

            <div className="flex flex-col gap-4 px-[22px] py-5">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold tracking-[0.02em] text-[var(--color-student-heading)]">
                  <span className="text-[#b91c1c]">*</span> Task
                </span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Drill 10 Parallel Reasoning questions"
                  className="h-11 w-full rounded-[10px] border border-[#d5deec] bg-[var(--greyscale-0)] px-3 text-sm tracking-[0.02em] text-[var(--color-student-heading)] outline-none placeholder:text-[rgba(14,42,92,0.5)] focus:border-[var(--primary)]"
                  disabled={saving}
                  autoFocus
                />
              </label>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold tracking-[0.02em] text-[var(--color-student-heading)]">
                    Category
                  </span>
                  <input
                    type="text"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    placeholder="Homework"
                    className="h-11 w-full rounded-[10px] border border-[#d5deec] bg-[var(--greyscale-0)] px-3 text-sm tracking-[0.02em] text-[var(--color-student-heading)] outline-none placeholder:text-[rgba(14,42,92,0.5)] focus:border-[var(--primary)]"
                    disabled={saving}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold tracking-[0.02em] text-[var(--color-student-heading)]">
                    Due date
                  </span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="h-11 w-full rounded-[10px] border border-[#d5deec] bg-[var(--greyscale-0)] px-3 text-sm tracking-[0.02em] text-[var(--color-student-heading)] outline-none focus:border-[var(--primary)]"
                    disabled={saving}
                  />
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2.5 border-t border-[#e4e9f2] px-[22px] py-3.5 sm:justify-end">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 min-h-11 rounded-[10px] border-[#d5deec] px-[18px] text-xs font-bold tracking-[0.02em] text-[var(--primary)]"
                  disabled={saving}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                className={cn(
                  "h-11 min-h-11 rounded-[10px] px-5 text-xs font-bold tracking-[0.02em]",
                  canSubmit
                    ? "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
                    : "bg-[#d5deec] text-[var(--greyscale-500)] hover:bg-[#d5deec]",
                )}
                disabled={saving || !canSubmit}
                onClick={() => void handleSubmit()}
              >
                {isEditing ? "Save Changes" : "Add Task"}
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </DialogRoot>
    </section>
  )
}

export { TodoListSection }
