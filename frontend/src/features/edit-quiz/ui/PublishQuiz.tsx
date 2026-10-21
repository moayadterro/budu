'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/shared/ui/button'
import { ConfirmButton } from '@/shared/ui/confirm-button'
import { Icon } from '@/shared/ui/icon'
import { Input } from '@/shared/ui/input'
import { LocalTime } from '@/shared/ui/local-time'
import { useT } from '@/shared/i18n'
import { fromLocalInput } from '../lib/time'
import { deleteQuizAction, publishQuizAction } from '../server/actions'

/**
 * Publish now, schedule publishing for a date and time (hidden from students until then; they're told
 * then), or hide. Also delete.
 */
export function PublishQuiz({
  quizId,
  courseId,
  published,
  opensAt,
  base,
}: {
  quizId: number
  courseId: number
  published: boolean
  opensAt: number | null
  /** where to go after deleting: `/courses/:id/quizzes` or `/school/exams` */
  base: string
}) {
  const t = useT()
  const s = t.quiz.publish
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [scheduling, setScheduling] = useState(false)
  const [when, setWhen] = useState('')
  const scheduled = published && !!opensAt && opensAt * 1000 > Date.now()

  const run = (publish: boolean, at: number | null = null) =>
    start(async () => {
      const err = await publishQuizAction(quizId, publish, at)
      setError(err ? s.errors[err] : null)
      if (!err) setScheduling(false)
    })

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {scheduled ? (
          <>
            {s.scheduledFor} <LocalTime seconds={opensAt!} className="font-medium text-foreground" />
          </>
        ) : published ? (
          s.live
        ) : (
          s.draft
        )}
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {(!published || scheduled) && (
        <Button type="button" onClick={() => run(true)} disabled={pending}>
          <Icon name="send" />
          {s.publishNow}
        </Button>
      )}

      {!published &&
        (scheduling ? (
          <div className="flex flex-col gap-2 rounded-lg border p-3">
            <label className="text-sm font-medium" htmlFor={`publish-at-${quizId}`}>
              {s.scheduleAt}
            </label>
            <Input id={`publish-at-${quizId}`} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            <p className="text-xs text-muted-foreground">{s.scheduleHint}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={pending || !when}
                onClick={() => {
                  const at = Number(fromLocalInput(when))
                  if (!at || at * 1000 <= Date.now()) return setError(s.errors.past)
                  run(true, at)
                }}
              >
                {s.schedule}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setScheduling(false)}>
                {t.quiz.q.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="outline" onClick={() => setScheduling(true)} disabled={pending}>
            <Icon name="clock" />
            {s.scheduleButton}
          </Button>
        ))}

      {published && (
        <Button type="button" variant="outline" onClick={() => run(false)} disabled={pending}>
          <Icon name="eyeOff" />
          {scheduled ? s.cancelSchedule : s.hide}
        </Button>
      )}

      <form action={deleteQuizAction}>
        <input type="hidden" name="quizId" value={quizId} />
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="base" value={base} />
        <ConfirmButton label={s.delete} confirmLabel={s.confirmDelete} description={t.confirm.quizDesc} className="w-full" />
      </form>
    </div>
  )
}
