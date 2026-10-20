'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { NativeSelect, NativeSelectOption } from './native-select'

/** A select whose options are URLs: choosing one navigates there (filters kept in the URL). */
export function LinkSelect({
  value,
  options,
  label,
  className,
}: {
  value: string
  options: Array<{ href: string; label: string }>
  label: string
  className?: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <NativeSelect
      aria-label={label}
      value={value}
      disabled={pending}
      className={className}
      onChange={(e) => {
        const href = e.target.value
        start(() => router.push(href))
      }}
    >
      {options.map((o) => (
        <NativeSelectOption key={o.href} value={o.href}>
          {o.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}
