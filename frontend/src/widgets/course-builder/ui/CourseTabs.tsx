'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'

/** The tab for `href` is active on it and its sub-pages (the content tab only on itself). */
const isTab = (href: string, path: string | null) => path === href || (!!path && /\/(quizzes|schedule|students|announcements)$/.test(href) && path.startsWith(href + '/'))

/** Content | Students | Quizzes | Schedule | Announcements tabs of a teacher's course. */
export function CourseTabs({ courseId }: { courseId: number }) {
  const t = useT()
  const path = usePathname()
  const tabs = [
    { href: `/courses/${courseId}`, label: t.courses.tabs.content },
    { href: `/courses/${courseId}/students`, label: t.courses.tabs.students },
    { href: `/courses/${courseId}/quizzes`, label: t.courses.tabs.quizzes },
    { href: `/courses/${courseId}/schedule`, label: t.courses.tabs.schedule },
    { href: `/courses/${courseId}/announcements`, label: t.courses.tabs.announcements },
  ]
  return (
    <nav className="mb-6 inline-flex max-w-full overflow-x-auto rounded-lg bg-muted p-1 text-sm">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={isTab(tab.href, path) ? 'page' : undefined}
          className={cn(
            'rounded-md px-4 py-1.5 font-medium whitespace-nowrap transition-colors',
            isTab(tab.href, path) ? 'bg-background shadow-xs' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
