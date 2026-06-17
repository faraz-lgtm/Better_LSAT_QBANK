import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type StudentPageHeaderSlotContextValue = {
  setHeaderActions: (actions: ReactNode) => void
}

const StudentPageHeaderSlotContext = createContext<StudentPageHeaderSlotContextValue | null>(null)

function useStudentPageHeaderSlotState() {
  const [headerActions, setHeaderActions] = useState<ReactNode>(null)
  return { headerActions, setHeaderActions }
}

function StudentPageHeaderSlotProvider({
  children,
  setHeaderActions,
}: {
  children: ReactNode
  setHeaderActions: (actions: ReactNode) => void
}) {
  return (
    <StudentPageHeaderSlotContext.Provider value={{ setHeaderActions }}>
      {children}
    </StudentPageHeaderSlotContext.Provider>
  )
}

function useStudentPageHeaderActions(actions: ReactNode) {
  const ctx = useContext(StudentPageHeaderSlotContext)
  useEffect(() => {
    if (!ctx) return
    ctx.setHeaderActions(actions)
    return () => ctx.setHeaderActions(null)
  }, [actions, ctx])
}

export { StudentPageHeaderSlotProvider, useStudentPageHeaderActions, useStudentPageHeaderSlotState }
