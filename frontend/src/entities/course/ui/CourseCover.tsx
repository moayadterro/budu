import { cn } from '@/shared/lib/cn'
import { Icon } from '@/shared/ui/icon'

/** Two-token gradients for courses without a cover image (picked by course id, so a course keeps its look). */
const GRADIENTS = [
  ['var(--chart-5)', 'var(--chart-3)'],
  ['var(--subject-purple)', 'var(--info)'],
  ['var(--subject-terra)', 'var(--highlight)'],
  ['var(--info)', 'var(--chart-3)'],
  ['var(--primary)', 'var(--subject-purple)'],
] as const

const initials = (title: string) =>
  title
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

/**
 * A course's cover: the uploaded image (served by /files, public once the course is published), or a
 * generated one — a gradient with the course's initials. 16:9 unless `className` says otherwise.
 */
export function CourseCover({ courseId, title, imageId, className }: { courseId: number; title: string; imageId: number | null; className?: string }) {
  if (imageId) {
    // eslint-disable-next-line @next/next/no-img-element -- streamed by our /files route, not a static asset
    return <img src={`/files/${imageId}`} alt="" loading="lazy" className={cn('aspect-video w-full object-cover', className)} />
  }
  const [a, b] = GRADIENTS[courseId % GRADIENTS.length]
  return (
    <div
      aria-hidden
      className={cn('relative grid aspect-video w-full place-items-center overflow-hidden text-primary-foreground', className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${a}, ${b})` }}
    >
      <Icon name="book" className="absolute -end-4 -bottom-4 size-28 opacity-15" />
      <span className="text-4xl font-semibold tracking-tight drop-shadow-sm">{initials(title) || '•'}</span>
    </div>
  )
}
