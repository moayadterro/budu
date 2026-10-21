'use client'

import { SubmitButton } from '@/shared/ui/submit-button'
import { useT } from '@/shared/i18n'
import { startAttemptAction } from '../server/actions'

/** Start / Continue a quiz. */
export function StartQuiz({ quizId, inProgress, label, secondary = false }: { quizId: number; inProgress: boolean; label?: string; secondary?: boolean }) {
  const t = useT()
  const s = t.quiz.take
  return (
    <form action={startAttemptAction}>
      <input type="hidden" name="quizId" value={quizId} />
      <SubmitButton className="w-full" variant={secondary ? 'outline' : 'default'} label={label ?? (inProgress ? s.continue : s.start)} pendingLabel={s.starting} />
    </form>
  )
}
