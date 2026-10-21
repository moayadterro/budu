'use client'

import type { ReactNode } from 'react'
import { Badge } from '@/shared/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { LocalTime } from '@/shared/ui/local-time'
import { useT } from '@/shared/i18n'
import type { Announcement } from '../model/types'

/**
 * Announcements (whole school, one class, one course), newest first; class / course ones carry a
 * badge. `action` = header slot (e.g. the manager's "New announcement"),
 * `itemActions` = a slot per announcement id (e.g. delete). Hidden when empty unless `showEmpty`.
 * `groupBySchool`: one section per school, headed by its name (people in several schools).
 */
export function AnnouncementsCard({
  items,
  action,
  itemActions,
  showSchool = false,
  showEmpty = false,
  groupBySchool = false,
  sub,
}: {
  items: Announcement[]
  action?: ReactNode
  itemActions?: Record<number, ReactNode>
  /** name the school on each item (parents with children in several schools) */
  showSchool?: boolean
  showEmpty?: boolean
  groupBySchool?: boolean
  sub?: string
}) {
  const t = useT()
  if (!items.length && !showEmpty && !action) return null
  // schools in order of their newest announcement (items come newest first)
  const bySchool = new Map<number, Announcement[]>()
  for (const a of items) bySchool.set(a.companyId, [...(bySchool.get(a.companyId) ?? []), a])
  const groups = [...bySchool.values()]
  const row = (a: Announcement) => (
    <article key={a.id} className="flex items-start gap-3">
      <span className="grid size-9 flex-none place-items-center rounded-md bg-primary/10 text-primary">
        <Icon name="megaphone" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium">
          {a.title}
          {a.audience !== 'school' && a.targetName && (
            // only for one class / one course
            <Badge variant="secondary" className="ms-2 align-middle font-normal">
              <Icon name={a.audience === 'class' ? 'layers' : 'book'} />
              {a.targetName}
            </Badge>
          )}
        </h3>
        {a.body && <p className="mt-0.5 text-sm whitespace-pre-line text-muted-foreground">{a.body}</p>}
        <p className="mt-1 text-xs text-muted-foreground">
          {showSchool && !groupBySchool && a.school && `${a.school} · `}
          <LocalTime seconds={a.createdAt} /> · {t.announcements.by(a.authorName)}
        </p>
      </div>
      {itemActions?.[a.id]}
    </article>
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.announcements.title}</CardTitle>
        {sub && <CardDescription>{sub}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {items.length === 0 && <p className="text-sm text-muted-foreground">{t.announcements.empty}</p>}
        {groupBySchool
          ? groups.map((g) => (
              <section key={g[0].companyId} className="flex flex-col gap-3 not-first:border-t not-first:pt-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <Icon name="layers" className="size-3.5" />
                  {g[0].school}
                </h3>
                {g.map(row)}
              </section>
            ))
          : items.map(row)}
      </CardContent>
    </Card>
  )
}
