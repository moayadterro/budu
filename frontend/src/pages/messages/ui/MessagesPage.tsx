import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getConversation, listConversations, listMessages, markConversationRead, markDelivered, receiptsFor } from '@/entities/conversation/server'
import { requireRole } from '@/entities/session/server'
import { ChatThread, LiveConversations } from '@/features/chat'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Icon } from '@/shared/ui/icon'
import { LocalTime } from '@/shared/ui/local-time'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { ScreenHead } from '@/shared/ui/screen-head'
import { cn } from '@/shared/lib/cn'
import { getT } from '@/shared/i18n/server'

/** Parents and teachers: conversation list + the open conversation (two panes; one at a time on phones). */
export async function MessagesPage(props: { params?: Promise<{ conversationId?: string }> }) {
  const user = await requireRole('parent', 'teacher', 'manager')
  const t = await getT()
  const s = t.messages
  const raw = (await props.params)?.conversationId
  const openId = raw ? Number(raw) : 0
  if (raw && (!Number.isSafeInteger(openId) || openId <= 0)) notFound()

  const open = openId ? await getConversation(user.userId, openId) : null
  if (openId && !open) notFound()
  const messages = open ? await listMessages(open.id) : []
  if (open) await markConversationRead(user.userId, open.id)
  await markDelivered(user.userId) // opening Messages = everything waiting here reached them (✓✓)
  const receipts = open ? await receiptsFor(user.userId, open.id) : null
  const conversations = await listConversations(user.userId) // after marking read: this one shows no unread

  return (
    <div data-wide className="flex flex-col">
      <ScreenHead title={s.title} sub={s.sub} />
      {!open && <LiveConversations />}
      <Card className="grid h-[calc(100svh-13rem)] min-h-96 grid-cols-1 gap-0 overflow-hidden p-0 md:grid-cols-[320px_1fr]">
        <nav className={cn('min-h-0 overflow-y-auto border-e', open && 'hidden md:block')} aria-label={s.title}>
          {conversations.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{s.empty}</p>
              <p className="mt-1">{user.role === 'parent' ? s.emptyParent : s.emptyTeacher}</p>
            </div>
          )}
          <ul>
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  aria-current={c.id === open?.id ? 'page' : undefined}
                  className={cn('flex gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/50', c.id === open?.id && 'bg-muted')}
                >
                  <PersonAvatar person={{ name: c.withName, pictureId: null }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={cn('truncate text-sm', c.unread ? 'font-semibold' : 'font-medium')}>{c.withName}</span>
                      <LocalTime seconds={c.lastMessageAt} className="flex-none text-[11px] text-muted-foreground" />
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{s.about(c.childName)}</div>
                    <div className="flex items-center gap-2">
                      <span className={cn('min-w-0 flex-1 truncate text-sm', c.unread ? 'text-foreground' : 'text-muted-foreground')}>
                        {c.lastMessage}
                      </span>
                      {c.unread > 0 && <Badge className="h-5 min-w-5 rounded-full px-1.5 tabular-nums">{c.unread}</Badge>}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section className={cn('flex min-h-0 flex-col', !open && 'hidden md:flex')}>
          {open ? (
            <>
              <header className="flex items-center gap-3 border-b px-4 py-3">
                <Button variant="ghost" size="icon-sm" className="md:hidden" asChild aria-label={s.back}>
                  <Link href="/messages">
                    <Icon name="back" className="rtl:-scale-x-100" />
                  </Link>
                </Button>
                <PersonAvatar person={{ name: open.withName, pictureId: null }} />
                <div className="min-w-0">
                  <div className="truncate font-medium">{open.withName}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {user.role === 'parent' ? (
                      <Link href={`/family/${open.childId}`} className="underline-offset-4 hover:underline">
                        {s.about(open.childName)}
                      </Link>
                    ) : (
                      s.about(open.childName)
                    )}
                  </div>
                </div>
              </header>
              <ChatThread key={open.id} conversationId={open.id} meId={user.userId} initial={messages} receipts={receipts ?? { deliveredAt: 0, readAt: 0 }} />
            </>
          ) : (
            <p className="m-auto text-sm text-muted-foreground">{s.pick}</p>
          )}
        </section>
      </Card>
    </div>
  )
}
