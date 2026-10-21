'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { MAX_MESSAGE, statusOf, type Message, type MessageStatus, type Receipts } from '@/entities/conversation'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { Textarea } from '@/shared/ui/textarea'
import { cn } from '@/shared/lib/cn'
import { useLiveEvent } from '@/shared/lib/live-events'
import { useLocale, useT } from '@/shared/i18n'
import { markSeenAction, pollMessagesAction, receiptsAction, sendMessageAction } from '../server/actions'

/** a slow safety net in case live events can't get through (a strict proxy) — normally they arrive at once */
const FALLBACK_MS = 30_000

/**
 * An open conversation: messages arrive LIVE (pushed over /events the moment they're sent) and a
 * composer. Enter sends, Shift+Enter = new line.
 */
export function ChatThread({
  conversationId,
  meId,
  initial,
  receipts: initialReceipts,
}: {
  conversationId: number
  meId: number
  initial: Message[]
  /** what the other person has received / seen — the ticks on my messages */
  receipts: Receipts
}) {
  const t = useT()
  const locale = useLocale()
  const [messages, setMessages] = useState(initial)
  const [receipts, setReceipts] = useState(initialReceipts)
  const [text, setText] = useState('')
  const [pending, start] = useTransition()
  // times in the viewer's zone: only after mount (the server doesn't know it)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const router = useRouter()
  const end = useRef<HTMLDivElement>(null)
  const lastId = messages.at(-1)?.id ?? 0
  const last = useRef(lastId)
  last.current = lastId

  const add = (more: Message[]) =>
    setMessages((cur) => {
      const seen = new Set(cur.map((m) => m.id))
      const fresh = more.filter((m) => !seen.has(m.id))
      return fresh.length ? [...cur, ...fresh] : cur
    })

  const fetchNew = useCallback(async () => {
    // in view → they're seen; in a background tab → only delivered (seen once the tab is back)
    const more = await pollMessagesAction(conversationId, last.current, !document.hidden)
    if (more.length) {
      add(more)
      router.refresh() // the conversation list (last message, unread)
    }
  }, [conversationId, router])

  // live: a message in THIS conversation → fetch it now; in another one → refresh the list
  useLiveEvent(
    'chat',
    (d) => {
      if ((d as { conversationId?: number })?.conversationId === conversationId) void fetchNew()
      else router.refresh()
    },
    () => void fetchNew(), // back online: catch up
  )

  // the other side received / saw my messages → update the ticks
  const refreshReceipts = useCallback(async () => {
    const r = await receiptsAction(conversationId)
    if (r) setReceipts(r)
  }, [conversationId])
  useLiveEvent('receipt', (d) => {
    if ((d as { conversationId?: number })?.conversationId === conversationId) void refreshReceipts()
  })

  // back to this tab: what arrived meanwhile is seen now
  useEffect(() => {
    const onShow = () => document.visibilityState === 'visible' && void markSeenAction(conversationId)
    document.addEventListener('visibilitychange', onShow)
    return () => document.removeEventListener('visibilitychange', onShow)
  }, [conversationId])

  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden) return
      void fetchNew()
      void refreshReceipts()
    }, FALLBACK_MS)
    return () => clearInterval(id)
  }, [fetchNew, refreshReceipts])

  // braces: scrollIntoView may return a promise, and an effect must return nothing or a cleanup
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  const send = () => {
    const body = text.trim()
    if (!body || pending) return
    start(async () => {
      const res = await sendMessageAction(conversationId, body)
      if (res.ok) {
        add([res.message])
        setText('')
        router.refresh()
      }
    })
  }

  const time = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 && <p className="m-auto text-sm text-muted-foreground">{t.messages.noMessages}</p>}
        {messages.map((m) => {
          const mine = m.senderId === meId
          return (
            <div key={m.id} className={cn('flex max-w-[80%] flex-col gap-0.5', mine ? 'ms-auto items-end' : 'me-auto items-start')}>
              <div
                className={cn(
                  'rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words',
                  mine ? 'rounded-ee-sm bg-primary text-primary-foreground' : 'rounded-es-sm bg-muted',
                )}
              >
                {m.body}
              </div>
              <span className="flex min-h-4 items-center gap-1 px-1 text-[11px] text-muted-foreground">
                <time>{mounted && time.format(new Date(m.createdAt * 1000))}</time>
                {mine && <Ticks status={statusOf(m, receipts)} />}
              </span>
            </div>
          )
        })}
        <div ref={end} />
      </div>
      <form
        className="flex items-end gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              send()
            }
          }}
          placeholder={t.messages.placeholder}
          aria-label={t.messages.placeholder}
          maxLength={MAX_MESSAGE}
          rows={1}
          className="max-h-40 min-h-10 resize-none"
        />
        <Button type="submit" size="icon" disabled={pending || !text.trim()} aria-label={t.messages.send}>
          <Icon name="send" className="rtl:-scale-x-100" />
        </Button>
      </form>
    </div>
  )
}

/** ✓ sent · ✓✓ delivered (grey) · ✓✓ seen (green) — like the messengers people know. */
function Ticks({ status }: { status: MessageStatus }) {
  const t = useT()
  return (
    <span title={t.messages.status[status]} aria-label={t.messages.status[status]} className="inline-flex">
      <Icon
        name={status === 'sent' ? 'tick' : 'tickDouble'}
        className={cn('size-3.5', status === 'seen' ? 'text-primary' : 'text-muted-foreground')}
      />
    </span>
  )
}
