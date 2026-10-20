'use client'

import { createContext, ReactNode, useContext, useEffect, useRef } from 'react'
import { createStore, StoreApi, useStore } from 'zustand'
import type { SessionUser } from './types'

/**
 * Signed-in user state for client components. One store per request/tree
 * (Zustand's Next.js pattern) so no user data is shared between requests on the server.
 * It follows the server: after a profile change the layout re-renders with a new `user`.
 */
type SessionState = { user: SessionUser }

const SessionContext = createContext<StoreApi<SessionState> | null>(null)

export function SessionProvider({ user, children }: { user: SessionUser; children: ReactNode }) {
  const store = useRef<StoreApi<SessionState> | null>(null)
  if (!store.current) store.current = createStore<SessionState>()(() => ({ user }))
  useEffect(() => {
    store.current?.setState({ user })
  }, [user])
  return <SessionContext.Provider value={store.current}>{children}</SessionContext.Provider>
}

export function useSession<T>(selector: (s: SessionState) => T): T {
  const store = useContext(SessionContext)
  if (!store) throw new Error('useSession must be used inside <SessionProvider>')
  return useStore(store, selector)
}
