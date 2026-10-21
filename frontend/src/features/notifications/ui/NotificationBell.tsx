'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { notificationLook, renderNotification, type AppNotification } from '@/entities/notification'
import { Button } from '@/shared/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu'
import { Icon } from '@/shared/ui/icon'
import { cn } from '@/shared/lib/cn'
import { useLocale, useT } from '@/shared/i18n'
import { fetchInbox, markReadAction, type Inbox } from '../server/actions'

const POLL_MS = 60_000

const tones = {
  primary: 'bg-primary/10 text-primary',
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  highlight: 'bg-highlight/15 text-highlight-foreground',
  muted: 'bg-muted text-muted-foreground',
} as const

/** "now", "5 min. ago", "3 hr. ago", "yesterday", "2 Oct" — short, in the UI language ("narrow" gives "-4 ч" in Russian). */
function useAgo() {
  const locale = useLocale()
  return useMemo(() => {
    const rel = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' })
    const day = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
    return (seconds: number, now: number) => {
      const s = now - seconds
      if (s < 60) return rel.format(0, 'second')
      if (s < 3600) return rel.format(-Math.floor(s / 60), 'minute')
      if (s < 86400) return rel.format(-Math.floor(s / 3600), 'hour')
      if (s < 2 * 86400) return rel.format(-1, 'day')
      return day.format(new Date(seconds * 1000))
    }
  }, [locale])
}

/** Today / Yesterday / Earlier, by the viewer's local day. */
function groupOf(seconds: number) {
  const d = new Date(seconds * 1000)
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  if (d >= start) return 'today'
  start.setDate(start.getDate() - 1)
  return d >= start ? 'yesterday' : 'earlier'
}

/**
 * Header bell (built for scanning): unread count, All / Unread, rows grouped by day — an icon per
 * kind, a short title, one muted line, a relative time and an unread dot. Refreshes every minute.
 */
export function NotificationBell({ initial }: { initial: Inbox }) {
  const t = useT()
  const s = t.notify
  const router = useRouter()
  const ago = useAgo()
  const [inbox, setInbox] = useState(initial)
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [now, setNow] = useState<number | null>(null) // client clock, set when opened (no SSR mismatch)
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

  const shown = onlyUnread ? inbox.items.filter((n) => !n.read) : inbox.items
  const groups = (['today', 'yesterday', 'earlier'] as const)
    .map((g) => ({ g, items: shown.filter((n) => groupOf(n.createdAt) === g) }))
    .filter((x) => x.items.length)

  return (
    <DropdownMenu
      onOpenChange={(o) => {
        if (!o) return
        setNow(Math.floor(Date.now() / 1000))
        fetchInbox().then(setInbox, () => {})
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={inbox.unread ? s.bellUnread(inbox.unread) : t.notifications}>
          <Icon name="bell" />
          {inbox.unread > 0 && (
            <span className="absolute top-0.5 end-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground tabular-nums ring-2 ring-background">
              {inbox.unread > 9 ? '9+' : inbox.unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-w-[calc(100vw-1.5rem)] p-0">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <h2 className="text-sm font-semibold">{s.title}</h2>
          {inbox.unread > 0 && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary tabular-nums">{inbox.unread}</span>}
          {inbox.unread > 0 && (
            <button
              type="button"
              className="ms-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => start(async () => setInbox(await markReadAction()))}
            >
              <Icon name="tick" className="size-3.5" />
              {s.markAllRead}
            </button>
          )}
        </div>
        <div className="flex gap-1 px-4 pt-3" role="tablist">
          {[false, true].map((u) => (
            <button
              key={String(u)}
              type="button"
              role="tab"
              aria-selected={onlyUnread === u}
              onClick={(e) => {
                e.preventDefault()
                setOnlyUnread(u)
              }}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                onlyUnread === u ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {u ? s.unreadTab : s.allTab}
            </button>
          ))}
        </div>
        <div className="max-h-[28rem] overflow-y-auto px-2 pt-1 pb-2">
          {groups.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
              <span className="grid size-10 place-items-center rounded-full bg-muted">
                <Icon name="bell" />
              </span>
              {s.empty}
            </div>
          )}
          {groups.map(({ g, items }) => (
            <section key={g}>
              <h3 className="px-2 pt-3 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{s.groups[g]}</h3>
              {items.map((n) => (
                <Row key={n.id} n={n} when={now ? ago(n.createdAt, now) : ''} onOpen={() => open(n.id, n.link)} />
              ))}
            </section>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Row({ n, when, onOpen }: { n: AppNotification; when: string; onOpen: () => void }) {
  const t = useT()
  const { title, body } = renderNotification(t, n.kind, n.params)
  const look = notificationLook(n.kind)
  return (
    <DropdownMenuItem onSelect={onOpen} className={cn('items-start gap-3 rounded-lg px-2 py-2.5', !n.read && 'bg-primary/[0.04]')}>
      <span className={cn('mt-0.5 grid size-9 flex-none place-items-center rounded-full', tones[look.tone])}>
        <Icon name={look.icon} className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-start gap-2">
          <span className={cn('line-clamp-2 flex-1 text-[13px] leading-snug', n.read ? 'text-muted-foreground' : 'font-medium text-foreground')}>{title}</span>
          <span className="flex-none pt-0.5 text-[11px] text-muted-foreground tabular-nums">{when}</span>
        </span>
        <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{body}</span>
      </span>
      <span aria-hidden className={cn('mt-2 size-2 flex-none rounded-full', n.read ? 'invisible' : 'bg-primary')} />
      {!n.read && <span className="sr-only">{t.notify.unreadTab}</span>}
    </DropdownMenuItem>
  )
}
