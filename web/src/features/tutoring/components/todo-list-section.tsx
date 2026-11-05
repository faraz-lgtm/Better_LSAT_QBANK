import { useMemo, useState } from "react"
import { Clock3, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { TodoTag, TutoringTodo } from "@/features/tutoring/lib/types"
import { cn } from "@/lib/utils"

type TodoListSectionProps = {
  todos: TutoringTodo[]
}

const TAG_CLASS: Record<TodoTag, string> = {
  Homework: "bg-[#fff4e8] text-[#b45309]",
  "Session prep": "bg-[var(--primary-25)] text-[var(--primary)]",
  Review: "bg-[#ddf3e7] text-[#17996f]",
  Setup: "bg-[var(--greyscale-50)] text-[var(--greyscale-500)]",
}

function TodoListSection({ todos: initialTodos }: TodoListSectionProps) {
  const [todos, setTodos] = useState(initialTodos)

  const doneCount = useMemo(() => todos.filter((todo) => todo.done).length, [todos])
  const progress = todos.length === 0 ? 0 : Math.round((doneCount / todos.length) * 100)

  function toggleTodo(id: string) {
    setTodos((current) =>
      current.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)),
    )
  }

  return (
    <section className="rounded-[16px] border border-[#e4e9f2] bg-[var(--greyscale-0)] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[18px] font-bold leading-[1.35] text-[var(--color-student-heading)]">To-Do List</h2>
          <p className="mt-1 text-xs tracking-[0.02em] text-[var(--greyscale-500)]">
            Homework from your tutors and prep for your next session.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="rounded-full bg-[var(--primary-25)] px-3 py-1.5 text-xs font-semibold tracking-[0.02em] text-[var(--primary)]">
            {doneCount} of {todos.length} done
          </span>
          <Button type="button" variant="outline" size="sm" className="h-10 gap-1.5 rounded-[10px]">
            <Plus className="size-3.5" aria-hidden />
            Add Task
          </Button>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e4e9f2]">
        <div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${progress}%` }} />
      </div>

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
              onChange={() => toggleTodo(todo.id)}
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
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tracking-[0.02em]",
                TAG_CLASS[todo.tag],
              )}
            >
              {todo.tag}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[12px] border border-dashed border-[#d5deec] text-sm font-semibold text-[var(--primary)] hover:bg-[var(--primary-0)]"
      >
        <Plus className="size-3.5" aria-hidden />
        Add a task
      </button>
    </section>
  )
}

export { TodoListSection }
