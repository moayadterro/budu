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

export type SocialKey = 'telegram' | 'vk' | 'max' | 'ok' | 'instagram' | 'facebook' | 'tiktok'
const SOCIAL: Record<SocialKey, { name: string; icon: IconName | null }> = {
  telegram: { name: 'Telegram', icon: 'telegram' },
  vk: { name: 'VK', icon: 'vk' },
  max: { name: 'MAX', icon: null }, // no logo in our icon set: a lettered tile
  ok: { name: 'OK', icon: null },
  instagram: { name: 'Instagram', icon: 'instagram' },
  facebook: { name: 'Facebook', icon: 'facebook' },
  tiktok: { name: 'TikTok', icon: 'tiktok' },
}

/** Social accounts as quiet app-like tiles; an account that doesn't exist yet is shown as "soon". */
export function SocialRow({ links }: { links: Array<{ key: SocialKey; url: string | null }> }) {
  const t = useT()
  const s = t.site.contact
  return (
    <ul className="grid grid-cols-4 gap-2 sm:grid-cols-7 lg:grid-cols-4">
      {links.map(({ key, url }) => {
        const n = SOCIAL[key]
        const tile = (
          <>
            <span className="relative grid size-12 place-items-center rounded-2xl bg-foreground/5 transition-colors group-hover:bg-foreground/8">
              {n.icon ? <Icon name={n.icon} className="size-5.5" /> : <span className="text-xs font-medium tracking-tight lowercase">{n.name}</span>}
              {/* coming soon: a small amber dot (amber = not there yet) */}
              {!url && <span className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full bg-warning ring-2 ring-background" />}
            </span>
            <span className="text-[0.6875rem] text-muted-foreground">{n.name}</span>
          </>
        )
        return (
          <li key={key}>
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-1.5 rounded-xl py-1 text-foreground">
                {tile}
              </a>
            ) : (
              <span title={`${n.name}: ${s.socialSoon}`} aria-label={`${n.name}: ${s.socialSoon}`} className="group flex cursor-default flex-col items-center gap-1.5 py-1 text-foreground/50">
                {tile}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
