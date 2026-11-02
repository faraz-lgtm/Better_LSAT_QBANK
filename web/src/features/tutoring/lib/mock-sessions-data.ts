import type { TutoringPackage, TutoringSessionsViewModel } from "@/features/tutoring/lib/types"

export const TUTORING_PACKAGES: TutoringPackage[] = [
  {
    id: "single",
    name: "Single Session",
    price: "$149",
    compareAtPrice: "$200",
    description: "For one specific section, problem area, or practice test review.",
    features: ["1 private session", "No long-term commitment", "Target one immediate problem"],
  },
  {
    id: "pack-5",
    name: "5-Session Pack",
    price: "$699",
    compareAtPrice: "$749",
    saveLabel: "Save $50",
    description: "For students who want structure, regular feedback, and a clear plan.",
    features: ["5 private sessions", "Regular check-ins", "Great for shorter prep timelines"],
    popular: true,
  },
  {
    id: "pack-10",
    name: "10-Session Pack",
    price: "$1,349",
    compareAtPrice: "$1,499",
    saveLabel: "Save $150",
    description: "For deeper support across weak areas, strategy, and timing.",
    features: ["10 private sessions", "Broader skill support", "More time to adjust and improve"],
  },
  {
    id: "pack-20",
    name: "20-Session Pack",
    price: "$2,699",
    compareAtPrice: "$2,999",
    saveLabel: "Save $300",
    description: "For students who want ongoing coaching and a more hands-on prep plan.",
    features: [
      "20 private sessions",
      "Weak-area targeting",
      "Full practice test guidance",
      "Ongoing progress support",
    ],
  },
]

