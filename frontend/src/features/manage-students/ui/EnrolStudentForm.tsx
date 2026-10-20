'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Alert } from '@/shared/ui/alert'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { enrolStudentAction, type EnrolState } from '../server/actions'

const idle: EnrolState = { status: 'idle' }

/** Email field + "Add student". */
export function EnrolStudentForm({ courseId }: { courseId: number }) {
  const t = useT()
  const s = t.teach
  const [state, action] = useActionState(enrolStudentAction, idle)
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state.status === 'enrolled') form.current?.reset()
  }, [state])
  return (
    <form ref={form} action={action} className="flex flex-col gap-3">
      {state.status !== 'idle' && (
        <Alert key={state.at} variant={state.status === 'enrolled' ? 'success' : state.status === 'already' ? 'info' : 'destructive'}>
          {s.enrol[state.status]}
        </Alert>
      )}
      <input type="hidden" name="courseId" value={courseId} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="grid flex-1 gap-2">
          <Label htmlFor="enrol-email">{s.email}</Label>
          <Input id="enrol-email" name="email" type="email" required placeholder={s.emailPh} autoComplete="off" />
        </div>
        <SubmitButton label={s.add} pendingLabel={s.adding} />
      </div>
    </form>
  )
}
