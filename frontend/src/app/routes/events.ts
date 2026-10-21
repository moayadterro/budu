import 'server-only'
import { getSession } from '@/entities/session/server'
import { markDelivered } from '@/entities/conversation/server'
import { subscribe } from '@/shared/server/realtime'

/**
 * GET /events — the signed-in user's live updates as Server-Sent Events (the browser's EventSource).
 * The third route handler (next to /files and /uploads): server actions can't push. Events:
 * "chat" = a new message in one of the user's conversations ({ conversationId }; pushing it to the
 * recipient also marks it DELIVERED), "receipt" = the other side received / saw my messages. The
 * page then fetches through the normal, checked server actions. Only ids travel, only to participants.
 */
const HEARTBEAT_MS = 25_000

export async function GET(req: Request) {
  const user = await getSession()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const enc = new TextEncoder()
  let stop = () => {}
  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(enc.encode(chunk))
        } catch {
          stop()
        }
      }
      // tell EventSource to retry quickly if the connection drops
      send('retry: 3000\n\n')
      const unsubscribe = await subscribe('budu_chat', (p) => {
        const e = p as { kind?: 'message' | 'receipt'; conversationId?: number; senderId?: number; users?: number[] }
        if (!e?.users?.includes(user.userId) || !e.conversationId) return
        const data = JSON.stringify({ conversationId: e.conversationId })
        if (e.kind === 'receipt') return send(`event: receipt\ndata: ${data}\n\n`)
        send(`event: chat\ndata: ${data}\n\n`)
        // it reached the recipient's open app → ✓✓ delivered for the sender
        if (e.senderId !== user.userId) void markDelivered(user.userId, e.conversationId).catch(() => {})
      })
      const beat = setInterval(() => send(': ping\n\n'), HEARTBEAT_MS) // keeps proxies from closing it
      stop = () => {
        clearInterval(beat)
        unsubscribe()
        try {
          controller.close()
        } catch {}
      }
      req.signal.addEventListener('abort', () => stop())
    },
    cancel() {
      stop()
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // nginx: don't buffer the stream
    },
  })
}
