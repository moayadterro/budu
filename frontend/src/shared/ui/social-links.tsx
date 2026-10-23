'use client'

import { SITE } from '@/shared/config/site'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'
import { SOCIAL_GLYPHS } from './social-glyphs'
import facebookLogo from '@/assets/social/facebook.svg'
import instagramLogo from '@/assets/social/instagram.svg'
import maxLogo from '@/assets/social/max.svg'
import okLogo from '@/assets/social/ok.svg'
import telegramLogo from '@/assets/social/telegram.svg'
import tiktokLogo from '@/assets/social/tiktok.svg'
import vkLogo from '@/assets/social/vk.svg'
import whatsappLogo from '@/assets/social/whatsapp.svg'
import xLogo from '@/assets/social/x.svg'
import youtubeLogo from '@/assets/social/youtube.svg'

type SocialKey = keyof typeof SITE.social
/** Each platform's own app-icon tile (brand colours live in the logo files, not in our tokens). */
const SOCIAL: Record<SocialKey, { name: string; logo: { src: string } }> = {
  telegram: { name: 'Telegram', logo: telegramLogo },
  whatsapp: { name: 'WhatsApp', logo: whatsappLogo },
  vk: { name: 'VK', logo: vkLogo },
  max: { name: 'MAX', logo: maxLogo },
  ok: { name: 'OK', logo: okLogo },
  x: { name: 'X', logo: xLogo },
  youtube: { name: 'YouTube', logo: youtubeLogo },
  instagram: { name: 'Instagram', logo: instagramLogo },
  facebook: { name: 'Facebook', logo: facebookLogo },
  tiktok: { name: 'TikTok', logo: tiktokLogo },
}

/** Contact: two rows of five, the most used first (owner's order; YouTube before TikTok). */
const CONTACT_ROWS: SocialKey[][] = [
  ['telegram', 'max', 'whatsapp', 'vk', 'facebook'],
  ['instagram', 'ok', 'x', 'youtube', 'tiktok'],
]

/** The footer shows only the main platforms, in the owner's order (the rest are on Contact). */
const FOOTER_ROWS: SocialKey[][] = [['telegram', 'max', 'whatsapp', 'vk', 'facebook', 'instagram']]

/**
 * Budu's social accounts (SITE.social), no names on the icons (owner: the platforms are known); the
 * name is the screen-reader label and the hover title. ONE component, two looks: `sm` = the footer,
 * plain one-colour marks for the main platforms only (FOOTER_ROWS), grey, black on hover (owner: no
 * colourful icons there); default = the Contact page, colour app-icon tiles in two rows of five
 * (CONTACT_ROWS). An account that doesn't exist yet: greyed out + amber dot.
 */
export function SocialLinks({ size = 'md', className }: { size?: 'sm' | 'md'; className?: string }) {
  const t = useT()
  const soon = t.site.contact.socialSoon
  if (size === 'sm') {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {FOOTER_ROWS.map((row, i) => (
          <ul key={i} className="flex gap-0.5">
            {row.map((key) => (
              <Item key={key} k={key} size="sm" soon={soon} />
            ))}
          </ul>
        ))}
      </div>
    )
  }
  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      {CONTACT_ROWS.map((row, i) => (
        <ul key={i} className="flex gap-2.5">
          {row.map((key) => (
            <Item key={key} k={key} size="md" soon={soon} />
          ))}
        </ul>
      ))}
    </div>
  )
}

/** One platform: its mark (footer) or colour tile (Contact), a link when the account exists. */
function Item({ k: key, size, soon }: { k: SocialKey; size: 'sm' | 'md'; soon: string }) {
  const url = SITE.social[key]
  const n = SOCIAL[key]
  const g = SOCIAL_GLYPHS[key]
  const tile =
    size === 'sm' ? (
      <span
        className={cn(
          'relative grid size-7 place-items-center rounded-lg transition-colors',
          url ? 'text-muted-foreground group-hover:bg-foreground/6 group-hover:text-foreground' : 'text-muted-foreground/40',
        )}
      >
        <svg viewBox={g.viewBox} aria-hidden className="size-4">
          <path fill="currentColor" fillRule={g.evenodd ? 'evenodd' : undefined} d={g.d} />
        </svg>
      </span>
    ) : (
      <span className="relative block">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static logos, no resizing needed */}
        <img
          src={n.logo.src}
          alt=""
          width={44}
          height={44}
          className={cn(
            'size-11 rounded-[22%] transition-transform duration-200',
            key === 'youtube' && 'ring-1 ring-foreground/10', // a white tile needs an edge on a white page
            url ? 'group-hover:-translate-y-0.5' : 'opacity-40 grayscale',
          )}
        />
        {/* coming soon: a small amber dot (amber = not there yet) */}
        {!url && <span className="absolute -end-0.5 -top-0.5 size-2 rounded-full bg-warning ring-2 ring-background" />}
      </span>
    )
  return (
    <li>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={n.name}
          title={n.name}
          className="group block rounded-[22%] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {tile}
        </a>
      ) : (
        <span title={`${n.name}: ${soon}`} aria-label={`${n.name}: ${soon}`} className="block cursor-default">
          {tile}
        </span>
      )}
    </li>
  )
}
