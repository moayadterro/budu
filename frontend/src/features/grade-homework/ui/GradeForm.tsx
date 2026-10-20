'use client'

import { useActionState } from 'react'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Appear } from '@/shared/ui/motion'
import { SubmitButton } from '@/shared/ui/submit-button'
import { Textarea } from '@/shared/ui/textarea'
import { useT } from '@/shared/i18n'
import { gradeAction, type GradeState } from '../server/actions'

const idle: GradeState = { status: 'idle' }

/** Grade (0–100) + feedback for one answer. `nextHref` = the next answer to grade, if any. */
export function GradeForm({
  homeworkId,
  studentId,
  grade,
  feedback,
  nextHref,
  hereHref,
}: {
  homeworkId: number
  studentId: number
  grade: number | null
  feedback: string
  nextHref: string | null
  /** this answer in the graded list, shown after saving */
  hereHref?: string
}) {
  const t = useT()
  const s = t.grading
  const [state, action] = useActionState(gradeAction, idle)
  return (
    <form action={action} key={`${homeworkId}-${studentId}`}>
      {state.status === 'error' && <Alert variant="destructive" className="mb-4">{s.errors[state.error]}</Alert>}
      <input type="hidden" name="homeworkId" value={homeworkId} />
      <input type="hidden" name="studentId" value={studentId} />
      {hereHref && <input type="hidden" name="here" value={hereHref} />}
      <Field label={s.grade}>
        <Input
          name="grade"
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step="0.5"
          required
          defaultValue={grade ?? ''}
          className="h-12 max-w-32 text-2xl font-semibold tabular-nums"
        />
      </Field>
      <Field label={s.feedback}>
        <Textarea name="feedback" defaultValue={feedback} placeholder={s.feedbackPh} maxLength={5000} />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        {nextHref && (
          <Button type="submit" name="next" value={nextHref}>
            {s.saveNext}
          </Button>
        )}
        <SubmitButton label={s.save} pendingLabel={s.saving} variant={nextHref ? 'outline' : 'default'} />
        {state.status === 'saved' && (
          <Appear key={state.at}>
            <span className="text-sm font-medium text-success">{s.saved}</span>
          </Appear>
        )}
      </div>
    </form>
  )
}
