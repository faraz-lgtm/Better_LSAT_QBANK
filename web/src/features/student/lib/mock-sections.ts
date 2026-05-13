export type SectionModeCard = {
  id: string
  title: string
  subtitle: string
  section: "LR" | "RC"
  ctaLabel: "New Drill" | "Start Drill"
}

export const mockSectionModeCards: SectionModeCard[] = [
  {
    id: "lr-timed",
    title: "Logical Reasoning",
    subtitle: "16-20 Questions",
    section: "LR",
    ctaLabel: "New Drill",
  },
  {
    id: "rc-timed",
    title: "Reading Comprehension",
    subtitle: "4 Passages",
    section: "RC",
    ctaLabel: "Start Drill",
  },
]
