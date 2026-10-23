import { redirect } from 'next/navigation'
import { getSession } from '@/entities/session/server'
import { homeFor } from '@/shared/config/nav'

/**
 * `/start` = "my home in the app": the signed-in user's own home screen (by role). Used wherever a
 * link means "back to the app" (the header's Open Budu, the sidebar logo, emails, after joining a
 * school); `/` is the product's public home page for everyone (owner).
 */
export async function StartPage() {
  const user = await getSession()
  redirect(user ? homeFor(user.role) : '/login')
}
