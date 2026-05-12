/* eslint-disable react-refresh/only-export-components */
import type { ComponentType, SVGProps } from "react"
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Eye,
  File,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Flame,
  Folder,
  FolderOpen,
  Home,
  Image,
  KeyRound,
  Laptop,
  Mail,
  Menu,
  Minus,
  MoreVertical,
  Phone,
  PieChartIcon,
  PieChart,
  Plus,
  RectangleHorizontal,
  Search,
  Settings,
  Shield,
  Star,
  Trash2,
  Upload,
  User,
  UserCircle2,
  Users,
  Wallet,
  X,
} from "lucide-react"

type IconProps = SVGProps<SVGSVGElement>
type IconRenderer = ComponentType<IconProps>

function makeStrokeIcon(pathD: string) {
  return function StrokeIcon(props: IconProps) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
        <path d={pathD} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
}

export const GridSquaresIcon = makeStrokeIcon("M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z")
export const SparklesIcon = makeStrokeIcon("M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM18.5 15.5l.8 1.8 1.7.7-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.7zM5.5 16.5l.7 1.5 1.5.6-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.6z")
export const BookmarkRibbonIcon = makeStrokeIcon("M7 4h10a1 1 0 0 1 1 1v15l-6-3-6 3V5a1 1 0 0 1 1-1z")
export const LayersStackIcon = makeStrokeIcon("M12 4 3 9l9 5 9-5-9-5zm-9 9 9 5 9-5M3 17l9 5 9-5")
export const PlayCircleIcon = makeStrokeIcon("M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm-2-13 6 3-6 3z")
export const TargetCrosshairIcon = makeStrokeIcon("M12 3v3m0 12v3M3 12h3m12 0h3M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 5a9 9 0 1 0 0-18 9 9 0 0 0 0 18z")
export const ClockCycleIcon = makeStrokeIcon("M12 6v6l4 2M21 12a9 9 0 1 1-3-6.7")
export const PenSquareIcon = makeStrokeIcon("M5 5h10v4m-8 10h12V9l-4-4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2zm4.5-9.5L15 8l2.5 2.5-3.5 3.5H11v-2.5z")
export const UsersGroupIcon = makeStrokeIcon("M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm8 10v-1.3a4.7 4.7 0 0 0-4.7-4.7H6.8A4.8 4.8 0 0 0 2 20.8V22m18 0v-1a4 4 0 0 0-4-4h-1")
export const FlagGoalIcon = makeStrokeIcon("M6 20V4m0 1h10l-2 3 2 3H6")
export const BoltChargeIcon = makeStrokeIcon("m13 2-7 11h5l-1 9 8-12h-5z")

const fallbackIcon = makeStrokeIcon("M4 12h16M12 4v16")

