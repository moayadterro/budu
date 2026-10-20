import { Icon } from '@/shared/ui/icon'
import { SUBJECTS, SubjectKey } from '@/shared/mock'
import { cn } from '@/shared/lib/cn'

/** The subject's coloured icon tile. */
export function SubjectTile({ subject, className }: { subject: SubjectKey; className?: string }) {
  const s = SUBJECTS[subject]
  return (
    <span className={cn('grid flex-none place-items-center rounded-xl text-primary-foreground', className)} style={{ background: s.color }}>
      <Icon name={s.icon} className="h-1/2 w-1/2" strokeWidth={1.7} />
    </span>
  )
}
