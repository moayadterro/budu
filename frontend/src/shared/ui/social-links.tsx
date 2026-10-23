'use client'

import { SITE } from '@/shared/config/site'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'
import facebookLogo from '@/assets/social/facebook.svg'
import instagramLogo from '@/assets/social/instagram.svg'
import maxLogo from '@/assets/social/max.svg'
import okLogo from '@/assets/social/ok.svg'
import telegramLogo from '@/assets/social/telegram.svg'
import tiktokLogo from '@/assets/social/tiktok.svg'
import vkLogo from '@/assets/social/vk.svg'

type SocialKey = keyof typeof SITE.social
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

/**
 * Budu's social accounts (SITE.social) as app icons, no names (owner: the platforms are known); the
 * name is the screen-reader label and the hover title. `sm` = the footer's small row; default = the
 * Contact page (seven share the width). An account that doesn't exist yet: greyed out + amber dot.
 */
export function SocialLinks({ size = 'md', className }: { size?: 'sm' | 'md'; className?: string }) {
  const t = useT()
  const soon = t.site.contact.socialSoon
  const links = (Object.entries(SITE.social) as Array<[SocialKey, string | null]>).map(([key, url]) => ({ key, url }))
  return (
    <ul className={cn(size === 'sm' ? 'flex flex-wrap gap-1.5' : 'grid max-w-sm grid-cols-7 gap-2', className)}>
      {links.map(({ key, url }) => {
        const n = SOCIAL[key]
        const tile = (
          <span className="relative block">
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny static logos, no resizing needed */}
            <img
              src={n.logo.src}
              alt=""
              width={44}
              height={44}
              className={cn(
                'rounded-[22%] transition-transform duration-200',
                size === 'sm' ? 'size-7' : 'aspect-square w-full',
                url ? 'group-hover:-translate-y-0.5' : 'opacity-40 grayscale',
              )}
            />
            {/* coming soon: a small amber dot (amber = not there yet) */}
            {!url && <span className="absolute -end-0.5 -top-0.5 size-2 rounded-full bg-warning ring-2 ring-background" />}
          </span>
        )
        return (
          <li key={key}>
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
      })}
    </ul>
  )
}