/** UI mock — replace with tutoring API when backend lands. */
export const MOCK_TUTORING_SESSIONS: TutoringSessionsViewModel = {
  hasActivePackage: true,
  nextSession: {
    id: "upcoming-1",
    month: "NOV",
    day: "5",
    title: "Logical Reasoning — Flaw & Assumption",
    whenLabel: "Thu, Nov 5 · 6:00 PM ET · 60 min",
    tutorName: "Maya Chen",
    tutorInitials: "MC",
    focus: "Logical Reasoning — Flaw & Assumption",
    action: "join",
  },
  activePackage: {
    name: "5-Session Pack",
    purchasedLabel: "Purchased Oct 29, 2026 · Never expires",
    slots: ["completed", "scheduled", "scheduled", "scheduled", "unscheduled"],
    completed: 1,
    scheduled: 3,
    notScheduled: 1,
  },
  pastSessions: [
    {
      id: "past-1",
      dateLabel: "Oct 29",
      tutorName: "Maya Chen",
      focus: "LR — Necessary Assumption",
    },
    {
      id: "past-2",
      dateLabel: "Oct 22",
      tutorName: "Daniel Okafor",
      focus: "RC — Comparative Passages",
    },
    {
      id: "past-3",
      dateLabel: "Oct 15",
      tutorName: "Maya Chen",
      focus: "Diagnostic Review",
    },
  ],
  transcript: {
    sessionId: "past-1",
    title: "LR — Necessary Assumption",
    metaLabel: "Oct 29 · 58 min · with Maya Chen",
    takeaways: [
      "Use the negation test on every Necessary Assumption question.",
      "Don't confuse sufficient (too strong) with necessary assumptions.",
      "Homework: drill 20 Flaw questions before Nov 5.",
    ],
    currentTime: "02:10",
    totalTime: "58:00",
    segments: [
      { id: "seg-1", time: "02:10", label: "Warm-up" },
      { id: "seg-2", time: "15:30", label: "Negation test" },
      { id: "seg-3", time: "38:00", label: "Sufficient vs necessary" },
      { id: "seg-4", time: "52:20", label: "Homework" },
    ],
    lines: [
      {
        id: "line-1",
        speaker: "tutor",
        name: "Maya Chen",
        initials: "MC",
        time: "00:00",
        text: "Let's start with the two Necessary Assumption questions you flagged from your last drill.",
      },
      {
        id: "line-2",
        speaker: "student",
        name: "You",
        initials: "You",
        time: "00:42",
        text: "I keep picking answers that would make the argument stronger, but they're marked wrong.",
      },
      {
        id: "line-3",
        speaker: "tutor",
        name: "Maya Chen",
        initials: "MC",
        time: "01:15",
        text: "That's the classic trap. A necessary assumption doesn't have to strengthen much. It just has to be required. Try the negation test.",
      },
      {
        id: "line-4",
        speaker: "student",
        name: "You",
        initials: "You",
        time: "02:03",
        text: "So I negate the answer, and if the argument falls apart, that's the one?",
      },
      {
        id: "line-5",
        speaker: "tutor",
        name: "Maya Chen",
        initials: "MC",
        time: "02:20",
        text: "Exactly. Let's try it on question 14. Negate choice C out loud.",
      },
      {
        id: "line-6",
        speaker: "student",
        name: "You",
        initials: "You",
        time: "03:48",
        text: "If the study didn't control for age… then the conclusion doesn't follow. So C is right.",
      },
      {
        id: "line-7",
        speaker: "tutor",
        name: "Maya Chen",
        initials: "MC",
        time: "04:10",
        text: "Right. Notice that B was a sufficient assumption. It's too strong to be required.",
      },
      {
        id: "line-8",
        speaker: "tutor",
        name: "Maya Chen",
        initials: "MC",
        time: "05:32",
        text: "For homework, drill 20 Flaw questions and use the negation test on any assumption question you see.",
      },
    ],
  },
  todos: [
    {
      id: "todo-1",
      title: "Review the questions you missed on your last PrepTest",
      createdLabel: "Created Oct 29, 6:05 PM",
      dueLabel: "Due Nov 4 · From Maya Chen",
      tag: "Homework",
      done: false,
    },
    {
      id: "todo-2",
      title: "Drill 20 Flaw questions",
      createdLabel: "Created Oct 29, 6:05 PM",
      dueLabel: "Due Nov 4 · From Maya Chen",
      tag: "Homework",
      done: false,
    },
    {
      id: "todo-3",
      title: "Write down questions for Thursday's session",
      createdLabel: "Created Oct 30, 9:20 AM",
      dueLabel: "Before Nov 5",
      tag: "Session prep",
      done: false,
    },
    {
      id: "todo-4",
      title: "Re-read your Oct 29 session notes",
      createdLabel: "Created Oct 29, 7:10 PM",
      dueLabel: "Anytime",
      tag: "Review",
      done: false,
    },
    {
      id: "todo-5",
      title: "Book your 5 sessions",
      createdLabel: "Created Oct 29, 12:40 PM",
      dueLabel: "Completed Oct 29",
      tag: "Setup",
      done: true,
    },
  ],
  upcomingSessions: [
    {
      id: "upcoming-1",
      month: "NOV",
      day: "5",
      title: "Logical Reasoning — Flaw & Assumption",
      whenLabel: "Thu, Nov 5 · 6:00 PM ET · with Maya Chen",
      tutorName: "Maya Chen",
      tutorInitials: "MC",
      focus: "Logical Reasoning — Flaw & Assumption",
      action: "join",
    },
    {
      id: "upcoming-2",
      month: "NOV",
      day: "12",
      title: "Logical Reasoning — Strengthen & Weaken",
      whenLabel: "Thu, Nov 12 · 6:00 PM ET · with Maya Chen",
      tutorName: "Maya Chen",
      tutorInitials: "MC",
      focus: "Logical Reasoning — Strengthen & Weaken",
      action: "reschedule",
    },
    {
      id: "upcoming-3",
      month: "NOV",
      day: "18",
      title: "Reading Comprehension — Comparative Passages",
      whenLabel: "Wed, Nov 18 · 7:00 PM ET · with Daniel Okafor",
      tutorName: "Daniel Okafor",
      tutorInitials: "DO",
      focus: "Reading Comprehension — Comparative Passages",
      action: "reschedule",
    },
  ],
  packages: TUTORING_PACKAGES,
  testimonials: [
    {
      id: "t1",
      name: "Maggie Watt",
      quote: "I felt like I got my money's worth and focused on what mattered most.",
    },
    {
      id: "t2",
      name: "Lexi Meador",
      quote: "Talking through my thinking helped me see exactly where I was going wrong.",
    },
    {
      id: "t3",
      name: "Samantha Espiridion",
      quote: "I finally found an LSAT platform that worked for me and helped me make real progress.",
    },
  ],
}

export function getTutoringSessionsView(hasActivePackage = false): TutoringSessionsViewModel {
  if (hasActivePackage) return { ...MOCK_TUTORING_SESSIONS, hasActivePackage: true }
  return {
    ...MOCK_TUTORING_SESSIONS,
    hasActivePackage: false,
    nextSession: null,
    activePackage: null,
    pastSessions: [],
    transcript: null,
    todos: [],
    upcomingSessions: [],
  }
}

export function getSessionTranscriptById(sessionId: string) {
  const transcript = MOCK_TUTORING_SESSIONS.transcript
  if (!transcript || transcript.sessionId !== sessionId) return null
  return transcript
}