export const figmaIconNames = [
  "menu-bar-03","menu-bar-02","menu-bar-01","link-broken-02","link-broken-01",
  "link-04","link-03","link-02","link-01","filter-03","filter-02","filter-01",
  "bookmark-minus","bookmark-plus","bookmark-remove","bookmark-check","bookmark",
  "search-08","search-07","search-06","search-05","search-04","search-03","search-02","search-01",
  "resources","home-13","home-12","home-11","home-10","home-09","home-08","home-07","home-06","home-05","home-04","home-03","home-02","home-01",
  "locked-square","heart-square","question-square","dots-square","minus-square","plus-square","block-square","check-square",
  "unlocked-03","locked-03","unlocked-02","locked-02","unlocked-01","locked-01",
  "eye","star","heart","question-mark","dots","minus","plus","block","check",
  "share-square","share-circle","upload-circle-05","upload-circle-04","upload-circle-03","upload-circle-02","upload-circle-01",
  "download-circle-05","download-circle-04","download-circle-03","download-circle-02","download-circle-01",
  "locked-circle","information-circle","eye-circle","star-circle","exclamation-circle","heart-circle","question-circle",
  "dots-circle","minus-circle","plus-circle","block-circle","check-circle",
  "log-out-05","log-out-04","log-out-03","log-out-02","log-out-01",
  "log-in-05","log-in-04","log-in-03","log-in-02","log-in-01",
  "arrow-narrow-down-left","arrow-narrow-down-right","arrow-narrow-up-left","arrow-narrow-up-right",
  "arrow-narrow-left","arrow-narrow-right","arrow-narrow-down","arrow-narrow-up",
  "arrow-circle-down-left","arrow-circle-down-right","arrow-circle-up-left","arrow-circle-up-right",
  "arrow-circle-left","arrow-circle-right","arrow-circle-down","arrow-circle-up",
  "square-bar-chart-04","square-bar-chart-03","square-bar-chart-02","square-bar-chart-01",
  "bar-chart-14","bar-chart-13","bar-chart-12","bar-chart-11",
  "trend-down-01","trend-up-01","line-pie-chart-02","line-pie-chart-01","line-stacked-down","line-stacked-up","line-chart-up-01","line-chart-down-01",
  "phone-voice-02","phone-incoming","phone-outging","phone","message-dots-circle","message-text-square","mail-05","mail-01",
  "notification-text-circle","notification-text-square","bell-05","bell-01","announcement-02","announcement-01","alert-triangle","alert-circle",
  "bank-02","coins-stacked-03","currnecy-dollar-circle","wallet-06","wallet-05","credit-card-01","bank-note-04","bank-note-03",
  "invoice","receipt-04","receipt-02","piggy-bank-01",
  "credit-card-arrow-left","credit-card-arrow-right","credit-card-arrow-down","credit-card-arrow-up",
  "flash","image-03","image-02","camera-01","user-circle","users-03","users-01","user-01",
  "box-archive","folder-open","files-01","file-01","emergency-light-02","key-02","shield-key-hole","shield-02",
  "chevron-left","chevron-right","chevron-down","chevron-up",
  "download-03","download-02","download-01","download-circle","download-04",
  "upload-03","upload-02","upload-01","upload-circle","upload-04",
  "folder-check","folder","chevron-selector-vertical","dots-vertical",
  "file-pdf-02","file-csv-02","file-zip-02","briefcase-01","calendar","trash-05","chrome-cast","image-user","laptop-01",
  "gear","headphone-01","pie-chart-02","pie-chart-01",
] as const

export type FigmaIconName = (typeof figmaIconNames)[number]

const normalizedIconMap: Partial<Record<FigmaIconName, IconRenderer>> = {
  "menu-bar-01": Menu,
  "menu-bar-02": Menu,
  "menu-bar-03": Menu,
  "link-broken-01": X,
  "link-broken-02": X,
  "search-01": Search,
  "search-02": Search,
  "search-03": Search,
  "search-04": Search,
  "search-05": Search,
  "search-06": Search,
  "search-07": Search,
  "search-08": Search,
  "home-01": Home,
  "home-02": Home,
  "home-03": Home,
  "home-04": Home,
  "home-05": Home,
  "home-06": Home,
  "home-07": Home,
  "home-08": Home,
  "home-09": Home,
  "home-10": Home,
  "home-11": Home,
  "home-12": Home,
  "home-13": Home,
  eye: Eye,
  star: Star,
  heart: Star,
  dots: MoreVertical,
  minus: Minus,
  plus: Plus,
  block: X,
  check: Check,
  "check-circle": CheckCircle2,
  "alert-circle": AlertCircle,
  "alert-triangle": AlertTriangle,
  "bell-01": Bell,
  "bell-05": Bell,
  calendar: Calendar,
  "mail-01": Mail,
  "mail-05": Mail,
  phone: Phone,
  "download-01": Download,
  "download-02": Download,
  "download-03": Download,
  "download-04": Download,
  "upload-01": Upload,
  "upload-02": Upload,
  "upload-03": Upload,
  "upload-04": Upload,
  "file-01": File,
  "files-01": FileText,
  "file-pdf-02": FileText,
  "file-csv-02": FileSpreadsheet,
  "file-zip-02": FileArchive,
  folder: Folder,
  "folder-open": FolderOpen,
  "folder-check": FolderOpen,
  "user-01": User,
  "user-circle": UserCircle2,
  "users-01": Users,
  "users-03": Users,
  "image-02": Image,
  "image-03": Image,
  "laptop-01": Laptop,
  gear: Settings,
  "pie-chart-01": PieChart,
  "pie-chart-02": PieChart,
  "trash-05": Trash2,
  "wallet-05": Wallet,
  "wallet-06": Wallet,
  "key-02": KeyRound,
  "shield-02": Shield,
  "shield-key-hole": Shield,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-down": ChevronDown,
  "chevron-up": ChevronUp,
  "chevron-selector-vertical": ChevronDown,
  flash: Flame,
  resources: BookOpenIcon,
  "bookmark": BookmarkRibbonIcon,
  "bookmark-check": BookmarkRibbonIcon,
  "bookmark-plus": BookmarkRibbonIcon,
  "bookmark-minus": BookmarkRibbonIcon,
  "bookmark-remove": BookmarkRibbonIcon,
  "filter-01": GridSquaresIcon,
  "filter-02": GridSquaresIcon,
  "filter-03": GridSquaresIcon,
  "download-circle": Download,
  "upload-circle": Upload,
  "question-circle": AlertCircle,
  "question-mark": AlertCircle,
  "locked-circle": Shield,
  "locked-01": Shield,
  "locked-02": Shield,
  "locked-03": Shield,
  "unlocked-01": Shield,
  "unlocked-02": Shield,
  "unlocked-03": Shield,
  "arrow-circle-up": ChevronUp,
  "arrow-circle-down": ChevronDown,
  "arrow-circle-left": ChevronLeft,
  "arrow-circle-right": ChevronRight,
  "arrow-narrow-up": ChevronUp,
  "arrow-narrow-down": ChevronDown,
  "arrow-narrow-left": ChevronLeft,
  "arrow-narrow-right": ChevronRight,
  "announcement-01": Bell,
  "announcement-02": Bell,
  "currnecy-dollar-circle": Wallet,
  "bank-02": Wallet,
  "bank-note-03": Wallet,
  "bank-note-04": Wallet,
  "coins-stacked-03": Wallet,
  "credit-card-01": Wallet,
  "invoice": FileText,
  "receipt-02": FileText,
  "receipt-04": FileText,
  "piggy-bank-01": Wallet,
  "box-archive": FileArchive,
}

function BookOpenIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5zM20 5.5A2.5 2.5 0 0 0 17.5 3H12v16h5.5a2.5 2.5 0 0 1 2.5 2.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const mappedIconNameSet = new Set<FigmaIconName>(Object.keys(normalizedIconMap) as FigmaIconName[])

function resolveByPattern(name: FigmaIconName): IconRenderer {
  if (mappedIconNameSet.has(name)) return normalizedIconMap[name]!

  if (name.includes("arrow")) return ChevronRight
  if (name.includes("chevron")) return ChevronDown
  if (name.includes("download")) return Download
  if (name.includes("upload")) return Upload
  if (name.includes("search")) return Search
  if (name.includes("bookmark")) return BookmarkRibbonIcon
  if (name.includes("bell") || name.includes("notification") || name.includes("announcement")) return Bell
  if (name.includes("alert") || name.includes("information") || name.includes("question")) return AlertCircle
  if (name.includes("mail") || name.includes("message")) return Mail
  if (name.includes("phone")) return Phone
  if (name.includes("wallet") || name.includes("bank") || name.includes("credit-card") || name.includes("coins")) return Wallet
  if (name.includes("file") || name.includes("invoice") || name.includes("receipt")) return FileText
  if (name.includes("folder")) return Folder
  if (name.includes("image") || name.includes("camera")) return Image
  if (name.includes("user")) return User
  if (name.includes("users")) return Users
  if (name.includes("shield") || name.includes("lock") || name.includes("key")) return Shield
  if (name.includes("chart") || name.includes("trend")) return PieChart
  if (name.includes("calendar")) return Calendar
  if (name.includes("trash")) return Trash2
  if (name.includes("gear")) return Settings
  if (name.includes("menu")) return Menu
  if (name.includes("home")) return Home
  if (name.includes("check")) return CheckCircle2
  if (name.includes("plus")) return Plus
  if (name.includes("minus")) return Minus
  if (name.includes("dots")) return MoreVertical
  if (name.includes("star")) return Star
  if (name.includes("heart")) return Star
  if (name.includes("flash")) return Flame
  if (name.includes("pie")) return PieChartIcon
  if (name.includes("bar")) return RectangleHorizontal

  return fallbackIcon
}

export const figmaIconRegistry: Record<FigmaIconName, IconRenderer> = Object.fromEntries(
  figmaIconNames.map((name) => [name, resolveByPattern(name)]),
) as Record<FigmaIconName, IconRenderer>

export function FigmaIcon({ name, ...props }: { name: FigmaIconName } & IconProps) {
  const Icon = figmaIconRegistry[name] ?? fallbackIcon
  return <Icon {...props} />
}
