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
  AlertDialogTitle,
} from './alert-dialog'
import { Button } from './button'
import { Icon, type IconName } from './icon'

/**
 * A dangerous action (delete, remove, cancel, reject): a red button that asks first, in an
 * iOS / macOS-style alert — a compact centred card with the action's icon, a title that NAMES what is
 * affected ("Remove Class 10 from this course?"), one line on what happens, and two big stacked
 * buttons: the red action (with its icon) and "Cancel" (focused, so Enter / Esc are safe).
 * Inside a <form> the confirm submits it; or pass `onConfirm`.
 */
export function ConfirmButton({
  label,
  confirmLabel,
  description,
  icon,
  keepLabel,
  iconOnly = false,
  onConfirm,
  className,
  disabled,
  size = 'sm',
}: Pick<ComponentProps<typeof Button>, 'className' | 'disabled' | 'size'> & {
  /** the action, e.g. "Delete" — on the button and on the dialog's confirm */
  label: string
  /** the question naming the thing, e.g. "Delete “Lesson 2”?" — the dialog's title */
  confirmLabel: string
  /** what happens, e.g. "Its videos and homework are deleted too." (default: it can't be undone) */
  description?: string
  /** the action's icon (trigger, dialog and confirm button); default: a bin */
  icon?: IconName
  /** the "don't do it" button when "Cancel" would be confusing — e.g. for "Cancel invite": "Keep invite" */
  keepLabel?: string
  /** an icon button (the label becomes its accessible name) */
  iconOnly?: boolean
  onConfirm?: () => void
}) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const { pending } = useFormStatus()
  const glyph = icon ?? 'trash'
  return (
    <>
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
        {(icon || iconOnly) && <Icon name={glyph} />}
        {!iconOnly && label}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        label={label}
        confirmLabel={confirmLabel}
        description={description}
        icon={glyph}
        keepLabel={keepLabel}
        onConfirm={() => (onConfirm ? onConfirm() : trigger.current?.form?.requestSubmit())}
      />
    </>
  )
}

/**
 * The alert on its own (controlled) — for a dangerous action started from somewhere else, e.g. a
 * "⋯" menu item (`MoreMenu`). Same look and rules as `ConfirmButton`.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  label,
  confirmLabel,
  description,
  icon = 'trash',
  keepLabel,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  label: string
  confirmLabel: string
  description?: string
  icon?: IconName
  keepLabel?: string
  onConfirm: () => void
}) {
  const t = useT()
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="gap-0 overflow-hidden rounded-3xl p-0 shadow-2xl data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-sm">
        <AlertDialogHeader className="flex flex-col items-center gap-2 px-6 pt-7 pb-5 text-center sm:group-data-[size=default]/alert-dialog-content:place-items-center sm:group-data-[size=default]/alert-dialog-content:text-center">
          <div className="mb-2 grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive" aria-hidden>
            <Icon name={icon} className="size-7" />
          </div>
          <AlertDialogTitle className="text-lg leading-snug font-semibold text-balance">{confirmLabel}</AlertDialogTitle>
          <AlertDialogDescription className="text-pretty">{description ?? t.confirm.cannotUndo}</AlertDialogDescription>
        </AlertDialogHeader>
        {/* stacked, full width (like macOS / iOS alerts): big targets, long labels never wrap awkwardly */}
        <AlertDialogFooter className="flex-col gap-2 px-6 pb-6 sm:flex-col">
          <AlertDialogAction
            size="lg"
            variant="danger"
            className="h-12 w-full rounded-xl text-base"
            onClick={() => {
              onOpenChange(false)
              onConfirm()
            }}
          >
            <Icon name={icon} />
            {label}
          </AlertDialogAction>
          <AlertDialogCancel size="lg" variant="secondary" className="h-12 w-full rounded-xl text-base" autoFocus>
            {keepLabel ?? t.confirm.dismiss}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
