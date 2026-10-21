import { notFound, redirect } from 'next/navigation'
import { getAttempt } from '@/entities/quiz/server'
import { requireRole } from '@/entities/session/server'
import { AttemptPlayer } from '@/features/take-quiz'

/** Student: taking a quiz. Finished (or out of time) → the result. */
export async function AttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const user = await requireRole('student')
  const id = Number((await params).attemptId)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  const attempt = await getAttempt(user.userId, id)
  if (!attempt) notFound()
  if (attempt.finished) redirect(`/quiz/${id}/review`)
  return (
    <div className="mx-auto max-w-3xl">
      <AttemptPlayer attempt={attempt} />
    </div>
  )
}
