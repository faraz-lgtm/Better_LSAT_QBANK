import { useSearchParams } from "react-router-dom"

import { StudentMain } from "@/features/student/components/student-main"
import { SectionConfigForm } from "@/features/student/sections/section-config-form"

function RcNewSectionPage() {
  const [searchParams] = useSearchParams()
  const sectionId = searchParams.get("sectionId")

  return (
    <StudentMain
      className="max-w-none bg-[#f3f7ff] py-6 md:py-8"
      contentClassName="bg-[#f3f7ff]"
    >
      <SectionConfigForm sectionType="RC" initialSectionId={sectionId} />
    </StudentMain>
  )
}

export { RcNewSectionPage }
