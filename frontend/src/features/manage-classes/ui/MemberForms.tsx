'use client'

import { useActionState } from 'react'
import type { Person } from '@/shared/lib/person'
import { Alert } from '@/shared/ui/alert'
import { ConfirmButton } from '@/shared/ui/confirm-button'
import { Appear } from '@/shared/ui/motion'
import { PersonAvatar } from '@/shared/ui/person-avatar'
import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import {
  addStudentsAction,
  removeFromClassAction,
  saveClassTeachersAction,
  type ClassFormState,
} from '../server/actions'

const idle: ClassFormState = { status: 'idle' }

/** A checkbox row for a person. */
function PersonCheck({ name, person, checked }: { name: string; person: Person & { note?: string }; checked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/60">
      <input type="checkbox" name={name} value={person.id} defaultChecked={checked} className="size-4 accent-primary" />
      <PersonAvatar person={person} className="size-7" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{person.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{person.email}</span>
      </span>
      {person.note && <span className="flex-none rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">{person.note}</span>}
    </label>
  )
}

/** Manager: pick school students (not yet in the class) to add. */
export function AddStudentsForm({ classId, candidates }: { classId: number; candidates: Array<Person & { note?: string }> }) {
  const t = useT()
  const s = t.classes
  const [state, action] = useActionState(addStudentsAction, idle)
  if (candidates.length === 0) return <p className="text-sm text-muted-foreground">{s.allIn}</p>
  return (
    <form action={action} className="flex flex-col gap-3" key={candidates.map((c) => c.id).join(',')}>
      {state.status === 'error' && <Alert variant="destructive">{t.courses.errors.invalid}</Alert>}
      <input type="hidden" name="classId" value={classId} />
      <p className="text-sm font-medium">{s.pickStudents}</p>
      <div className="flex max-h-64 flex-col overflow-y-auto rounded-lg border p-1">
        {candidates.map((p) => (
          <PersonCheck key={p.id} name="studentId" person={p} />
        ))}
      </div>
      <div>
        <SubmitButton label={s.addStudents} pendingLabel={s.adding} />
      </div>
    </form>
  )
}

export function RemoveFromClassButton({ classId, studentId }: { classId: number; studentId: number }) {
  const t = useT()
  return (
    <form action={removeFromClassAction}>
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="studentId" value={studentId} />
      <ConfirmButton label={t.classes.remove} confirmLabel={t.classes.confirmRemove} />
    </form>
  )
}

/** Manager: tick the school's teachers who manage this class (may be none). */
export function ClassTeachersForm({ classId, teachers, current }: { classId: number; teachers: Person[]; current: number[] }) {
  const t = useT()
  const s = t.classes
  const [state, action] = useActionState(saveClassTeachersAction, idle)
  return (
    <form action={action} className="flex flex-col gap-3">
      {state.status === 'error' && <Alert variant="destructive">{t.courses.errors.server}</Alert>}
      <input type="hidden" name="classId" value={classId} />
      <div className="flex max-h-64 flex-col overflow-y-auto rounded-lg border p-1">
        {teachers.map((p) => (
          <PersonCheck key={p.id} name="teacherId" person={p} checked={current.includes(p.id)} />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton label={s.saveTeachers} pendingLabel={s.saving} variant="outline" />
        {state.status === 'saved' && (
          <Appear key={state.at}>
            <span className="text-sm font-medium text-success">{s.saved}</span>
          </Appear>
        )}
      </div>
    </form>
  )
}
