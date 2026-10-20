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
    <Avatar className={className}>
      {photo && <AvatarImage src={photo} alt="" />}
      <AvatarFallback className="rounded-[inherit] font-semibold text-primary-foreground" style={{ background: color }}>
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
