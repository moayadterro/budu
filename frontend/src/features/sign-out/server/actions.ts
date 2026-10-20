'use server'

import { redirect } from 'next/navigation'
import { destroySession } from '@/entities/session/server'

export async function signOut() {
  await destroySession()
  redirect('/login')
}
