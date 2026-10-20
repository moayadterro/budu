'use server'

import { revalidatePath } from 'next/cache'
import { submitHomework } from '@/entities/homework/server'
import { requireRole } from '@/entities/session/server'
import { MAX_UPLOAD_BYTES } from '@/shared/config/upload'
import { formFiles, formId } from '@/shared/lib/form'
import { IomadError } from '@/shared/server/iomad'

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
    await submitHomework(user.userId, homeworkId, answer, files)
  } catch (e) {
    if (e instanceof IomadError && /submissionsclosed/.test(e.code + e.message)) return { status: 'error', error: 'closed' }
    console.error('submit homework failed', e)
    return { status: 'error', error: 'server' }
  }
  revalidatePath('/', 'layout')
  return { status: 'submitted', at: Date.now() }
}
