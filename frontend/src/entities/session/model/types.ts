import type { Role } from '@/shared/config/nav'

export type SessionUser = {
  userId: number
  role: Role
  companyId: number | null
  name: string
  email: string
  /** IOMAD profile picture file id, or null (initials are shown) */
  pictureId: number | null
}

/** Browser URL of a profile picture (served by the /files route). */
export const pictureUrl = (pictureId: number | null) => (pictureId ? `/files/${pictureId}` : null)

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
