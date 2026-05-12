import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentType, SVGProps } from "react"
import {
  AlertCircle,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Filter,
  Home,
  Search,
  Settings,
  Shield,
  User,
} from "lucide-react"
import {
  BoltChargeIcon,
  BookmarkRibbonIcon,
  ClockCycleIcon,
  FlagGoalIcon,
  GridSquaresIcon,
  LayersStackIcon,
  PenSquareIcon,
  PlayCircleIcon,
  SparklesIcon,
  TargetCrosshairIcon,
  UsersGroupIcon,
} from "./figma-icons"

export const iconVariants = cva("shrink-0", {
  variants: {
    size: {
      xs: "size-4",
      sm: "size-5",
      md: "size-6",
      lg: "size-8",
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary",
      success: "text-emerald-600",
      warning: "text-amber-600",
      destructive: "text-destructive",
    },
  },
  defaultVariants: {
    size: "md",
    tone: "default",
  },
})

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

export const iconRegistry = {
  home: Home,
  search: Search,
  settings: Settings,
  user: User,
  book: BookOpen,
  calendar: Calendar,
  bell: Bell,
  filter: Filter,
  download: Download,
  file: FileText,
  status: AlertCircle,
  check: CheckCircle2,
  nav: ChevronRight,
  secure: Shield,
  grid: GridSquaresIcon,
  sparkle: SparklesIcon,
  bookmark: BookmarkRibbonIcon,
  layers: LayersStackIcon,
  play: PlayCircleIcon,
  target: TargetCrosshairIcon,
  cycle: ClockCycleIcon,
  edit: PenSquareIcon,
  users: UsersGroupIcon,
  flag: FlagGoalIcon,
  charge: BoltChargeIcon,
} satisfies Record<string, IconComponent>

export type IconName = keyof typeof iconRegistry
export type IconVariantProps = VariantProps<typeof iconVariants>
