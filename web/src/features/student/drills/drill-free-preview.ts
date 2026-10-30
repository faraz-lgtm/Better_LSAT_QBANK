import type { TagDrill } from "@/features/student/components/practice-tag-drills-sections"

/** Static Figma `21587:35080` “Drills by Types” preview rows for free users. */
const FREE_DRILL_TYPE_PREVIEW: TagDrill[] = [
  {
    id: "free-preview-causal",
    questionTypeId: "free-preview-causal",
    section: "LR",
    title: "Causal reasoning drill",
    difficultyLabel: "Hardest",
    filledBars: 5,
    difficultyColor: "#df1c41",
    configPath: "/app/practice/drills/lr/new",
  },
  {
    id: "free-preview-critique",
    questionTypeId: "free-preview-critique",
    section: "RC",
    title: "Critique or debate drill",
    difficultyLabel: "Hard",
    filledBars: 4,
    difficultyColor: "red",
    configPath: "/app/practice/drills/rc/new",
  },
  {
    id: "free-preview-comparative",
    questionTypeId: "free-preview-comparative",
    section: "RC",
    title: "Comparative drill",
    difficultyLabel: "Medium",
    filledBars: 3,
    difficultyColor: "#ff6f00",
    configPath: "/app/practice/drills/rc/new",
  },
  {
    id: "free-preview-flaw",
    questionTypeId: "free-preview-flaw",
    section: "LR",
    title: "Flaw or descriptive weakening drill",
    difficultyLabel: "Easy",
    filledBars: 2,
    difficultyColor: "#ffbd4c",
    configPath: "/app/practice/drills/lr/new",
  },
]

export { FREE_DRILL_TYPE_PREVIEW }
