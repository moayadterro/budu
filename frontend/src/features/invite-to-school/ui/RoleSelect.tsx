'use client'

import { useTransition } from 'react'
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select'
import { useT } from '@/shared/i18n'
import { changeSchoolRole } from '../server/actions'

type SchoolRole = 'manager' | 'teacher' | 'student'

/** Role of one person in the school; changing it saves at once. */
export function RoleSelect({ userId, role }: { userId: number; role: SchoolRole }) {
  const t = useT()
  const [pending, start] = useTransition()
  return (
    <NativeSelect
      size="sm"
      aria-label={t.school.role}
      value={role}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as SchoolRole
        start(() => changeSchoolRole(userId, next))
      }}
    >
      {(['student', 'teacher', 'manager'] as const).map((r) => (
        <NativeSelectOption key={r} value={r}>
          {t.role[r]}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}
