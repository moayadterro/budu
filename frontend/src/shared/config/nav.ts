import type { IconName } from '@/shared/ui/icon'
import type { Messages } from '@/shared/i18n'

/**
 * Budu roles. Adding one: extend this union + ROLES, then fix every compile error
 * (NAV, t.role …) and the resolution rules in entities/user/lib/role.ts.
 * See CLAUDE.md → "Roles".
 */
export type Role = 'admin' | 'manager' | 'teacher' | 'student' | 'parent'
export const ROLES: Role[] = ['admin', 'manager', 'teacher', 'student', 'parent']

export type NavItem = {
  /** key into t.nav (the label is translated where it's rendered) */
  label: keyof Messages['nav']
  icon: IconName
  /** route of the screen; null until that screen is built (rendered disabled) */
  href: string | null
  /** also shown in the mobile bottom bar */
  bottom?: boolean
  /** only for people in a school (hidden for solo teachers / students) */
  schoolOnly?: boolean
}

/** The nav item for `path`: the longest href that is `path` or a parent of it ('/teach' vs '/teach/classes'). */
export const activeHref = (items: NavItem[], path: string | null) =>
  items
    .filter((i) => isActive(i.href, path))
    .sort((a, b) => b.href!.length - a.href!.length)[0]?.href ?? null

/** Is `path` this nav item's screen or one of its sub-screens? */
export const isActive = (href: string | null, path: string | null) =>
  !!href && !!path && (path === href || path.startsWith(href + '/'))

export const NAV: Record<Role, NavItem[]> = {
  admin: [
    { label: 'tenants', icon: 'layers', href: '/admin', bottom: true },
    { label: 'people', icon: 'users', href: null, bottom: true },
    { label: 'payments', icon: 'wallet', href: '/admin/payments', bottom: true },
    { label: 'deals', icon: 'store', href: null },
    { label: 'platformSettings', icon: 'gear', href: '/admin/settings' },
  ],
  student: [
    { label: 'home', icon: 'grid', href: '/home', bottom: true },
    { label: 'timetable', icon: 'cal', href: '/timetable', bottom: true },
    { label: 'myCourses', icon: 'book', href: '/classes', bottom: true },
    { label: 'explore', icon: 'search', href: '/explore' },
    { label: 'live', icon: 'video', href: '/live', bottom: true },
  ],
  teacher: [
    { label: 'dashboard', icon: 'grid', href: '/teach', bottom: true },
    { label: 'myCourses', icon: 'book', href: '/courses', bottom: true },
    { label: 'myClasses', icon: 'layers', href: '/teach/classes', schoolOnly: true },
    { label: 'timetable', icon: 'cal', href: '/timetable' },
    { label: 'grading', icon: 'check', href: '/grading', bottom: true },
    { label: 'gradebook', icon: 'report', href: '/gradebook', bottom: true },
    { label: 'live', icon: 'video', href: '/live' },
    { label: 'messages', icon: 'chat', href: '/messages', bottom: true },
  ],
  parent: [
    { label: 'family', icon: 'grid', href: '/family', bottom: true },
    { label: 'messages', icon: 'chat', href: '/messages', bottom: true },
  ],
  manager: [
    { label: 'school', icon: 'grid', href: '/school', bottom: true },
    { label: 'people', icon: 'users', href: '/school/people', bottom: true },
    { label: 'courses', icon: 'store', href: '/school/courses' },
    { label: 'gradebook', icon: 'report', href: '/gradebook', bottom: true },
    { label: 'classes', icon: 'layers', href: '/school/classes', bottom: true },
    { label: 'schedule', icon: 'cal', href: '/timetable' },
    { label: 'settings', icon: 'gear', href: '/school/settings' },
  ],
}

/** Where a role lands after sign-in: its first built screen. */
export const homeFor = (role: Role) => NAV[role].find((i) => i.href)?.href ?? '/account'
