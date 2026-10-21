'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { renderNotification } from '@/entities/notification'
import { Button } from '@/shared/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu'
import { Icon } from '@/shared/ui/icon'
import { LocalTime } from '@/shared/ui/local-time'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'
import { fetchInbox, markReadAction, type Inbox } from '../server/actions'

const POLL_MS = 60_000

/** Header bell: unread count, latest notifications, mark read; refreshes every minute. */
export function NotificationBell({ initial }: { initial: Inbox }) {
  const t = useT()
  const router = useRouter()
  const [inbox, setInbox] = useState(initial)
  const [, start] = useTransition()

  useEffect(() => setInbox(initial), [initial])
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchInbox().then(setInbox, () => {})
    }, POLL_MS)
    return () => clearInterval(id)
  }, [])

  const open = (id: number, link: string | null) =>
    start(async () => {
      setInbox(await markReadAction(id))
      if (link) router.push(link)
    })

  return (
    <DropdownMenu onOpenChange={(o) => o && fetchInbox().then(setInbox, () => {})}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t.notifications}>
          <Icon name="bell" />
          {inbox.unread > 0 && (
            <span className="absolute -top-0.5 -end-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
              {inbox.unread > 9 ? '9+' : inbox.unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
        <div className="flex items-center justify-between gap-2 pe-1">
          <DropdownMenuLabel>{t.notify.title}</DropdownMenuLabel>
          {inbox.unread > 0 && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => start(async () => setInbox(await markReadAction()))}>
              {t.notify.markAllRead}
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {inbox.items.length === 0 && <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t.notify.empty}</p>}
          {inbox.items.map((n) => {
            const { title, body } = renderNotification(t, n.kind, n.params)
            return (
              <DropdownMenuItem key={n.id} className="items-start gap-3 py-2.5" onSelect={() => open(n.id, n.link)}>
                <span className={cn('mt-1.5 size-2 flex-none rounded-full', n.read ? 'bg-transparent' : 'bg-primary')} />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className={cn('text-sm', !n.read && 'font-medium')}>{title}</span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">{body}</span>
                  <LocalTime seconds={n.createdAt} className="text-[11px] text-muted-foreground" />
                </span>
              </DropdownMenuItem>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
