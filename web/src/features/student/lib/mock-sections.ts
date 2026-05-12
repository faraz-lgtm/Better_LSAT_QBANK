export type SectionModeCard = {
  id: string
  title: string
  subtitle: string
  section: "LR" | "RC"
  questionCount: number
  timeMinutes: number
}

export const mockSectionModeCards: SectionModeCard[] = [
  {
    id: "lr-timed",
    title: "Logical Reasoning",
    subtitle: "Timed section from your practice pool",
    section: "LR",
    questionCount: 25,
    timeMinutes: 35,
  },
  {
    id: "rc-timed",
    title: "Reading Comprehension",
    subtitle: "Timed section from your practice pool",
    section: "RC",
    questionCount: 27,
    timeMinutes: 35,
  },
]
