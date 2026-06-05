import { useSearchParams } from "react-router-dom"

import { StudentMain } from "@/features/student/components/student-main"
import { SectionConfigForm } from "@/features/student/sections/section-config-form"

function RcNewSectionPage() {
  const [searchParams] = useSearchParams()
  const sectionId = searchParams.get("sectionId")

  return (
    <StudentMain className="max-w-none bg-[color-mix(in_srgb,var(--color-student-accent)_6%,var(--greyscale-25))] py-6 md:py-8">
      <SectionConfigForm sectionType="RC" initialSectionId={sectionId} />
    </StudentMain>
  )
}

export { RcNewSectionPage }
