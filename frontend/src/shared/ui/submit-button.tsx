'use client'

import { ComponentProps } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from './button'

/** Submit button that disables itself and swaps its label while the form's action runs. */
export function SubmitButton({
  label,
  pendingLabel,
  disabled,
  ...props
}: ComponentProps<typeof Button> & { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    // a caller's `disabled` adds to "pending", it never re-enables a button that is submitting
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? pendingLabel : label}
    </Button>
  )
}
