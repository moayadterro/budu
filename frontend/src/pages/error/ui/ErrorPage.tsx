'use client'

import { useT } from '@/shared/i18n'
import { ErrorScreen } from './ErrorScreen'

/** Error boundary for every screen (inside the normal layout, so the UI language is known). */
export function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen t={useT()} error={error} reset={reset} />
}
