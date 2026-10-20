/** A user as shown next to content (student lists, submissions). Data shape, no business rules. */
export type Person = { id: number; name: string; email: string; pictureId: number | null }

type RawPerson = { id: number; name: string; email: string; picture: number }
export const toPerson = (p: RawPerson): Person => ({ id: p.id, name: p.name, email: p.email, pictureId: p.picture || null })
export type { RawPerson }

/** Browser URL of a profile picture (served by the /files route). */
export const pictureSrc = (pictureId: number | null) => (pictureId ? `/files/${pictureId}` : null)

/** "Maria Ivanova" → "MI" */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
