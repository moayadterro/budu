import type { IconName } from '@/shared/ui/icon'
import type { Messages } from '@/shared/i18n'

/**
 * Budu roles. Adding one: extend this union + ROLES, then fix every compile error
 * (NAV, t.role, t.ctx …) and the resolution rules in entities/user/lib/role.ts.
 * See CLAUDE.md → "Roles".
 */
export type Role = 'admin' | 'manager' | 'teacher' | 'student'
export const ROLES: Role[] = ['admin', 'manager', 'teacher', 'student']

export type NavItem = {
  /** key into t.nav (the label is translated where it's rendered) */
  label: keyof Messages['nav']
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
    { label: 'tenants', icon: 'layers', href: '/admin', bottom: true },
    { label: 'people', icon: 'users', href: null, bottom: true },
    { label: 'deals', icon: 'store', href: null, bottom: true },
    { label: 'platformSettings', icon: 'gear', href: null },
  ],
  student: [
    { label: 'home', icon: 'grid', href: '/home', bottom: true },
    { label: 'timetable', icon: 'cal', href: '/timetable', bottom: true },
    { label: 'myClasses', icon: 'book', href: '/classes', bottom: true },
    { label: 'explore', icon: 'search', href: '/explore' },
    { label: 'live', icon: 'video', href: '/live', bottom: true },
  ],
  teacher: [
    { label: 'dashboard', icon: 'grid', href: null, bottom: true },
    { label: 'myClasses', icon: 'book', href: null, bottom: true },
    { label: 'courses', icon: 'store', href: '/courses' },
    { label: 'grading', icon: 'check', href: null, bottom: true },
    { label: 'gradebook', icon: 'report', href: null, bottom: true },
    { label: 'live', icon: 'video', href: '/live' },
  ],
  manager: [
    { label: 'school', icon: 'grid', href: null, bottom: true },
    { label: 'classes', icon: 'layers', href: null, bottom: true },
    { label: 'courses', icon: 'store', href: null },
    { label: 'people', icon: 'users', href: null, bottom: true },
    { label: 'gradebook', icon: 'report', href: null, bottom: true },
    { label: 'schedule', icon: 'cal', href: '/timetable' },
    { label: 'settings', icon: 'gear', href: null },
  ],
}

/** Where a role lands after sign-in: its first built screen. */
export const homeFor = (role: Role) => NAV[role].find((i) => i.href)?.href ?? '/account'
