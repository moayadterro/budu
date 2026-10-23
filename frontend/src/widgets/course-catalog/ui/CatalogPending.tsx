'use client'

import { createContext, useContext, useTransition, type TransitionStartFunction } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * "A search is running": the filters start their address change in this transition, the results
 * fade while the server answers (owner: a search with no feedback looked broken).
 */
const Pending = createContext<{ pending: boolean; start: TransitionStartFunction } | null>(null)

export function CatalogPendingProvider({ children }: { children: React.ReactNode }) {
  const [pending, start] = useTransition()
  return <Pending.Provider value={{ pending, start }}>{children}</Pending.Provider>
}

export function useCatalogPending() {
  const ctx = useContext(Pending)
  if (!ctx) throw new Error('useCatalogPending outside CatalogPendingProvider')
  return ctx
}

/** The results: faded and not clickable while a new search loads. */
export function CatalogPendingArea({ children }: { children: React.ReactNode }) {
  const { pending } = useCatalogPending()
  return (
    <div aria-busy={pending} className={cn('flex flex-col gap-6 transition-opacity duration-200', pending && 'pointer-events-none opacity-40')}>
      {children}
    </div>
  )
}
