'use client'

import { useEffect, useState } from 'react'

/**
 * A unix timestamp shown in the viewer's own time zone. Rendered after mount,
 * because the server doesn't know the browser's zone (avoids a hydration mismatch).
 */
export function LocalTime({ seconds, className }: { seconds: number; className?: string }) {
  const [text, setText] = useState('')
  useEffect(() => {
    setText(new Date(seconds * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }))
  }, [seconds])
  return (
    <time className={className} dateTime={new Date(seconds * 1000).toISOString()}>
      {text}
    </time>
  )
}
