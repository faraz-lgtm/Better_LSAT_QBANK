import { useSearchParams } from "react-router-dom"

import { StudentMain } from "@/features/student/components/student-main"
import { SectionConfigForm } from "@/features/student/sections/section-config-form"

function LrNewSectionPage() {
  const [searchParams] = useSearchParams()
  const sectionId = searchParams.get("sectionId")

  return (
    <StudentMain
      className="max-w-none bg-[var(--background)] py-6 md:py-8"
      contentClassName="bg-[var(--background)]"
    >
      <SectionConfigForm sectionType="LR" initialSectionId={sectionId} />
    </StudentMain>
  )
}

export { LrNewSectionPage }
