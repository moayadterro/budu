'use server'

import { revalidatePath } from 'next/cache'
import { submitHomework } from '@/entities/homework/server'
import { notify } from '@/entities/notification/server'
import { requireRole } from '@/entities/session/server'
import { MAX_UPLOAD_BYTES } from '@/shared/config/upload'
import { formFiles, formId } from '@/shared/lib/form'
import { IomadError } from '@/shared/server/iomad'
import { reportError } from '@/shared/server/errors'
import { audit } from '@/shared/server/audit'

export type SubmitState =
  | { status: 'idle' }
  | { status: 'submitted'; at: number }
  | { status: 'error'; error: 'empty' | 'tooBig' | 'closed' | 'server' }

const ANSWER_MAX = 20000

/** Hands in the student's answer (text and/or files) to IOMAD. */
export async function submitHomeworkAction(_prev: SubmitState, form: FormData): Promise<SubmitState> {
  const user = await requireRole('student')
  const homeworkId = formId(form, 'homeworkId')
  const answer = String(form.get('answer') ?? '').trim().slice(0, ANSWER_MAX)
  const files = formFiles(form, 'files')
  const hadFiles = form.get('hadFiles') === '1'
  if (!homeworkId || (!answer && !files.length && !hadFiles)) return { status: 'error', error: 'empty' }
  if (files.some((f) => f.size > MAX_UPLOAD_BYTES)) return { status: 'error', error: 'tooBig' }
  try {
    const r = await submitHomework(user.userId, homeworkId, answer, files)
    audit('homeworkSubmitted', { target: `homework ${homeworkId}`, details: { files: files.length } })
    await notify(
      r.teachers.map((p) => ({ id: p.id, email: p.email, name: p.name })),
      'homeworkSubmitted',
      { student: r.student.name, homework: r.homeworkTitle, course: r.courseTitle },
      `/grading?homework=${r.homeworkId}&student=${r.student.id}`,
    )
  } catch (e) {
    if (e instanceof IomadError && /submissionsclosed/.test(e.code + e.message)) return { status: 'error', error: 'closed' }
    reportError('submit homework failed', e)
    return { status: 'error', error: 'server' }
  }
  revalidatePath('/', 'layout')
  return { status: 'submitted', at: Date.now() }
}
