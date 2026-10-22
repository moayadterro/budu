'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/entities/session/server'
import { setGradeScale } from '@/entities/tenant/server'
import { isGradeScale } from '@/shared/lib/grade-scale'
import { audit } from '@/shared/server/audit'

export type ScaleState = { status: 'idle' } | { status: 'saved'; at: number } | { status: 'error' }

/** School manager picks how grades are shown in their school. */
export async function saveGradeScale(_prev: ScaleState, form: FormData): Promise<ScaleState> {
  const user = await requireRole('manager')
  const scale = form.get('scale')
  if (!user.companyId || !isGradeScale(scale)) return { status: 'error' }
  await setGradeScale(user.companyId, scale)
  audit('gradeScaleChanged', { details: { scale } })
  revalidatePath('/', 'layout')
  return { status: 'saved', at: Date.now() }
}
