'use client'

import { motion, useReducedMotion } from 'motion/react'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

/** Fades each screen in on navigation (skipped for reduced motion). */
export function PageTransition({ children }: { children: ReactNode }) {
  const path = usePathname()
  const reduce = useReducedMotion()
  return (
    <motion.div
      key={path}
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

/** Pops content in, e.g. a "submitted" confirmation. */
export function Appear({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
