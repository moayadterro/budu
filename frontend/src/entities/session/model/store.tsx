'use client'

import { createContext, ReactNode, useContext, useRef } from 'react'
import { createStore, StoreApi, useStore } from 'zustand'
import type { SessionUser } from './types'

/**
 * Signed-in user state for client components. One store per request/tree
 * (Zustand's Next.js pattern) so no user data is shared between requests on the server.
 */
type SessionState = {
  user: SessionUser
  /** profile photo as a data URL; preview only until upload to IOMAD is wired */
  photo: string | null
  setPhoto: (photo: string | null) => void
}

const SessionContext = createContext<StoreApi<SessionState> | null>(null)

export function SessionProvider({ user, children }: { user: SessionUser; children: ReactNode }) {
  const store = useRef<StoreApi<SessionState> | null>(null)
  if (!store.current) {
    store.current = createStore<SessionState>()((set) => ({ user, photo: null, setPhoto: (photo) => set({ photo }) }))
  }
  return <SessionContext.Provider value={store.current}>{children}</SessionContext.Provider>
}

export function useSession<T>(selector: (s: SessionState) => T): T {
  const store = useContext(SessionContext)
  if (!store) throw new Error('useSession must be used inside <SessionProvider>')
  return useStore(store, selector)
}
