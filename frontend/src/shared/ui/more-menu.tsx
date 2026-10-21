'use client'

import { useState } from 'react'
import { useT } from '@/shared/i18n'
import { Button } from './button'
import { ConfirmDialog } from './confirm-button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './dropdown-menu'
import { Icon, type IconName } from './icon'

export type MenuAction = { label: string; icon: IconName; onSelect: () => void; disabled?: boolean }

export type DangerAction = {
  /** the verb, e.g. "Delete" — in the menu (red) and on the alert's button */
  label: string
  icon?: IconName
  /** the alert's title naming the thing: "Delete “Lesson 2”?" */
  confirmLabel: string
  description?: string
  keepLabel?: string
  onConfirm: () => void
}

/**
 * A row's actions behind one quiet "⋯" button (instead of a red Delete on every row): ordinary
 * actions first, then — after a divider, in red — the dangerous one, which still asks first in the
 * alert (`ConfirmDialog`). `label` names the row for screen readers: "Actions for Lesson 2".
 */
export function MoreMenu({ label, actions = [], danger }: { label: string; actions?: MenuAction[]; danger?: DangerAction }) {
  const t = useT()
  const [confirming, setConfirming] = useState(false)
  return (
    <>
      {/* modal={false}: the alert can open right after the menu closes without fighting over focus */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={label} title={t.moreActions}>
            <Icon name="more" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          {actions.map((a) => (
            <DropdownMenuItem key={a.label} disabled={a.disabled} onSelect={a.onSelect}>
              <Icon name={a.icon} />
              {a.label}
            </DropdownMenuItem>
          ))}
          {danger && (
            <>
              {actions.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
                <Icon name={danger.icon ?? 'trash'} />
                {danger.label}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {danger && (
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          label={danger.label}
          confirmLabel={danger.confirmLabel}
          description={danger.description}
          icon={danger.icon}
          keepLabel={danger.keepLabel}
          onConfirm={danger.onConfirm}
        />
      )}
    </>
  )
}
