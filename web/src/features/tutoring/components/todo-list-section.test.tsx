import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { TodoListSection } from "@/features/tutoring/components/todo-list-section"
import type { TutoringTodo } from "@/features/tutoring/lib/types"

const todos: TutoringTodo[] = [
  {
    id: "todo-1",
    sessionId: "s1",
    title: "Drill 20 Flaw questions",
    createdLabel: "Nov 12, 2026",
    dueLabel: "No due date",
    tag: "Homework",
    done: false,
  },
]

describe("TodoListSection", () => {
  it("renders empty state when no session is selected", () => {
    render(<TodoListSection todos={[]} sessionId={null} />)
    expect(
      screen.getByText("Select a past session with a transcript to view its to-do list."),
    ).toBeInTheDocument()
  })

  it("toggles and adds tasks through the Add Task dialog", async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    const onAdd = vi.fn().mockResolvedValue(undefined)
    render(
      <TodoListSection
        todos={todos}
        sessionId="s1"
        onToggle={onToggle}
        onAdd={onAdd}
        onEdit={vi.fn()}
      />,
    )

    expect(screen.getByText("Drill 20 Flaw questions")).toBeInTheDocument()
    await user.click(screen.getByRole("checkbox", { name: "Drill 20 Flaw questions" }))
    expect(onToggle).toHaveBeenCalledWith("todo-1", true)

    await user.click(screen.getByRole("button", { name: "Add Task" }))

    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveClass("m-auto", "rounded-[16px]")
    expect(dialog.style.bottom).toBe("")
    expect(dialog.style.top).toBe("")
    expect(within(dialog).getByRole("heading", { name: "Add Task" })).toBeInTheDocument()
    expect(within(dialog).queryByText("Link to a session")).not.toBeInTheDocument()
    expect(within(dialog).getByText("Category")).toBeInTheDocument()

    await user.clear(
      within(dialog).getByPlaceholderText("e.g. Drill 10 Parallel Reasoning questions"),
    )
    await user.type(
      within(dialog).getByPlaceholderText("e.g. Drill 10 Parallel Reasoning questions"),
      "Review notes",
    )
    const category = within(dialog).getByPlaceholderText("Homework")
    await user.clear(category)
    await user.type(category, "Session prep")

    await user.click(within(dialog).getByRole("button", { name: "Add Task" }))

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith({
        title: "Review notes",
        tag: "Session prep",
        dueAt: null,
      })
    })
  })

  it("edits an existing task through the Edit Task dialog", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn().mockResolvedValue(undefined)
    render(
      <TodoListSection
        todos={[
          {
            ...todos[0],
            dueAt: "2026-11-20T00:00:00.000Z",
            dueLabel: "Due Nov 20",
          },
        ]}
        sessionId="s1"
        onToggle={vi.fn()}
        onAdd={vi.fn()}
        onEdit={onEdit}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Edit Drill 20 Flaw questions" }))

    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByRole("heading", { name: "Edit Task" })).toBeInTheDocument()
    const titleInput = within(dialog).getByPlaceholderText(
      "e.g. Drill 10 Parallel Reasoning questions",
    )
    expect(titleInput).toHaveValue("Drill 20 Flaw questions")
    expect(within(dialog).getByPlaceholderText("Homework")).toHaveValue("Homework")
    expect(within(dialog).getByDisplayValue("2026-11-20")).toBeInTheDocument()

    await user.clear(titleInput)
    await user.type(titleInput, "Drill 30 Flaw questions")
    await user.click(within(dialog).getByRole("button", { name: "Save Changes" }))

    await waitFor(() => {
      expect(onEdit).toHaveBeenCalledWith("todo-1", {
        title: "Drill 30 Flaw questions",
        tag: "Homework",
        dueAt: "2026-11-20",
      })
    })
  })
})
