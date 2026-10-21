'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { Icon } from '@/shared/ui/icon'
import { useT } from '@/shared/i18n'

/** how long "Back online" stays before it slides away */
const BACK_MS = 3000

/**
 * A strip at the bottom of the screen while the device is offline ("You're offline…"), turning green
 * with "Back online" for a few seconds when the connection returns — like YouTube. Mounted once in
 * RootLayout, so it shows on every page.
 */
export function ConnectionStatus() {
  const t = useT()
  const reduce = useReducedMotion()
  const [state, setState] = useState<'online' | 'offline' | 'back'>('online')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const offline = () => {
      if (timer.current) clearTimeout(timer.current)
      setState('offline')
    }
    const online = () => {
      setState((s) => (s === 'offline' ? 'back' : s))
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setState('online'), BACK_MS)
    }
    if (!navigator.onLine) offline()
    window.addEventListener('offline', offline)
    window.addEventListener('online', online)
    return () => {
      window.removeEventListener('offline', offline)
      window.removeEventListener('online', online)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-50">
      <AnimatePresence>
        {state !== 'online' && (
          <motion.div
            key="strip"
            initial={reduce ? { opacity: 0 } : { y: '100%' }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] text-sm font-medium transition-colors duration-300',
              state === 'offline' ? 'bg-foreground text-background' : 'bg-success text-primary-foreground',
            )}
          >
            <Icon name={state === 'offline' ? 'wifiOff' : 'wifi'} className="size-4 flex-none" />
            {state === 'offline' ? t.connection.offline : t.connection.back}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
