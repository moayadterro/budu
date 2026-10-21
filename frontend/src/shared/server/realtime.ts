import 'server-only'
import { Client } from 'pg'
import { query } from './db'

/**
 * Real-time events between server processes via Postgres LISTEN / NOTIFY (no extra service): code
 * that changes something calls `publish(channel, payload)`; the /events stream `subscribe`s and
 * pushes it to the browser at once. One listening connection per server process, shared by every
 * open stream; it reconnects by itself. Works with several frontend servers (they all LISTEN).
 * SERVER-SIDE ONLY.
 */

export type Channel = 'budu_chat'
type Handler = (payload: unknown) => void

const g = globalThis as unknown as { __buduRealtime?: { handlers: Map<Channel, Set<Handler>>; client: Promise<Client> | null } }
const state = (g.__buduRealtime ??= { handlers: new Map(), client: null })

function connect(): Promise<Client> {
  state.client ??= (async () => {
    const client = new Client({ connectionString: process.env.DATABASE_URL })
    const reset = () => {
      state.client = null
      client.end().catch(() => {})
      // listeners still waiting: reconnect shortly
      if ([...state.handlers.values()].some((s) => s.size)) setTimeout(() => void connect().catch(() => {}), 2000)
    }
    client.on('error', reset)
    client.on('end', () => state.client === null || reset())
    client.on('notification', (n) => {
      const set = state.handlers.get(n.channel as Channel)
      if (!set?.size) return
      let payload: unknown = null
      try {
        payload = JSON.parse(n.payload ?? 'null')
      } catch {
        return
      }
      for (const h of set) h(payload)
    })
    await client.connect()
    for (const channel of state.handlers.keys()) await client.query(`LISTEN ${channel}`)
    return client
  })().catch((e) => {
    state.client = null
    throw e
  })
  return state.client
}

/** Call `handler` for every event on the channel; returns the unsubscribe function. */
export async function subscribe(channel: Channel, handler: Handler): Promise<() => void> {
  let set = state.handlers.get(channel)
  const fresh = !set
  if (!set) state.handlers.set(channel, (set = new Set<Handler>()))
  set.add(handler)
  const client = await connect()
  if (fresh) await client.query(`LISTEN ${channel}`)
  return () => set!.delete(handler)
}

/** Tell every listening server (≤ 8000 bytes of JSON — send ids, not content). */
export async function publish(channel: Channel, payload: unknown) {
  await query(`SELECT pg_notify($1, $2)`, [channel, JSON.stringify(payload)])
}
