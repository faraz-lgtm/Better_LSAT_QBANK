import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import type { StudentBreadcrumb } from "@/features/app-shell/student-nav-config"

type StudentPageHeaderSlotContextValue = {
  setHeaderActions: (actions: ReactNode) => void
  setBreadcrumbTail: (tail: StudentBreadcrumb[]) => void
}

const StudentPageHeaderSlotContext = createContext<StudentPageHeaderSlotContextValue | null>(null)

function useStudentPageHeaderSlotState() {
  const [headerActions, setHeaderActions] = useState<ReactNode>(null)
  const [breadcrumbTail, setBreadcrumbTail] = useState<StudentBreadcrumb[]>([])
  return { headerActions, setHeaderActions, breadcrumbTail, setBreadcrumbTail }
}

function StudentPageHeaderSlotProvider({
  children,
  setHeaderActions,
  setBreadcrumbTail,
}: {
  children: ReactNode
  setHeaderActions: (actions: ReactNode) => void
  setBreadcrumbTail: (tail: StudentBreadcrumb[]) => void
}) {
  const value = useMemo(
    () => ({ setHeaderActions, setBreadcrumbTail }),
    [setHeaderActions, setBreadcrumbTail],
  )

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

function useStudentPageBreadcrumbTail(label: string | null) {
  const setBreadcrumbTail = useContext(StudentPageHeaderSlotContext)?.setBreadcrumbTail
  useEffect(() => {
    if (!setBreadcrumbTail) return
    setBreadcrumbTail(label ? [{ label }] : [])
    return () => setBreadcrumbTail([])
  }, [label, setBreadcrumbTail])
}

export {
  StudentPageHeaderSlotProvider,
  useStudentPageBreadcrumbTail,
  useStudentPageHeaderActions,
  useStudentPageHeaderSlotState,
}
