import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { cn } from '@/shared/lib/cn'

/**
 * shadcn Avatar with coloured initials (and an optional photo).
 * `color` is a token var, e.g. var(--color-info).
 */
export function InitialsAvatar({
  initials,
  color,
  photo,
  className,
}: {
  initials: string
  color: string
  photo?: string | null
  className?: string
}) {
  return (
    // @container: the initials scale with the circle (~38% of its width), so "TT" never crowds a small
    // avatar or looks lost in a big one
    <Avatar className={cn('@container', className)}>
      {photo && <AvatarImage src={photo} alt="" />}
      <AvatarFallback
        className="rounded-[inherit] text-[length:38cqi] leading-none font-semibold tracking-tight text-primary-foreground"
        style={{ background: color }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
