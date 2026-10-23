'use client'

import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { Icon, type IconName } from '@/shared/ui/icon'
import { useT } from '@/shared/i18n'
import facebookLogo from '@/assets/social/facebook.svg'
import instagramLogo from '@/assets/social/instagram.svg'
import maxLogo from '@/assets/social/max.svg'
import okLogo from '@/assets/social/ok.svg'
import telegramLogo from '@/assets/social/telegram.svg'
import tiktokLogo from '@/assets/social/tiktok.svg'
import vkLogo from '@/assets/social/vk.svg'

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
/** Each platform's own app-icon tile (brand colours live in the logo files, not in our tokens). */
const SOCIAL: Record<SocialKey, { name: string; logo: { src: string } }> = {
  telegram: { name: 'Telegram', logo: telegramLogo },
  vk: { name: 'VK', logo: vkLogo },
  max: { name: 'MAX', logo: maxLogo },
  ok: { name: 'OK', logo: okLogo },
  instagram: { name: 'Instagram', logo: instagramLogo },
  facebook: { name: 'Facebook', logo: facebookLogo },
  tiktok: { name: 'TikTok', logo: tiktokLogo },
}

/** Social accounts as app icons; one that doesn't exist yet is greyed out with an amber "soon" dot. */
export function SocialRow({ links }: { links: Array<{ key: SocialKey; url: string | null }> }) {
  const t = useT()
  const s = t.site.contact
  return (
    <ul className="grid grid-cols-4 gap-2 sm:grid-cols-7 lg:grid-cols-4">
      {links.map(({ key, url }) => {
        const n = SOCIAL[key]
        const tile = (
          <>
            <span className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny static logos, no resizing needed */}
              <img src={n.logo.src} alt="" width={48} height={48} className={cn('size-12 rounded-[0.9rem] transition-transform duration-200', url ? 'group-hover:-translate-y-0.5' : 'opacity-40 grayscale')} />
              {/* coming soon: a small amber dot (amber = not there yet) */}
              {!url && <span className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full bg-warning ring-2 ring-background" />}
            </span>
            <span className="text-[0.6875rem] text-muted-foreground">{n.name}</span>
          </>
        )
        return (
          <li key={key}>
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" aria-label={n.name} className="group flex flex-col items-center gap-1.5 rounded-xl py-1">
                {tile}
              </a>
            ) : (
              <span title={`${n.name}: ${s.socialSoon}`} aria-label={`${n.name}: ${s.socialSoon}`} className="flex cursor-default flex-col items-center gap-1.5 py-1">
                {tile}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
