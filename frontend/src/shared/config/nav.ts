import type { IconName } from '@/shared/ui/icon'
import { t } from '@/shared/i18n'

/**
 * Budu roles. Adding one: extend this union + ROLES, then fix every compile error
 * (NAV, t.role, t.ctx …) and the resolution rules in entities/user/lib/role.ts.
 * See CLAUDE.md → "Roles".
 */
export type Role = 'admin' | 'manager' | 'teacher' | 'student'
export const ROLES: Role[] = ['admin', 'manager', 'teacher', 'student']

export type NavItem = {
  label: string
  icon: IconName
  /** route of the screen; null until that screen is built (rendered disabled) */
  href: string | null
  /** also shown in the mobile bottom bar */
  bottom?: boolean
}

/** Is `path` this nav item's screen or one of its sub-screens? */
export const isActive = (href: string | null, path: string | null) =>
  !!href && !!path && (path === href || path.startsWith(href + '/'))

export const NAV: Record<Role, NavItem[]> = {
  admin: [
    { label: t.nav.tenants, icon: 'layers', href: '/admin', bottom: true },
    { label: t.nav.people, icon: 'users', href: null, bottom: true },
    { label: t.nav.deals, icon: 'store', href: null, bottom: true },
    { label: t.nav.platformSettings, icon: 'gear', href: null },
  ],
  student: [
    { label: t.nav.home, icon: 'grid', href: '/home', bottom: true },
    { label: t.nav.timetable, icon: 'cal', href: '/timetable', bottom: true },
    { label: t.nav.myClasses, icon: 'book', href: '/classes', bottom: true },
    { label: t.nav.explore, icon: 'search', href: '/explore' },
    { label: t.nav.live, icon: 'video', href: '/live', bottom: true },
  ],
  teacher: [
    { label: t.nav.dashboard, icon: 'grid', href: null, bottom: true },
    { label: t.nav.myClasses, icon: 'book', href: null, bottom: true },
    { label: t.nav.courses, icon: 'store', href: '/courses' },
    { label: t.nav.grading, icon: 'check', href: null, bottom: true },
    { label: t.nav.gradebook, icon: 'report', href: null, bottom: true },
    { label: t.nav.live, icon: 'video', href: '/live' },
  ],
  manager: [
    { label: t.nav.school, icon: 'grid', href: null, bottom: true },
    { label: t.nav.classes, icon: 'layers', href: null, bottom: true },
    { label: t.nav.courses, icon: 'store', href: null },
    { label: t.nav.people, icon: 'users', href: null, bottom: true },
    { label: t.nav.gradebook, icon: 'report', href: null, bottom: true },
    { label: t.nav.schedule, icon: 'cal', href: '/timetable' },
    { label: t.nav.settings, icon: 'gear', href: null },
  ],
}

/** Where a role lands after sign-in: its first built screen. */
export const homeFor = (role: Role) => NAV[role].find((i) => i.href)?.href ?? '/account'
