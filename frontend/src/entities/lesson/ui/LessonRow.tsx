'use client'

import { Badge } from '@/shared/ui/badge'
import { Icon, PlayIcon } from '@/shared/ui/icon'
import type { LessonState } from '@/shared/mock'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'

/** One lesson in a class's lesson list. */
export function LessonRow({ title, meta, state }: { title: string; meta: string; state: LessonState }) {
  const t = useT()
  const live = state === 'live'
  return (
    <div className="flex items-center gap-3 py-3">
      <span
        className={cn(
          'grid size-9 flex-none place-items-center rounded-md',
          live ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
        )}
      >
        {live ? <Icon name="video" className="h-[17px] w-[17px]" strokeWidth={2} /> : <PlayIcon className="h-[17px] w-[17px]" />}
      </span>
      <div className="min-w-0 flex-1">
        <b className="block truncate text-sm font-medium">{title}</b>
        <span className="text-xs text-muted-foreground">{meta}</span>
      </div>
      {state === 'done' && <Badge variant="success">{t.hub.done}</Badge>}
      {state === 'progress' && <Badge>{t.hub.resume}</Badge>}
      {live && (
        <Badge variant="live">
          <span className="dot-live bg-destructive text-destructive" />
          {t.hub.soon}
        </Badge>
      )}
    </div>
  )
}
