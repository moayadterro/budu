'use client'

import { useActionState, useState } from 'react'
import { REVIEW_LIMITS, Star } from '@/entities/review'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { SubmitButton } from '@/shared/ui/submit-button'
import { Textarea } from '@/shared/ui/textarea'
import { useT } from '@/shared/i18n'
import { dismissRatingAction, rateCourseAction, type RateState } from '../server/actions'

const idle: RateState = { status: 'idle' }

/**
 * "How was this course?" — shown to a student who finished it: five big stars (hover / keyboard),
 * an optional comment, Send; "Not now" hides the ask. Also used to change an earlier rating.
 */
export function RateCourseCard({
  courseId,
  courseTitle,
  mine,
  canDismiss = true,
}: {
  courseId: number
  courseTitle: string
  mine: { stars: number; comment: string } | null
  canDismiss?: boolean
}) {
  const t = useT()
  const s = t.reviews
  const [state, action] = useActionState(rateCourseAction, idle)
  const [stars, setStars] = useState(mine?.stars ?? 0)
  const [hover, setHover] = useState(0)
  const shown = hover || stars
  return (
    <Card>
      <CardHeader>
        <CardTitle>{mine ? s.yourRating : s.askTitle}</CardTitle>
        <CardDescription>{s.askSub(courseTitle)}</CardDescription>
      </CardHeader>
      <CardContent>
        {state.status === 'saved' ? (
          <Alert variant="success">{s.thanks}</Alert>
        ) : (
          <form action={action} className="flex flex-col gap-3">
            <input type="hidden" name="courseId" value={courseId} />
            <input type="hidden" name="stars" value={stars} />
            {state.status === 'error' && <Alert variant="destructive">{s.failed}</Alert>}
            <div role="radiogroup" aria-label={s.starsLabel} className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={stars === n}
                  aria-label={s.starN(n)}
                  onClick={() => setStars(n)}
                  onMouseEnter={() => setHover(n)}
                  className="rounded-md p-0.5 transition-transform outline-none hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Star on={shown >= n} className="text-3xl" />
                </button>
              ))}
              {shown > 0 && <span className="ms-2 text-sm text-muted-foreground">{s.label[shown - 1]}</span>}
            </div>
            <Textarea
              name="comment"
              rows={3}
              maxLength={REVIEW_LIMITS.comment}
              defaultValue={mine?.comment ?? ''}
              placeholder={s.commentPh}
              aria-label={s.commentPh}
            />
            <div className="flex flex-wrap items-center gap-2">
              <SubmitButton label={mine ? s.update : s.send} pendingLabel={s.sending} disabled={stars === 0} />
              {canDismiss && !mine && (
                <Button type="submit" variant="ghost" formAction={dismissRatingAction}>
                  {s.notNow}
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
