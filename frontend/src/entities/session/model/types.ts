import type { Role } from '@/shared/config/nav'

export type SessionUser = {
  userId: number
  role: Role
  companyId: number | null
  name: string
  email: string
}

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
