'use client'

import { ComponentProps } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from './button'

/** Submit button that disables itself and swaps its label while the form's action runs. */
export function SubmitButton({ label, pendingLabel, ...props }: ComponentProps<typeof Button> & { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingLabel : label}
    </Button>
  )
}
