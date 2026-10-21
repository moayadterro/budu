'use server'

import { listNotifications, markRead, unreadCount } from '@/entities/notification/server'
import type { AppNotification } from '@/entities/notification'
import { getSession } from '@/entities/session/server'

export type Inbox = { items: AppNotification[]; unread: number }

/** The signed-in user's latest notifications (the bell polls this). */
export async function fetchInbox(): Promise<Inbox> {
  const user = await getSession()
  if (!user) return { items: [], unread: 0 }
  const [items, unread] = await Promise.all([listNotifications(user.userId), unreadCount(user.userId)])
  return { items, unread }
}

/** Mark one notification (or, without an id, all) as read. */
export async function markReadAction(id?: number): Promise<Inbox> {
  const user = await getSession()
  if (!user) return { items: [], unread: 0 }
  await markRead(user.userId, typeof id === 'number' && Number.isSafeInteger(id) ? id : undefined)
  return fetchInbox()
}
