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
 * The team's addresses as compact cards, one per row beside the form (owner): each in its own
 * hue, with what to write about, the address, and copy in one click (a ✓ confirms). The whole card
 * opens the mail app; the copy button sits above that link.
 */
export function EmailCards({ rows }: { rows: EmailRow[] }) {
  const t = useT()
  const s = t.site.contact
  const [copied, setCopied] = useState<string | null>(null)
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => {
        const st = EMAIL_STYLE[r.key]
        return (
          <li
            key={r.key}
            className={cn(
              'group relative rounded-2xl bg-linear-to-br to-card px-3.5 py-3 transition-transform duration-200 motion-safe:hover:-translate-y-0.5 rtl:bg-linear-to-bl',
              // the same soft edge as the plan cards; a hairline in dark mode (a shadow turns into a halo there)
              'shadow-[0_3px_8px_-2px_color-mix(in_oklch,var(--foreground)_8%,transparent),0_10px_24px_-10px_color-mix(in_oklch,var(--foreground)_7%,transparent)] dark:shadow-none dark:ring-1 dark:ring-foreground/8',
              st.fade,
            )}
          >
            {/* one compact row: icon · title, what to write about and the address · copy */}
            <div className="flex items-center gap-3">
              <span className={cn('grid size-9 flex-none place-items-center rounded-xl', st.tile)}>
                <Icon name={st.icon} className="size-[1.125rem]" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <h3 className="text-sm leading-5 font-semibold">{s.emailLabels[r.key]}</h3>
                <p title={s.emailHints[r.key]} className="text-xs leading-4 text-muted-foreground lg:truncate">{s.emailHints[r.key]}</p>
                {/* the whole card writes an email (stretched link) */}
                <a
                  href={`mailto:${r.address}`}
                  className="mt-0.5 truncate text-[0.8125rem] leading-5 font-medium text-foreground after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
                  dir="ltr"
                >
                  {r.address}
                </a>
              </div>
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
                  'relative z-10 flex h-8 flex-none items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/6 hover:text-foreground',
                  copied === r.key && 'text-primary dark:text-success',
                )}
              >
                <Icon name={copied === r.key ? 'tick' : 'copy'} className="size-4" />
                {copied === r.key ? s.copied : null}
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
