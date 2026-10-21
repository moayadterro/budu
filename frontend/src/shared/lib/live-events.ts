'use client'

import { useEffect, useRef } from 'react'

/**
 * The browser side of /events (Server-Sent Events): ONE EventSource per tab, shared by every
 * component that listens (module-level on purpose — it's per browser tab, not per user on the
 * server). EventSource reconnects by itself; `onReconnect` lets a listener catch up on anything
 * it missed while offline.
 */
type Listener = { event: string; fn: (data: unknown) => void; onReconnect?: () => void }

let source: EventSource | null = null
let opened = false
const listeners = new Set<Listener>()
const bound = new Set<string>()

function ensure() {
  if (source || typeof window === 'undefined') return
  source = new EventSource('/events')
  bound.clear()
  source.onopen = () => {
    if (opened) for (const l of listeners) l.onReconnect?.() // a reconnect: catch up
    opened = true
  }
  for (const l of listeners) bind(l.event)
}

function bind(event: string) {
  if (!source || bound.has(event)) return
  bound.add(event)
  source.addEventListener(event, (e) => {
    let data: unknown = null
    try {
      data = JSON.parse((e as MessageEvent).data)
    } catch {}
    for (const l of listeners) if (l.event === event) l.fn(data)
  })
}

/** Run `fn` whenever the server pushes `event` to this user (e.g. 'chat'). */
export function useLiveEvent(event: string, fn: (data: unknown) => void, onReconnect?: () => void) {
  const latest = useRef({ fn, onReconnect })
  latest.current = { fn, onReconnect }
  useEffect(() => {
    const l: Listener = { event, fn: (d) => latest.current.fn(d), onReconnect: () => latest.current.onReconnect?.() }
    listeners.add(l)
    ensure()
    bind(event)
    return () => {
      listeners.delete(l)
      if (listeners.size === 0 && source) {
        source.close()
        source = null
        opened = false
      }
    }
  }, [event])
}
