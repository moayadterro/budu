'use client'

import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { Icon, type IconName } from '@/shared/ui/icon'
import { useT } from '@/shared/i18n'

export type EmailRow = { key: 'support' | 'info' | 'partners' | 'billing'; address: string }

/** One hue per kind of email (tile + soft fill), never several in one place. */
const EMAIL_STYLE: Record<EmailRow['key'], { icon: IconName; tile: string }> = {
  support: { icon: 'headset', tile: 'bg-info/12 text-info' },
  info: { icon: 'mail', tile: 'bg-primary/10 text-primary dark:bg-success/15 dark:text-success' },
  partners: { icon: 'handshake', tile: 'bg-subject-purple/12 text-subject-purple' },
  billing: { icon: 'wallet', tile: 'bg-foreground/6 text-foreground/70' },
}

/** The team's addresses: tap to write, or copy with one click (a ✓ confirms). */
export function EmailList({ rows }: { rows: EmailRow[] }) {
  const t = useT()
  const s = t.site.contact
  const [copied, setCopied] = useState<string | null>(null)
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => {
        const st = EMAIL_STYLE[r.key]
        return (
          <li key={r.key} className="group flex items-center gap-3 rounded-2xl p-2 pe-1.5 transition-colors hover:bg-foreground/4">
            <span className={cn('grid size-11 flex-none place-items-center rounded-xl', st.tile)}>
              <Icon name={st.icon} className="size-5" />
            </span>
            <a href={`mailto:${r.address}`} className="flex min-w-0 flex-1 flex-col">
              <span className="text-xs text-muted-foreground">{s.emailLabels[r.key]}</span>
              <span className="truncate text-sm font-medium" dir="ltr">
                {r.address}
              </span>
            </a>
            <button
              type="button"
              aria-label={`${s.copy}: ${r.address}`}
              title={copied === r.key ? s.copied : s.copy}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(r.address)
                  setCopied(r.key)
                  setTimeout(() => setCopied((c) => (c === r.key ? null : c)), 1500)
                } catch {
                  /* clipboard blocked: the address is visible to copy by hand */
                }
              }}
              className={cn(
                'grid size-10 flex-none place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground',
                copied === r.key && 'text-primary dark:text-success',
              )}
            >
              <Icon name={copied === r.key ? 'tick' : 'copy'} className="size-4" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
