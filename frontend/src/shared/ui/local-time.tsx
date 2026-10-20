'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/shared/i18n'

/**
 * A unix timestamp in the viewer's own time zone and the UI language. Rendered after mount,
 * because the server doesn't know the browser's zone (avoids a hydration mismatch).
 */
export function LocalTime({ seconds, className }: { seconds: number; className?: string }) {
  const locale = useLocale()
  const [text, setText] = useState('')
  useEffect(() => {
    setText(new Date(seconds * 1000).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }))
  }, [seconds, locale])
  return (
    <time className={className} dateTime={new Date(seconds * 1000).toISOString()}>
      {text}
    </time>
  )
}
