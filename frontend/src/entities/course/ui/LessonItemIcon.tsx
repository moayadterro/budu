import { Icon, type IconName } from '@/shared/ui/icon'
import { cn } from '@/shared/lib/cn'
import type { LessonItemKind } from '../model/types'

const look: Record<LessonItemKind | 'pdf', { icon: IconName; className: string }> = {
  video: { icon: 'video', className: 'bg-primary/10 text-primary' },
  pdf: { icon: 'file', className: 'bg-destructive/10 text-destructive' },
  file: { icon: 'doc', className: 'bg-info/10 text-info' },
  text: { icon: 'text', className: 'bg-success/10 text-success' },
  task: { icon: 'task', className: 'bg-warning/10 text-warning' },
}

/** Square icon for a lesson item: video, PDF, other file, text page, or task. */
export function LessonItemIcon({ kind, mime, className }: { kind: LessonItemKind; mime?: string; className?: string }) {
  const l = look[kind === 'file' && mime === 'application/pdf' ? 'pdf' : kind]
  return (
    <span className={cn('grid size-9 flex-none place-items-center rounded-md', l.className, className)}>
      <Icon name={l.icon} className="size-4" />
    </span>
  )
}
