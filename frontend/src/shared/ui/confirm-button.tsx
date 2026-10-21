'use client'

import { ComponentProps, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useT } from '@/shared/i18n'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from './alert-dialog'
import { Button } from './button'
import { Icon, type IconName } from './icon'

/**
 * A dangerous action (delete, remove, cancel, reject): a red button that asks first in a dialog —
 * what will happen, that it can't be undone, "Go back" (focused, so Enter is safe) and a solid red
 * button named after the action. Inside a <form> the confirm submits it; or pass `onConfirm`.
 */
export function ConfirmButton({
  label,
  confirmLabel,
  description,
  icon,
  iconOnly = false,
  onConfirm,
  className,
  disabled,
  size = 'sm',
}: Pick<ComponentProps<typeof Button>, 'className' | 'disabled' | 'size'> & {
  /** the action, e.g. "Delete" — on the button and on the dialog's confirm */
  label: string
  /** the question, e.g. "Delete this lesson?" — the dialog's title */
  confirmLabel: string
  /** what happens, e.g. "Its videos and homework are deleted too." (default: it can't be undone) */
  description?: string
  icon?: IconName
  /** an icon button (the label becomes its accessible name) */
  iconOnly?: boolean
  onConfirm?: () => void
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const { pending } = useFormStatus()
  const confirm = () => {
    setOpen(false)
    if (onConfirm) onConfirm()
    else trigger.current?.form?.requestSubmit()
  }
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        ref={trigger}
        type="button"
        variant={iconOnly ? 'ghost' : 'destructive'}
        size={iconOnly ? 'icon-sm' : size}
        disabled={disabled || pending}
        onClick={() => setOpen(true)}
        aria-label={iconOnly ? label : undefined}
        title={iconOnly ? label : undefined}
        className={iconOnly ? `text-destructive hover:bg-destructive/10 hover:text-destructive ${className ?? ''}` : className}
      >
        {(icon || iconOnly) && <Icon name={icon ?? 'trash'} />}
        {!iconOnly && label}
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Icon name="alert" />
          </AlertDialogMedia>
          <AlertDialogTitle>{confirmLabel}</AlertDialogTitle>
          <AlertDialogDescription>{description ?? t.confirm.cannotUndo}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel autoFocus>{t.confirm.back}</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={confirm}>
            {label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
