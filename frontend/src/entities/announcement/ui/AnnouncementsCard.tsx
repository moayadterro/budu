'use client'

import type { ReactNode } from 'react'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { LocalTime } from '@/shared/ui/local-time'
import { useT } from '@/shared/i18n'
import type { Announcement } from '../model/types'

/**
 * School announcements, newest first. `action` = header slot (e.g. the manager's "New announcement"),
 * `itemActions` = a slot per announcement id (e.g. delete). Hidden when empty unless `showEmpty`.
 */
export function AnnouncementsCard({
  items,
  action,
  itemActions,
  showSchool = false,
  showEmpty = false,
  sub,
}: {
  items: Announcement[]
  action?: ReactNode
  itemActions?: Record<number, ReactNode>
  /** name the school on each item (parents with children in several schools) */
  showSchool?: boolean
  showEmpty?: boolean
  sub?: string
}) {
  const t = useT()
  if (!items.length && !showEmpty && !action) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.announcements.title}</CardTitle>
        {sub && <CardDescription>{sub}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {items.length === 0 && <p className="text-sm text-muted-foreground">{t.announcements.empty}</p>}
        {items.map((a) => (
          <article key={a.id} className="flex items-start gap-3">
            <span className="grid size-9 flex-none place-items-center rounded-md bg-primary/10 text-primary">
              <Icon name="megaphone" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium">{a.title}</h3>
              {a.body && <p className="mt-0.5 text-sm whitespace-pre-line text-muted-foreground">{a.body}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {showSchool && a.school && `${a.school} · `}
                <LocalTime seconds={a.createdAt} /> · {t.announcements.by(a.authorName)}
              </p>
            </div>
            {itemActions?.[a.id]}
          </article>
        ))}
      </CardContent>
    </Card>
  )
}
