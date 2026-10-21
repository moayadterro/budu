import 'server-only'
import { getSession } from '@/entities/session/server'
import { subscribe } from '@/shared/server/realtime'

/**
 * GET /events — the signed-in user's live updates as Server-Sent Events (the browser's EventSource).
 * The third route handler (next to /files and /uploads): server actions can't push. Today: "chat" =
 * a new message in one of the user's conversations ({ conversationId }); the page then fetches it
 * through the normal, checked server action. Only ids travel here, and only to participants.
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
        const e = p as { conversationId?: number; users?: number[] }
        if (e?.users?.includes(user.userId)) send(`event: chat\ndata: ${JSON.stringify({ conversationId: e.conversationId })}\n\n`)
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
