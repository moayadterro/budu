'use client'

import { useActionState } from 'react'
import type { HomeworkDetail } from '@/entities/homework'
import { MAX_UPLOAD_MB } from '@/shared/config/upload'
import { Alert } from '@/shared/ui/alert'
import { FilePicker } from '@/shared/ui/file-picker'
import { Appear } from '@/shared/ui/motion'
import { SubmitButton } from '@/shared/ui/submit-button'
import { Textarea } from '@/shared/ui/textarea'
import { useT } from '@/shared/i18n'
import { submitHomeworkAction, type SubmitState } from '../server/actions'

const idle: SubmitState = { status: 'idle' }

/** The student's answer: text + files. Hand in again to update (until graded). */
export function SubmitHomeworkForm({ homework }: { homework: HomeworkDetail }) {
  const t = useT()
  const s = t.learn
  const [state, action] = useActionState(submitHomeworkAction, idle)
  const resubmit = homework.status === 'submitted'
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.status === 'error' && <Alert variant="destructive">{s.errors[state.error]}</Alert>}
      <input type="hidden" name="homeworkId" value={homework.id} />
      <input type="hidden" name="hadFiles" value={homework.files.length ? '1' : '0'} />
      <Textarea name="answer" defaultValue={homework.answer} placeholder={s.answerPh} className="min-h-32" maxLength={20000} />
      <div className="flex flex-col gap-2">
        <FilePicker name="files" label={s.addFiles} hint={s.filesHint(MAX_UPLOAD_MB)} multiple />
        {homework.files.length > 0 && <p className="text-xs text-muted-foreground">{s.keepFiles}</p>}
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton label={resubmit ? s.resubmit : s.submit} pendingLabel={s.submitting} />
        {state.status === 'submitted' && (
          <Appear key={state.at}>
            <span className="text-sm font-medium text-success">{s.submitted}</span>
          </Appear>
        )}
      </div>
    </form>
  )
}
