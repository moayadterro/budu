import 'server-only'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { examSpace, getQuiz } from '@/entities/quiz/server'
import { requireRole } from '@/entities/session/server'
import { isSchool } from '@/entities/tenant/server'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'

/** A school manager and their school's exam space (404 for anyone else). */
export async function managerSpace() {
  const user = await requireRole('manager')
  if (!user.companyId || !(await isSchool(user.companyId))) notFound()
  return { user, companyId: user.companyId, spaceId: await examSpace(user.userId, user.companyId) }
}

/** …and one of this school's exams — an id from another school (or a course quiz) is a 404. */
export async function managerExam(quizIdParam: string) {
  const ctx = await managerSpace()
  const id = Number(quizIdParam)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  const quiz = await getQuiz(ctx.user.userId, id)
  if (!quiz || quiz.courseId !== ctx.spaceId) notFound()
  return { ...ctx, quiz }
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Button variant="ghost" size="sm" className="-ms-2 self-start" asChild>
      <Link href={href}>
        <Icon name="back" className="rtl:-scale-x-100" />
        {label}
      </Link>
    </Button>
  )
}
