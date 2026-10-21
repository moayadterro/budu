'use client'

import { Badge } from './badge'
import { useT } from '@/shared/i18n'

/** An unpublished change of a published course: New / Edited / Will be removed (nothing when published as is). */
export function DraftBadge({ state }: { state: '' | 'new' | 'changed' | 'removed' }) {
  const t = useT()
  if (!state) return null
  const variant = state === 'new' ? 'info' : state === 'changed' ? 'warning' : 'destructive'
  return (
    <Badge variant={variant} className="no-underline">
      {t.courses.draftState[state]}
    </Badge>
  )
}
