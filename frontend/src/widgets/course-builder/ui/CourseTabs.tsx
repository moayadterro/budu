'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/lib/cn'
import { useT } from '@/shared/i18n'

/** Content | Students tabs of a teacher's course (two routes). */
export function CourseTabs({ courseId }: { courseId: number }) {
  const t = useT()
  const path = usePathname()
  const tabs = [
    { href: `/courses/${courseId}`, label: t.courses.tabs.content },
    { href: `/courses/${courseId}/students`, label: t.courses.tabs.students },
  ]
  return (
    <nav className="mb-6 inline-flex rounded-lg bg-muted p-1 text-sm">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={path === tab.href ? 'page' : undefined}
          className={cn(
            'rounded-md px-4 py-1.5 font-medium transition-colors',
            path === tab.href ? 'bg-background shadow-xs' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
