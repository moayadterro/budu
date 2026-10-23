import { LocalLink as Link } from '@/shared/ui/local-link'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Icon, type IconName } from '@/shared/ui/icon'
import { getT } from '@/shared/i18n/server'

/** Who Budu is for, as app icons in the plan colours (students green, teachers blue, schools purple). */
const WHO: Array<{ key: 'students' | 'teachers' | 'schools'; as: string; icon: IconName; tile: string }> = [
  { key: 'students', as: 'student', icon: 'student', tile: 'bg-linear-to-b from-primary/75 to-primary' },
  { key: 'teachers', as: 'teacher', icon: 'teacher', tile: 'bg-linear-to-b from-info/75 to-info' },
  { key: 'schools', as: 'school', icon: 'school', tile: 'bg-linear-to-b from-subject-purple/75 to-subject-purple' },
]

/**
 * "Ready to learn or to teach?": the closing invitation for EVERYONE (the home page), the twin of
 * SchoolInvite: no box, big type on white space, one app icon per audience (each opens its own
 * sign-up, one tap = "I'm a …"), one green button and a quiet "›" link to the courses.
 */
export async function JoinInvite({ className }: { className?: string }) {
  const s = (await getT()).landing
  return (
    <section className={cn('flex flex-col items-center gap-8 py-4 text-center sm:py-10', className)}>
      <ul className="flex flex-wrap justify-center gap-5 sm:gap-8">
        {WHO.map((w) => (
          <li key={w.key}>
            <Link href={`/register?as=${w.as}`} className="group flex w-20 flex-col items-center gap-2 rounded-2xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
              <span
                className={cn(
                  'grid size-16 place-items-center rounded-[1.35rem] text-primary-foreground shadow-[0_1px_1px_color-mix(in_oklch,var(--foreground)_8%,transparent),0_8px_20px_-8px_color-mix(in_oklch,var(--foreground)_25%,transparent)] transition-transform duration-200 group-hover:-translate-y-0.5 sm:size-18 sm:rounded-[1.5rem] dark:shadow-none',
                  w.tile,
                )}
              >
                <Icon name={w.icon} className="size-7 sm:size-8" />
              </span>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{s.ctaWho[w.key]}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex flex-col items-center gap-4">
        <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">{s.ctaTitle}</h2>
        <p className="max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">{s.ctaSub}</p>
      </div>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <Button size="lg" className="h-12 px-7 text-base" asChild>
          <Link href="/register">{s.start}</Link>
        </Button>
        <Link href="/catalog" className="group flex items-center gap-1 text-base font-medium text-primary dark:text-success">
          <span className="group-hover:underline group-hover:underline-offset-4">{s.browse}</span>
          <Icon name="chevRight" className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
        </Link>
      </div>
    </section>
  )
}
