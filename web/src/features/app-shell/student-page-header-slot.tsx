import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

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
  const value = useMemo(() => ({ setHeaderActions }), [setHeaderActions])

  return (
    <StudentPageHeaderSlotContext.Provider value={value}>{children}</StudentPageHeaderSlotContext.Provider>
  )
}

function useStudentPageHeaderActions(actions: ReactNode) {
  const setHeaderActions = useContext(StudentPageHeaderSlotContext)?.setHeaderActions
  useEffect(() => {
    if (!setHeaderActions) return
    setHeaderActions(actions)
    return () => setHeaderActions(null)
  }, [actions, setHeaderActions])
}

export {
  StudentPageHeaderSlotProvider,
  useStudentPageHeaderActions,
  useStudentPageHeaderSlotState,
}
