'use client'

import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { Icon, type IconName } from '@/shared/ui/icon'
import { useT } from '@/shared/i18n'

export type EmailRow = { key: 'support' | 'info' | 'partners' | 'billing'; address: string }

/** One hue per kind of email: a soft tint fading from the corner, and the icon tile (never mixed). */
const EMAIL_STYLE: Record<EmailRow['key'], { icon: IconName; tile: string; fade: string }> = {
  support: { icon: 'headset', tile: 'bg-info/12 text-info', fade: 'from-info/8 dark:from-info/10' },
  info: { icon: 'mail', tile: 'bg-primary/10 text-primary dark:bg-success/15 dark:text-success', fade: 'from-primary/8 dark:from-success/8' },
  partners: { icon: 'handshake', tile: 'bg-subject-purple/12 text-subject-purple', fade: 'from-subject-purple/8 dark:from-subject-purple/10' },
  billing: { icon: 'wallet', tile: 'bg-foreground/6 text-foreground/70', fade: 'from-foreground/4' },
}

/**
 * The team's addresses as four cards, two per row (owner: the list looked awful): each in its own
 * hue, with what to write about, the address, and copy in one click (a ✓ confirms). The whole card
 * opens the mail app; the copy button sits above that link.
 */
export function EmailCards({ rows }: { rows: EmailRow[] }) {
  const t = useT()
  const s = t.site.contact
  const [copied, setCopied] = useState<string | null>(null)
  return (
    <ul className="grid gap-6 sm:grid-cols-2">
      {rows.map((r) => {
        const st = EMAIL_STYLE[r.key]
        return (
          <li
            key={r.key}
            className={cn(
              'group relative flex flex-col gap-6 rounded-3xl bg-linear-to-br to-card p-6 transition-transform duration-200 motion-safe:hover:-translate-y-0.5 sm:p-8 rtl:bg-linear-to-bl',
              // the same soft edge as the plan cards; a hairline in dark mode (a shadow turns into a halo there)
              'shadow-[0_3px_8px_-2px_color-mix(in_oklch,var(--foreground)_8%,transparent),0_10px_24px_-10px_color-mix(in_oklch,var(--foreground)_7%,transparent)] dark:shadow-none dark:ring-1 dark:ring-foreground/8',
              st.fade,
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <span className={cn('grid size-14 flex-none place-items-center rounded-2xl', st.tile)}>
                <Icon name={st.icon} className="size-7" />
              </span>
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
                  'relative z-10 flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/6 hover:text-foreground',
                  copied === r.key && 'text-primary dark:text-success',
                )}
              >
                <Icon name={copied === r.key ? 'tick' : 'copy'} className="size-4" />
                {copied === r.key ? s.copied : null}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold">{s.emailLabels[r.key]}</h3>
              <p className="text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">{s.emailHints[r.key]}</p>
            </div>
            {/* the whole card writes an email (stretched link) */}
            <a
              href={`mailto:${r.address}`}
              className="mt-auto truncate pt-2 text-[0.9375rem] font-medium text-foreground after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
              dir="ltr"
            >
              {r.address}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
