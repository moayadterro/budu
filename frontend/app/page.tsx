import { redirect } from 'next/navigation'
import { getSession } from '@/entities/session/server'
import { homeFor } from '@/shared/config/nav'

export const dynamic = 'force-dynamic'

export default async function Root() {
  const session = await getSession()
  redirect(session ? homeFor(session.role) : '/login')
}
