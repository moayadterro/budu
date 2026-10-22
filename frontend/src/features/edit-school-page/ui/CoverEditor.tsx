'use client'

import { useRouter } from 'next/navigation'
import { setCoverAction } from '../server/actions'
import { CoverField } from './PhotoUpload'

/** The page's cover photo (shown behind the school's name). */
export function CoverEditor({ value }: { value: number | null }) {
  const router = useRouter()
  return (
    <CoverField
      value={value}
      onSave={async (id) => {
        await setCoverAction(id)
        router.refresh()
      }}
    />
  )
}
