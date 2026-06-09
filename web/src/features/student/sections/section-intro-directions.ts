import type { SectionType } from "@/features/student/sections/section-types"

const LR_DIRECTIONS = `Each question in this section is based on the reasoning presented in a brief passage. In answering the questions, you should not make assumptions that are by commonsense standards implausible, superfluous, or incompatible with the passage. For some questions, more than one of the choices could conceivably answer the question. However, you are to choose the best answer, that is, choose the response that most accurately and completely answers the question.`

const RC_DIRECTIONS = `Each passage in this section is followed by a group of questions. Read each passage carefully and answer the questions that follow. The questions are to be answered on the basis of what is stated or implied in the passage.`

export function sectionIntroDirections(sectionType: SectionType): string {
  return sectionType === "RC" ? RC_DIRECTIONS : LR_DIRECTIONS
}

export function sectionIntroTitle(sectionNumber: number | null, sectionType: SectionType): string {
  if (sectionNumber != null) return `Section ${sectionNumber}`
  return sectionType === "RC" ? "Reading Comprehension" : "Logical Reasoning"
}

export function formatSectionTimeMinutes(minutes: number): string {
  return `${minutes} minute${minutes === 1 ? "" : "s"}`
}
