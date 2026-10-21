import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Alert02Icon,
  Analytics01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  Atom01Icon,
  Book02Icon,
  Calculator01Icon,
  Calendar03Icon,
  CallEnd01Icon,
  Camera01Icon,
  CheckmarkCircle02Icon,
  ComputerIcon,
  ComputerScreenShareIcon,
  DashboardSquare01Icon,
  Delete02Icon,
  Doc01Icon,
  Download01Icon,
  File01Icon,
  HandIcon,
  Layers01Icon,
  LinkSquare02Icon,
  Megaphone01Icon,
  Message01Icon,
  Mic01Icon,
  MicOff01Icon,
  Moon02Icon,
  Notification01Icon,
  PencilEdit02Icon,
  PenTool03Icon,
  PlayIcon as HugePlayIcon,
  RecordIcon,
  Search01Icon,
  SentIcon,
  Settings01Icon,
  SparklesIcon,
  StarIcon as HugeStarIcon,
  Store01Icon,
  Sun03Icon,
  TaskDone01Icon,
  TextFontIcon,
  Tick02Icon,
  TranslateIcon,
  Upload01Icon,
  UserAdd01Icon,
  UserMultipleIcon,
  Video01Icon,
  Video02Icon,
  ViewIcon,
  ViewOffIcon,
  Copy01Icon,
  Heading02Icon,
  Heading03Icon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  Link01Icon,
  Note01Icon,
  QuoteDownIcon,
  RedoIcon,
  ShoppingCart01Icon,
  TextBoldIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  UndoIcon,
  Wallet01Icon,
  Cancel01Icon,
  Clock01Icon,
} from '@hugeicons/core-free-icons'

/** App icon names → Hugeicons (free set). One place to swap an icon everywhere. */
const icons = {
  grid: DashboardSquare01Icon,
  cal: Calendar03Icon,
  book: Book02Icon,
  search: Search01Icon,
  video: Video01Icon,
  check: CheckmarkCircle02Icon,
  layers: Layers01Icon,
  users: UserMultipleIcon,
  report: Analytics01Icon,
  gear: Settings01Icon,
  store: Store01Icon,
  bell: Notification01Icon,
  sun: Sun03Icon,
  alert: Alert02Icon,
  back: ArrowLeft01Icon,
  tick: Tick02Icon,
  file: File01Icon,
  doc: Doc01Icon,
  download: Download01Icon,
  upload: Upload01Icon,
  camera: Camera01Icon,
  moon: Moon02Icon,
  monitor: ComputerIcon,
  mic: Mic01Icon,
  micOff: MicOff01Icon,
  cam: Video02Icon,
  share: ComputerScreenShareIcon,
  board: PenTool03Icon,
  hand: HandIcon,
  send: SentIcon,
  spark: SparklesIcon,
  eye: ViewIcon,
  eyeOff: ViewOffIcon,
  chevRight: ArrowRight01Icon,
  plus: Add01Icon,
  clock: Clock01Icon,
  close: Cancel01Icon,
  text: Note01Icon,
  bold: TextBoldIcon,
  italic: TextItalicIcon,
  strike: TextStrikethroughIcon,
  h2: Heading02Icon,
  h3: Heading03Icon,
  listBullet: LeftToRightListBulletIcon,
  listNumber: LeftToRightListNumberIcon,
  quote: QuoteDownIcon,
  link: Link01Icon,
  undo: UndoIcon,
  redo: RedoIcon,
  cart: ShoppingCart01Icon,
  copy: Copy01Icon,
  wallet: Wallet01Icon,
  chat: Message01Icon,
  megaphone: Megaphone01Icon,
  userAdd: UserAdd01Icon,
  trash: Delete02Icon,
  pencil: PencilEdit02Icon,
  up: ArrowUp01Icon,
  down: ArrowDown01Icon,
  task: TaskDone01Icon,
  external: LinkSquare02Icon,
  // subjects
  calc: Calculator01Icon,
  atom: Atom01Icon,
  lang: TranslateIcon,
  arabic: TextFontIcon,
}

export type IconName = keyof typeof icons

type IconProps = { name: IconName; className?: string; strokeWidth?: number }

/** <Icon name="book" className="size-4" /> — size it with className (defaults to 1em·ish 16px). */
export function Icon({ name, className, strokeWidth = 1.8 }: IconProps) {
  return <HugeiconsIcon icon={icons[name]} strokeWidth={strokeWidth} className={className ?? 'size-4'} aria-hidden />
}

type SimpleIconProps = { className?: string }
export const StarIcon = ({ className }: SimpleIconProps) => <HugeiconsIcon icon={HugeStarIcon} className={className} aria-hidden />
export const RecIcon = ({ className }: SimpleIconProps) => <HugeiconsIcon icon={RecordIcon} className={className} aria-hidden />
export const HangUpIcon = ({ className }: SimpleIconProps) => <HugeiconsIcon icon={CallEnd01Icon} className={className} aria-hidden />
export const PlayIcon = ({ className }: SimpleIconProps) => <HugeiconsIcon icon={HugePlayIcon} className={className} aria-hidden />

/** Budu brand mark (graduation cap on the brand gradient). */
export function BrandMark({ className }: SimpleIconProps) {
  return (
    <span className={className ?? 'grid size-8 flex-none place-items-center rounded-lg bg-brand text-primary-foreground'}>
      <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
        <path d="M12 3 3 8l9 5 9-5-9-5Z" fill="currentColor" />
        <path d="M7 11v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  )
}
