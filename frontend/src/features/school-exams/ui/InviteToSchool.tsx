'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { useT } from '@/shared/i18n'
import { inviteToSchoolAction } from '../server/actions'

/** "Invite to school" for people who passed (one, or all of them). They join when they accept. */
export function InviteToSchool({ quizId, userIds, all = false }: { quizId: number; userIds: number[]; all?: boolean }) {
  const t = useT()
  const s = t.exams.results
  const [pending, start] = useTransition()
  const [done, setDone] = useState<number | null>(null)
  if (done !== null) return <span className="text-sm text-success">{s.invited(done)}</span>
  return (
    <Button
      size="sm"
      variant={all ? 'default' : 'outline'}
      disabled={pending || !userIds.length}
      onClick={() =>
        start(async () => {
          const r = await inviteToSchoolAction(quizId, userIds)
          setDone(r.ok ? r.invited : 0)
        })
      }
    >
      <Icon name="userAdd" />
      {all ? s.inviteAll(userIds.length) : s.invite}
    </Button>
  )
}
