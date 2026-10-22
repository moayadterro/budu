export type ProfileError =
  | 'invalid'
  | 'tooLong'
  | 'notImage'
  | 'tooBig'
  | 'wrongPassword'
  | 'locked'
  | 'weak'
  | 'server'
export type ProfileState = { status: 'idle' } | { status: 'saved'; at: number } | { status: 'error'; error: ProfileError }

export const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024
export const NAME_MAX = 100
