import { initials, pictureSrc, type Person } from '@/shared/lib/person'
import { InitialsAvatar } from './initials-avatar'
import { cn } from '@/shared/lib/cn'

/** A person's photo, or their initials on a tinted circle. */
export function PersonAvatar({ person, className }: { person: Pick<Person, 'name' | 'pictureId'>; className?: string }) {
  return (
    <InitialsAvatar
      initials={initials(person.name)}
      color="var(--color-primary)"
      photo={pictureSrc(person.pictureId)}
      className={cn('size-8 rounded-full text-xs', className)}
    />
  )
}
