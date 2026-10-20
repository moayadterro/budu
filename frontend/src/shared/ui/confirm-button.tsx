'use client'

import { ComponentProps, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from './button'

/**
 * Submit button for destructive actions: the first click arms it (shows
 * `confirmLabel`), the second submits. Disarms itself after a few seconds.
 * Used instead of window.confirm.
 */
export function ConfirmButton({ label, confirmLabel, ...props }: ComponentProps<typeof Button> & { label: string; confirmLabel: string }) {
  const [armed, setArmed] = useState(false)
  const { pending } = useFormStatus()
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    // Always type="button": switching to "submit" on the first click would make that same
    // click submit (React re-renders before the browser's default action runs).
    <Button
      type="button"
      variant={armed ? 'destructive' : 'outline'}
      size="sm"
      disabled={pending}
      onClick={(e) => (armed ? e.currentTarget.form?.requestSubmit() : setArmed(true))}
      {...props}
    >
      {armed ? confirmLabel : label}
    </Button>
  )
}
