import { ReactNode } from 'react'
import { Icon, IconName } from '@/shared/ui/icon'
import { cn } from '@/shared/lib/cn'

type Tone = 'urgent' | 'done' | 'neutral'
const tones: Record<Tone, string> = {
  urgent: 'bg-warning/10 text-warning',
  done: 'bg-success/10 text-success',
  neutral: 'bg-muted text-muted-foreground',
}

/** One homework item; `end` holds a due date, badge or action. */
export function HomeworkRow({
  title,
  meta,
  tone = 'neutral',
  icon = 'alert',
  end,
}: {
  title: string
  meta: string
  tone?: Tone
  icon?: IconName
  end?: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className={cn('grid size-9 flex-none place-items-center rounded-md', tones[tone])}>
        <Icon name={icon} className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <b className="block truncate text-sm font-medium">{title}</b>
        <span className="text-xs text-muted-foreground">{meta}</span>
      </div>
      {end}
    </div>
  )
}
